import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { discoverSiteDocuments } from "./content-files.mts";
import { compileCatalog } from "./content-lib.mts";

const root = process.cwd();
const contentDirectory = path.join(root, "content");
const outputDirectory = path.join(root, "src", "generated");
const outputPath = path.join(outputDirectory, "sites.json");
const temporaryPath = path.join(outputDirectory, "sites.json.next");

const categoriesYaml = await readFile(path.join(contentDirectory, "categories.yml"), "utf8");
const documents = await discoverSiteDocuments(path.join(contentDirectory, "sites"), root);

const catalog = compileCatalog(categoriesYaml, documents);
await mkdir(outputDirectory, { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
await rename(temporaryPath, outputPath);

console.log(`Generated ${catalog.sites.length} sites across ${catalog.categories.length} categories.`);
