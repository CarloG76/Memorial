import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // No indexing until visibility rules and public publication have been approved.
  return { rules: { userAgent: "*", disallow: "/" } };
}
