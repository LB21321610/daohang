import { parse } from "yaml";

import {
  categorySchema,
  type Site,
  type SiteCatalog,
  siteInputSchema,
} from "../src/domain/site";

export interface SiteDocument {
  path: string;
  yaml: string;
}

function parseYamlArray(yaml: string, path: string): unknown[] {
  let value: unknown;

  try {
    value = parse(yaml);
  } catch (error) {
    throw new Error(`${path}: invalid YAML: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }

  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected a YAML array`);
  }

  return value;
}

function normalizeUrl(rawUrl: string, path: string): { url: string; domain: string } {
  const parsed = new URL(rawUrl);

  if (parsed.protocol !== "https:") {
    throw new Error(`${path}: every site URL must use HTTPS (${rawUrl})`);
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  }

  return { domain: parsed.hostname, url: parsed.toString() };
}

function formatValidationError(path: string, error: { issues: { message: string; path: PropertyKey[] }[] }): Error {
  const issue = error.issues[0];
  const field = issue?.path.length ? ` at ${issue.path.join(".")}` : "";
  return new Error(`${path}${field}: ${issue?.message ?? "invalid content"}`);
}

export function compileCatalog(categoriesYaml: string, siteDocuments: SiteDocument[]): SiteCatalog {
  const rawCategories = parseYamlArray(categoriesYaml, "content/categories.yml");
  const categories = rawCategories.map((value, index) => {
    const result = categorySchema.safeParse(value);
    if (!result.success) throw formatValidationError(`content/categories.yml[${index}]`, result.error);
    return result.data;
  });

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const ids = new Set<string>();
  const urls = new Set<string>();
  const sites: Site[] = [];

  for (const document of siteDocuments) {
    const rawSites = parseYamlArray(document.yaml, document.path);

    rawSites.forEach((value, index) => {
      const result = siteInputSchema.safeParse(value);
      if (!result.success) throw formatValidationError(`${document.path}[${index}]`, result.error);

      const input = result.data;
      const category = categoryById.get(input.category);
      if (!category) {
        throw new Error(`${document.path}[${index}]: unknown category ${input.category}`);
      }
      if (ids.has(input.id)) {
        throw new Error(`${document.path}[${index}]: duplicate ID ${input.id}`);
      }

      const sections = category.sections;
      if (sections) {
        if (!input.section || !sections.some((section) => section.id === input.section)) {
          throw new Error(
            `${document.path}[${index}]: section ${input.section ?? "is required"} is not configured for category ${input.category}`,
          );
        }
      } else if (input.section) {
        throw new Error(
          `${document.path}[${index}]: section ${input.section} is not allowed for category ${input.category}`,
        );
      }

      ids.add(input.id);
      if (input.linkStatus === "unavailable") {
        sites.push(input);
        return;
      }

      const normalized = normalizeUrl(input.url, `${document.path}[${index}]`);
      if (urls.has(normalized.url)) {
        throw new Error(`${document.path}[${index}]: duplicate URL ${normalized.domain}`);
      }

      urls.add(normalized.url);
      sites.push({ ...input, ...normalized });
    });
  }

  return {
    categories: [...categories].sort((left, right) => left.order - right.order),
    sites,
  };
}
