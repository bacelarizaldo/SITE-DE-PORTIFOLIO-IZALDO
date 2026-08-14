import * as prismic from "@prismicio/client";

// Nome do repositório Prismic (aparece na URL: https://izaldo-filmes.prismic.io).
export const repositoryName = "izaldo-filmes";

/**
 * Cliente Prismic. Se o repositório for privado, gere um "Permanent Access
 * Token" em Settings → API & Security no painel do Prismic e coloque em
 * PRISMIC_ACCESS_TOKEN no arquivo .env.local (veja .env.local.example).
 *
 * As páginas que leem daqui usam `revalidate` para controlar o cache
 * (ver src/content/projects/index.ts) em vez de configurar fetchOptions
 * diretamente, para evitar depender de tipos internos do Next.
 */
export function createClient() {
  return prismic.createClient(repositoryName, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });
}

export const client = createClient();
