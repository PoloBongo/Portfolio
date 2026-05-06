import React from "react";
import { Helmet } from "react-helmet-async";

const BASE_URL = "https://www.arthur-portfolio.dev";
const LANGS = ["fr", "en", "es"];

const SEO = ({ lang, path = "", title, description, ogTitle, ogDescription, structuredData }) => {
  const normalizedPath = path || "/";
  const url = `${BASE_URL}/${lang}${normalizedPath}`;
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDesc = ogDescription || description;
  const dataBlocks = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {LANGS.map((l) => (
        <link key={l} rel="alternate" hreflang={l} href={`${BASE_URL}/${l}${normalizedPath}`} />
      ))}
      <link rel="alternate" hreflang="x-default" href={`${BASE_URL}/fr${normalizedPath}`} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${BASE_URL}/arthur.webp`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image" content={`${BASE_URL}/arthur.webp`} />
      {dataBlocks.map((data, i) => (
        <script key={i} type="application/ld+json">{data}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
