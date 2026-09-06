import { z } from "zod";

export const categoryIds = [
  "common",
  "ai",
  "windows",
  "mac",
  "cross-platform",
  "games",
  "audio",
  "video",
  "media",
] as const;

export type CategoryId = (typeof categoryIds)[number];
export type SiteRiskLevel = "standard" | "external" | "high";
export type SiteReviewStatus = "verified" | "unverified";
export type SiteLinkStatus = "verified" | "unchecked" | "unavailable";

export interface SiteSource {
  kind: "manual" | "carrot";
  url?: string;
}

interface SiteBase {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  section?: string;
  tags: string[];
  aliases?: string[];
  icon?: string;
  featured?: boolean;
  riskLevel: SiteRiskLevel;
  reviewStatus: SiteReviewStatus;
  source: SiteSource;
}

export interface LinkedSite extends SiteBase {
  linkStatus: "verified" | "unchecked";
  url: string;
  domain: string;
}

export interface UnavailableSite extends SiteBase {
  linkStatus: "unavailable";
  url?: never;
  domain?: never;
}

export type Site = LinkedSite | UnavailableSite;

export interface CategorySection {
  id: string;
  label: string;
  order: number;
}

export interface Category {
  id: CategoryId;
  label: string;
  navLabel: string;
  homeLabel: string;
  order: number;
  homeMode: "featured" | "first" | "hidden";
  homeGroup: string;
  homeOrder: number;
  sections?: CategorySection[];
}

export interface SiteCatalog {
  categories: Category[];
  sites: Site[];
}

const sectionIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const categorySectionSchema = z
  .object({
    id: sectionIdSchema,
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
  })
  .strict();

export const categorySchema = z
  .object({
    id: z.enum(categoryIds),
    label: z.string().min(1),
    navLabel: z.string().min(1),
    homeLabel: z.string().min(1),
    order: z.number().int().nonnegative(),
    homeMode: z.enum(["featured", "first", "hidden"]),
    homeGroup: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    homeOrder: z.number().int().nonnegative(),
    sections: z.array(categorySectionSchema).min(1).optional(),
  })
  .strict()
  .superRefine((category, context) => {
    if (!category.sections) return;

    const ids = new Set<string>();
    const orders = new Set<number>();
    category.sections.forEach((section, index) => {
      if (ids.has(section.id)) {
        context.addIssue({
          code: "custom",
          message: `duplicate section ID ${section.id}`,
          path: ["sections", index, "id"],
        });
      }
      if (orders.has(section.order)) {
        context.addIssue({
          code: "custom",
          message: `duplicate section order ${section.order}`,
          path: ["sections", index, "order"],
        });
      }
      ids.add(section.id);
      orders.add(section.order);
    });
  })
  .transform((category) => ({
    ...category,
    sections: category.sections
      ? [...category.sections].sort((left, right) => left.order - right.order)
      : undefined,
  }));

const siteInputBaseSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.enum(categoryIds),
    section: sectionIdSchema.optional(),
    tags: z.array(z.string().min(1)).min(1),
    aliases: z.array(z.string().min(1)).optional(),
    icon: z.string().min(1).optional(),
    featured: z.boolean().optional(),
    riskLevel: z.enum(["standard", "external", "high"]),
    reviewStatus: z.enum(["verified", "unverified"]),
    source: z
      .object({
        kind: z.enum(["manual", "carrot"]),
        url: z.string().url().optional(),
      })
      .strict(),
  });

export const siteInputSchema = z.discriminatedUnion("linkStatus", [
  siteInputBaseSchema
    .extend({
      linkStatus: z.enum(["verified", "unchecked"]),
      url: z.string().url(),
    })
    .strict(),
  siteInputBaseSchema
    .extend({
      linkStatus: z.literal("unavailable"),
    })
    .strict(),
]);

export type SiteInput = z.infer<typeof siteInputSchema>;
