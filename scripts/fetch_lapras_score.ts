import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";

const response = await fetch("https://lapras.com/public/Y5XCY3M");
const html = await response.text();
const doc = new DOMParser().parseFromString(html, "text/html");

const thumbnailUrl = doc?.querySelector("meta[name='twitter:image']")
  ?.getAttribute("content");

if (thumbnailUrl == null) {
  Deno.exit(1);
}

const imageResponse = await fetch(thumbnailUrl);
const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());

if (!existsSync("./lapras")) {
  Deno.mkdirSync("./lapras");
}
Deno.writeFileSync("./lapras/score.png", imageBytes);
