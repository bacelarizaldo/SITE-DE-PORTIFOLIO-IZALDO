import type { MetadataRoute } from "next";
import { getAllProjects } from "@/content/projects";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getAllProjects();
  const projectEntries = projects.map((project) => ({
    url: `${siteConfig.url}/portfolio/${project.slug}`,
    lastModified: new Date(),
  }));

  return [
    { url: siteConfig.url, lastModified: new Date() },
    { url: `${siteConfig.url}/portfolio`, lastModified: new Date() },
    { url: `${siteConfig.url}/servicos`, lastModified: new Date() },
    { url: `${siteConfig.url}/sobre`, lastModified: new Date() },
    { url: `${siteConfig.url}/contato`, lastModified: new Date() },
    ...projectEntries,
  ];
}
