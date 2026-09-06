import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { discoverSiteDocuments } from "../../scripts/content-files.mts";
import { compileCatalog } from "../../scripts/content-lib.mts";
import { searchSites } from "../../src/domain/search";

async function loadCatalog() {
  const contentDirectory = path.join(process.cwd(), "content");
  return compileCatalog(
    await readFile(path.join(contentDirectory, "categories.yml"), "utf8"),
    await discoverSiteDocuments(path.join(contentDirectory, "sites"), process.cwd()),
  );
}

describe("audio catalog", () => {
  it("publishes all 130 supplied products in the eight intended sections", async () => {
    const catalog = await loadCatalog();
    const audioSites = catalog.sites.filter((site) => site.category === "audio");
    const sectionCounts = Object.fromEntries(
      [...new Set(audioSites.map((site) => site.section))].map((section) => [
        section,
        audioSites.filter((site) => site.section === section).length,
      ]),
    );

    expect(audioSites).toHaveLength(130);
    expect(sectionCounts).toEqual({
      "daw-dj": 6,
      bundles: 13,
      "mixing-mastering": 26,
      "vocals-repair": 12,
      instruments: 38,
      "reverb-effects": 19,
      "drums-rhythm": 3,
      "guitar-bass": 13,
    });
  });

  it("keeps verified reachability separate from content risk review", async () => {
    const catalog = await loadCatalog();
    const audioSites = catalog.sites.filter((site) => site.category === "audio");
    const logicPro = audioSites.find((site) => site.id === "logic-pro");
    const thirdParty = audioSites.filter((site) => new URL(site.url!).hostname === "appstorrent.ru");
    const official = audioSites.filter((site) => !thirdParty.includes(site));

    expect(logicPro).toMatchObject({
      url: "https://apps.apple.com/us/app/logic-pro/id634148309?mt=12",
      section: "daw-dj",
      riskLevel: "standard",
      reviewStatus: "verified",
      linkStatus: "verified",
    });
    expect(official).toHaveLength(6);
    expect(official.every((site) => site.riskLevel === "standard" && site.reviewStatus === "verified")).toBe(true);
    expect(thirdParty).toHaveLength(124);
    expect(thirdParty.every((site) => site.riskLevel === "high" && site.reviewStatus === "unverified")).toBe(true);
    expect(audioSites.every((site) => site.linkStatus === "verified")).toBe(true);
  });

  it("keeps corrected classifications and makes brands and aliases searchable", async () => {
    const catalog = await loadCatalog();
    const sites = new Map(catalog.sites.map((site) => [site.id, site]));

    expect(sites.get("neural-dsp-mantra")?.section).toBe("vocals-repair");
    expect(sites.get("native-instruments-maschine")?.section).toBe("drums-rhythm");
    expect(sites.get("native-instruments-komplete-kontrol")?.section).toBe("instruments");
    expect(sites.get("native-instruments-komplete-fx-bundle")).toMatchObject({
      name: "Native Instruments KOMPLETE FX Bundle",
      url: "https://appstorrent.ru/4842-xln-audio-addictive-trigger-drum-vault-bundle.html",
      description: "Native Instruments 效果插件套装，清单版本 2026.1",
      section: "bundles",
      linkStatus: "verified",
    });

    expect(sites.get("fl-studio-2026")?.url).toBe("https://www.image-line.com/fl-studio");
    expect(sites.get("native-instruments-kontakt-8")?.url).toBe("https://www.native-instruments.com/products/kontakt");
    expect(sites.get("native-instruments-maschine")?.url).toBe("https://www.native-instruments.com/products/maschine-3");
    expect(sites.get("native-instruments-traktor-pro")?.url).toBe("https://www.native-instruments.com/products/traktor-pro");
    expect(sites.get("guitar-rig-7-pro")?.url).toBe("https://www.native-instruments.com/products/guitar-rig-pro");

    expect(searchSites(catalog.sites, catalog.categories, "Mantra Vocal Suite").map((site) => site.id)).toContain(
      "neural-dsp-mantra",
    );
    expect(searchSites(catalog.sites, catalog.categories, "Native Instruments").map((site) => site.id)).toContain(
      "native-instruments-komplete-fx-bundle",
    );
  });
});
