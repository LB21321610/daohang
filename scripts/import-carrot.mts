import path from "node:path";

import { importCarrotMarkdown } from "./carrot-import-lib.mts";

const sourceUrl = "https://raw.githubusercontent.com/xx025/carrot/main/README.md";
const response = await fetch(sourceUrl, {
  headers: { "User-Agent": "personal-navigation-importer" },
});

if (!response.ok) {
  throw new Error(`Unable to fetch carrot README: ${response.status} ${response.statusText}`);
}

const markdown = await response.text();
const outputDirectory = path.join(process.cwd(), "content", "imports");
const outputPath = path.join(outputDirectory, "carrot.generated.yml");
const sites = await importCarrotMarkdown(markdown, outputPath);
const categories = new Set(sites.flatMap((site) => site.tags));

console.log(`Imported ${sites.length} unique carrot sites across ${categories.size} categories for review.`);
