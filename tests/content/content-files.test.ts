import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, it } from "vitest";

import { discoverSiteDocuments } from "../../scripts/content-files.mts";

it("discovers only direct regular visible .yml files in deterministic English order", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "content-files-"));
  try {
    const sitesDirectory = path.join(root, "content", "sites");
    await mkdir(path.join(sitesDirectory, "nested"), { recursive: true });
    await Promise.all([
      writeFile(path.join(sitesDirectory, "zeta.yml"), "zeta"),
      writeFile(path.join(sitesDirectory, "Bravo.yml"), "bravo"),
      writeFile(path.join(sitesDirectory, "alpha.yml"), "alpha"),
      writeFile(path.join(sitesDirectory, ".hidden.yml"), "hidden"),
      writeFile(path.join(sitesDirectory, "ignored.yaml"), "yaml"),
      writeFile(path.join(sitesDirectory, "ignored.txt"), "text"),
      writeFile(path.join(sitesDirectory, "nested", "nested.yml"), "nested"),
    ]);
    await symlink(path.join(sitesDirectory, "alpha.yml"), path.join(sitesDirectory, "linked.yml"));

    const documents = await discoverSiteDocuments(sitesDirectory, root);

    expect(documents).toEqual([
      { path: "content/sites/alpha.yml", yaml: "alpha" },
      { path: "content/sites/Bravo.yml", yaml: "bravo" },
      { path: "content/sites/zeta.yml", yaml: "zeta" },
    ]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
