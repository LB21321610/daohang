import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { SiteDocument } from "./content-lib.mts";

const englishCollator = new Intl.Collator("en");

function compareEnglishFileNames(left: string, right: string): number {
  return englishCollator.compare(left, right) || (left < right ? -1 : left > right ? 1 : 0);
}

export async function discoverSiteDocuments(
  siteDirectory: string,
  rootDirectory = process.cwd(),
): Promise<SiteDocument[]> {
  const entries = await readdir(siteDirectory, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith(".") && entry.name.endsWith(".yml"))
    .map((entry) => entry.name)
    .sort(compareEnglishFileNames);

  return Promise.all(
    fileNames.map(async (fileName) => {
      const absolutePath = path.join(siteDirectory, fileName);
      return {
        path: path.relative(rootDirectory, absolutePath).split(path.sep).join("/"),
        yaml: await readFile(absolutePath, "utf8"),
      };
    }),
  );
}
