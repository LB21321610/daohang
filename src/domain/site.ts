import { z } from "zod";

export const categoryIds = ["common", "ai", "windows", "mac", "cross-platform"] as const;

export type CategoryId = (typeof categoryIds)[number];
export type SiteRiskLevel = "standard" | "external" | "high";
export type SiteReviewStatus = "verified" | "unverified" | "inactive";

export interface SiteSource {
  kind: "manual" | "carrot";
  url?: string;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  domain: string;
  description: string;
  category: CategoryId;
  tags: string[];
  aliases?: string[];
  icon?: string;
  featured?: boolean;
  riskLevel: SiteRiskLevel;
  reviewStatus: SiteReviewStatus;
  source: SiteSource;
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
}

export interface SiteCatalog {
  categories: Category[];
  sites: Site[];
}

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
  })
  .strict();

export const siteInputSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    url: z.string().url(),
    description: z.string().min(1),
    category: z.enum(categoryIds),
    tags: z.array(z.string().min(1)).min(1),
    aliases: z.array(z.string().min(1)).optional(),
    icon: z.string().min(1).optional(),
    featured: z.boolean().optional(),
    riskLevel: z.enum(["standard", "external", "high"]),
    reviewStatus: z.enum(["verified", "unverified", "inactive"]),
    source: z
      .object({
        kind: z.enum(["manual", "carrot"]),
        url: z.string().url().optional(),
      })
      .strict(),
  })
  .strict();

export type SiteInput = z.infer<typeof siteInputSchema>;
