import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { checkLinks, type LinkCheckStatus } from "./link-check-lib.mts";
import { discoverSiteDocuments } from "./content-files.mts";
import { compileCatalog } from "./content-lib.mts";

interface LinkCheckSummary {
  total: number;
  byStatus: Partial<Record<LinkCheckStatus, number>>;
}

function summarize(statuses: LinkCheckStatus[]): LinkCheckSummary {
  const byStatus: Partial<Record<LinkCheckStatus, number>> = {};
  for (const status of statuses) byStatus[status] = (byStatus[status] ?? 0) + 1;
  return { total: statuses.length, byStatus };
}

function parseArguments(arguments_: string[]): { json: boolean } {
  if (arguments_.some((argument) => argument !== "--json")) {
    throw new Error("用法: npm run links:check -- [--json]");
  }
  return { json: arguments_.includes("--json") };
}

export async function main(arguments_ = process.argv.slice(2)): Promise<void> {
  const { json } = parseArguments(arguments_);
  const rootDirectory = process.cwd();
  const categoriesPath = path.join(rootDirectory, "content", "categories.yml");
  const sitesDirectory = path.join(rootDirectory, "content", "sites");
  const [categoriesYaml, siteDocuments] = await Promise.all([
    readFile(categoriesPath, "utf8"),
    discoverSiteDocuments(sitesDirectory, rootDirectory),
  ]);
  const catalog = compileCatalog(categoriesYaml, siteDocuments);
  const urls = catalog.sites.flatMap((site) => (site.linkStatus === "unavailable" ? [] : [site.url]));
  const results = await checkLinks(urls, {
    onProgress: json
      ? undefined
      : (completed, total, result) => {
          const hostname = new URL(result.url).hostname;
          process.stderr.write(`[${completed}/${total}] ${hostname} ${result.status}\n`);
        },
  });
  const summary = summarize(results.map((result) => result.status));

  if (json) {
    const jsonResults = results.map((result) => ({
      ...result,
      finalUrl: result.finalUrl ?? null,
      statusCode: result.statusCode ?? null,
      title: result.title ?? null,
    }));
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), summary, results: jsonResults }, null, 2));
    return;
  }

  for (const result of results) {
    console.log(
      [
        result.url,
        `status=${result.status}`,
        `http=${result.statusCode ?? "-"}`,
        `finalUrl=${result.finalUrl ?? "-"}`,
        `title=${result.title ?? "-"}`,
        `reason=${result.reason}`,
      ].join("\t"),
    );
  }
  console.log(`\n总计: ${summary.total}`);
  for (const [status, count] of Object.entries(summary.byStatus)) console.log(`${status}: ${count}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
