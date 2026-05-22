import React from "react";
import { Helmet } from "react-helmet-async";
import { useLang } from "../i18n/LangContext";
import { seoConfig, SITE } from "./seoConfig";

/**
 * Reusable SEO component.
 * - Reads bilingual title/description from `seoConfig[pageKey][lang]`
 * - Falls back to homepage entry if pageKey is unknown
 * - Emits canonical + hreflang alternates + Open Graph + Twitter card
 * - Optionally injects a JSON-LD `schema` block (object or array)
 *
 * Usage:
 *   <SEO pageKey="home" path="/" schema={orgSchema} />
 *   <SEO pageKey="solution.bess" path="/solutions/bess" />
 */
export const SEO = ({ pageKey = "home", path = "/", schema, image }) => {
  const { lang } = useLang();
  const cfg = (seoConfig[pageKey] && seoConfig[pageKey][lang]) || seoConfig.home[lang];
  const url = `${SITE.url}${path}`;
  const ogImage = image || `${SITE.url}${SITE.ogImage}`;
  const htmlLang = lang === "cn" ? "zh-CN" : "en";

  return (
    <Helmet prioritizeSeoTags>
      <html lang={htmlLang} />
      <title>{cfg.title}</title>
      <meta name="description" content={cfg.description} />
      <meta name="keywords" content={cfg.keywords || SITE.defaultKeywords[lang]} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="zh-CN" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE.name[lang]} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={lang === "cn" ? "zh_CN" : "en_US"} />
      <meta property="og:title" content={cfg.title} />
      <meta property="og:description" content={cfg.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={cfg.title} />
      <meta name="twitter:description" content={cfg.description} />
      <meta name="twitter:image" content={ogImage} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
