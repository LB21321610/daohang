import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";

import {
  AWESOME_MAC_CATEGORY,
  buildAwesomeMacSites,
  chineseDescriptionFor,
  parseAwesomeMacChineseDescriptions,
  parseAwesomeMacMarkdown,
  parseDescriptions,
  parseLinkAudit,
  stringifyAwesomeMacSites,
} from "./awesome-mac-import-lib.mts";
import { discoverSiteDocuments } from "./content-files.mts";
import { compileCatalog } from "./content-lib.mts";

const upstreamBase = "https://raw.githubusercontent.com/jaywcjlove/awesome-mac/master";
const root = process.cwd();
const contentDirectory = path.join(root, "content");
const outputPath = path.join(contentDirectory, "sites", `${AWESOME_MAC_CATEGORY}.yml`);

async function fetchReadme(fileName: string): Promise<string> {
  // `--from <dir>` reads previously downloaded READMEs instead of hitting GitHub.
  const fromIndex = process.argv.indexOf("--from");
  const localDirectory = fromIndex === -1 ? undefined : process.argv[fromIndex + 1];
  if (localDirectory) return readFile(path.resolve(localDirectory, fileName), "utf8");

  const response = await fetch(`${upstreamBase}/${fileName}`, {
    headers: { "User-Agent": "personal-navigation-importer" },
  });
  if (!response.ok) {
    throw new Error(`Unable to fetch awesome-mac ${fileName}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

const [englishReadme, chineseReadme, descriptionsYaml, auditYaml, categoriesYaml, documents] = await Promise.all([
  fetchReadme("README.md"),
  fetchReadme("README-zh.md"),
  readFile(path.join(contentDirectory, "awesome-mac", "descriptions.zh.yml"), "utf8"),
  readFile(path.join(contentDirectory, "awesome-mac", "link-audit.yml"), "utf8"),
  readFile(path.join(contentDirectory, "categories.yml"), "utf8"),
  discoverSiteDocuments(path.join(contentDirectory, "sites"), root),
]);

// Sites already curated elsewhere keep their place; the import skips their URLs.
const isAwesomeMacDocument = (document: { path: string }) => document.path.endsWith(`/${AWESOME_MAC_CATEGORY}.yml`);
const otherDocuments = documents.filter((document) => !isAwesomeMacDocument(document));
const previousYaml = documents.find(isAwesomeMacDocument)?.yaml;
const previousSites = (previousYaml ? parse(previousYaml) : null) as Array<{ id: string; url: string }> | null;
const reservedUrls = compileCatalog(categoriesYaml, otherDocuments).sites.flatMap((site) =>
  site.linkStatus === "unavailable" ? [] : [site.url],
);

const chinese = parseAwesomeMacChineseDescriptions(chineseReadme);
const entries = parseAwesomeMacMarkdown(englishReadme).map((entry) => ({
  ...entry,
  description: chineseDescriptionFor(entry, chinese) ?? entry.description,
}));
const audit = parseLinkAudit(auditYaml);
const sites = buildAwesomeMacSites(entries, {
  audit,
  descriptions: parseDescriptions(descriptionsYaml),
  onWarning: (message) => console.warn(message),
  previousIds: (previousSites ?? []).map((site) => [site.url, site.id] as const),
  reservedUrls,
});

const untranslated = sites.filter((site) => !/\p{Script=Han}/u.test(site.description));
const temporaryPath = `${outputPath}.next`;
await writeFile(temporaryPath, stringifyAwesomeMacSites(sites), "utf8");
await rename(temporaryPath, outputPath);

console.log(
  `Imported ${sites.length} awesome-mac sites (${entries.length} upstream entries, ` +
    `${audit.removed.length} removed after link audit, ${sites.filter((site) => site.linkStatus === "verified").length} verified).`,
);
if (untranslated.length) {
  console.warn(
    `${untranslated.length} descriptions are still English; add them to content/awesome-mac/descriptions.zh.yml:\n` +
      untranslated.map((site) => `  ${site.url}`).join("\n"),
  );
}
