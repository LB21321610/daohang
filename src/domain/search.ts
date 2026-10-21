import type { Category, Site } from "./site";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("zh-CN");
}

interface SearchField {
  value: string;
  exact: number;
  prefix: number;
  contains: number;
}

interface SearchIndex {
  categories: Category[];
  entries: Array<{ fields: SearchField[]; site: Site }>;
}

function field(value: string, exact: number, prefix: number, contains: number): SearchField {
  return { value: normalize(value), exact, prefix, contains };
}

function scoreField({ value, exact, prefix, contains }: SearchField, query: string): number {
  if (value === query) return exact;
  if (value.startsWith(query)) return prefix;
  if (value.includes(query)) return contains;
  return 0;
}

// Normalizing ~1,600 sites' fields is the costly part of a search, so it happens once per catalog.
const searchIndexes = new WeakMap<Site[], SearchIndex>();

function getSearchIndex(sites: Site[], categories: Category[]): SearchIndex {
  const cached = searchIndexes.get(sites);
  if (cached?.categories === categories) return cached;

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const sectionLabels = new Map(
    categories.flatMap((category) =>
      (category.sections ?? []).map((section) => [`${category.id}/${section.id}`, section.label] as const),
    ),
  );
  const index: SearchIndex = {
    categories,
    entries: sites.map((site) => {
      const category = categoryById.get(site.category);
      const sectionLabel = site.section ? sectionLabels.get(`${site.category}/${site.section}`) : undefined;
      return {
        site,
        fields: [
          field(site.name, 120, 105, 80),
          ...(site.linkStatus === "unavailable" ? [] : [field(site.domain, 115, 100, 76)]),
          ...(site.aliases ?? []).map((alias) => field(alias, 110, 95, 72)),
          field(site.description, 70, 64, 52),
          ...site.tags.map((tag) => field(tag, 86, 78, 58)),
          ...(sectionLabel ? [field(sectionLabel, 88, 80, 59)] : []),
          ...(category
            ? [category.label, category.navLabel, category.homeLabel].map((label) => field(label, 90, 82, 60))
            : []),
        ],
      };
    }),
  };
  searchIndexes.set(sites, index);
  return index;
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function highlightSegments(text: string, rawQuery: string): HighlightSegment[] {
  const query = normalize(rawQuery);
  const lowered = text.toLocaleLowerCase("zh-CN");
  // Case mapping can change string length (e.g. "İ"), which would misalign offsets.
  if (!query || lowered.length !== text.length) return [{ text, match: false }];

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let index = lowered.indexOf(query);
  while (index !== -1) {
    if (index > cursor) segments.push({ text: text.slice(cursor, index), match: false });
    segments.push({ text: text.slice(index, index + query.length), match: true });
    cursor = index + query.length;
    index = lowered.indexOf(query, cursor);
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments.length ? segments : [{ text, match: false }];
}

export function searchSites(sites: Site[], categories: Category[], rawQuery: string): Site[] {
  const query = normalize(rawQuery);
  if (!query) return sites;

  return getSearchIndex(sites, categories)
    .entries.map(({ fields, site }, index) => {
      let score = 0;
      for (const searchField of fields) score = Math.max(score, scoreField(searchField, query));
      return { index, score, site };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((result) => result.site);
}
