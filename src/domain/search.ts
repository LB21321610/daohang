import type { Category, Site } from "./site";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function scoreField(value: string, query: string, exact: number, prefix: number, contains: number): number {
  const normalized = normalize(value);

  if (normalized === query) return exact;
  if (normalized.startsWith(query)) return prefix;
  if (normalized.includes(query)) return contains;
  return 0;
}

export function searchSites(sites: Site[], categories: Category[], rawQuery: string): Site[] {
  const query = normalize(rawQuery);
  if (!query) return sites;

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return sites
    .map((site, index) => {
      const category = categoryById.get(site.category);
      const section = category?.sections?.find((candidate) => candidate.id === site.section);
      const score = Math.max(
        scoreField(site.name, query, 120, 105, 80),
        ...(site.linkStatus === "unavailable" ? [] : [scoreField(site.domain, query, 115, 100, 76)]),
        ...(site.aliases ?? []).map((alias) => scoreField(alias, query, 110, 95, 72)),
        scoreField(site.description, query, 70, 64, 52),
        ...site.tags.map((tag) => scoreField(tag, query, 86, 78, 58)),
        ...(section ? [scoreField(section.label, query, 88, 80, 59)] : []),
        ...(category
          ? [category.label, category.navLabel, category.homeLabel].map((label) =>
              scoreField(label, query, 90, 82, 60),
            )
          : []),
      );

      return { index, score, site };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((result) => result.site);
}
