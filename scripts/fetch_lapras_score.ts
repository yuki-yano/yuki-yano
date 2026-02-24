import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";

const PROFILE_URL = "https://lapras.com/public/Y5XCY3M";
const OUTPUT_DIR = "lapras";
const OUTPUT_PATH = `${OUTPUT_DIR}/score.png`;

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch HTML (${response.status}): ${url}`);
  }
  return await response.text();
};

const fetchBytes = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}): ${url}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};

const html = await fetchText(PROFILE_URL);
const doc = new DOMParser().parseFromString(html, "text/html");
const thumbnailUrl = doc?.querySelector("meta[name='twitter:image']")
  ?.getAttribute("content");

if (!thumbnailUrl) {
  throw new Error("twitter:image meta tag not found on LAPRAS profile page");
}

const imageBytes = await fetchBytes(thumbnailUrl);
await Deno.mkdir(OUTPUT_DIR, { recursive: true });
await Deno.writeFile(OUTPUT_PATH, imageBytes);
console.log(`updated ${OUTPUT_PATH}`);
