const OWNER = "yuki-yano";
const REPOSITORIES = [
  "zeno.zsh",
  "vde-monitor",
  "vde-layout",
  "fzf-preview.vim",
  "dotfiles",
] as const;

const DESCRIPTION_OVERRIDES: Record<(typeof REPOSITORIES)[number], string> = {
  "zeno.zsh": "zsh fuzzy completion and utility plugin with Deno.",
  "vde-monitor": "Developer environment monitor and status tooling.",
  "vde-layout": "Layout utilities for development environment operations.",
  "fzf-preview.vim": "Powerful integration between fzf and (Neo)vim.",
  "dotfiles": "My configuration files.",
};

const OUTPUT_DIR = "assets/repo-cards";
const GITHUB_API_BASE = "https://api.github.com/repos";
const FETCH_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

type RepoApiResponse = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  language: string | null;
};

const token = Deno.env.get("GITHUB_TOKEN") ?? "";

const headers: HeadersInit = {
  "Accept": "application/vnd.github+json",
  "User-Agent": "yuki-yano-profile-readme-bot",
};
if (token) headers["Authorization"] = `Bearer ${token}`;

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1)}...`;

const formatDate = (iso: string): string => iso.slice(0, 10);
const formatStars = (count: number): string => count.toLocaleString("en-US");

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const cardSvg = (repo: RepoApiResponse): string => {
  const fallback = DESCRIPTION_OVERRIDES[repo.name as (typeof REPOSITORIES)[number]];
  const description = truncate(repo.description ?? fallback ?? "No description provided.", 88);
  const language = repo.language ?? "Unknown";
  const pushed = formatDate(repo.pushed_at);
  const stars = formatStars(repo.stargazers_count);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="180" viewBox="0 0 560 180" role="img" aria-label="${escapeXml(repo.name)} repository card">
  <defs>
    <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#eef2ff"/>
    </linearGradient>
    <linearGradient id="chip-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <style>
      .title { font: 700 26px "Avenir Next", "Segoe UI", sans-serif; fill: #0f172a; }
      .desc { font: 500 15px "Avenir Next", "Segoe UI", sans-serif; fill: #475569; }
      .meta { font: 600 14px "SF Mono", Menlo, Consolas, monospace; fill: #334155; }
      .lang { font: 700 13px "SF Mono", Menlo, Consolas, monospace; fill: #0f172a; }
    </style>
  </defs>
  <rect width="560" height="180" rx="20" fill="url(#card-bg)"/>
  <rect x="400" y="16" width="136" height="30" rx="15" fill="url(#chip-bg)"/>
  <text x="418" y="36" class="meta">★ ${stars}</text>
  <text x="24" y="48" class="title">${escapeXml(repo.name)}</text>
  <text x="24" y="82" class="desc">${escapeXml(description)}</text>
  <text x="24" y="120" class="meta">last push: ${pushed}</text>
  <circle cx="24" cy="148" r="6" fill="#2563eb"/>
  <text x="38" y="153" class="lang">${escapeXml(language)}</text>
</svg>
`;
};

const fetchRepository = async (name: string): Promise<RepoApiResponse> => {
  const endpoint = `${GITHUB_API_BASE}/${OWNER}/${name}`;

  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    const response = await fetch(endpoint, { headers });
    if (response.ok) {
      return await response.json() as RepoApiResponse;
    }

    const body = await response.text();
    const message = `Failed to fetch ${OWNER}/${name}: ${response.status} ${body}`;
    if (attempt >= FETCH_RETRIES) {
      throw new Error(message);
    }

    console.warn(`${message} (retry ${attempt}/${FETCH_RETRIES})`);
    await sleep(RETRY_DELAY_MS * attempt);
  }

  throw new Error(`Unreachable: fetch retries exhausted for ${OWNER}/${name}`);
};

await Deno.mkdir(OUTPUT_DIR, { recursive: true });

for (const name of REPOSITORIES) {
  const repo = await fetchRepository(name);
  const svg = cardSvg(repo);
  const outputPath = `${OUTPUT_DIR}/${name}.svg`;
  const existing = await Deno.readTextFile(outputPath).catch(() => "");
  if (existing === svg) {
    console.log(`unchanged ${outputPath}`);
    continue;
  }
  await Deno.writeTextFile(outputPath, svg);
  console.log(`updated ${outputPath}`);
}
