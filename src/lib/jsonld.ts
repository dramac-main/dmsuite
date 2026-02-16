/** JSON-LD Structured Data helpers for SEO */

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DMSuite",
    alternateName: "DRAMAC AI Suite",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dmsuite.app",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    description:
      "AI-powered creative studio with 250+ tools for design, video, audio, content, marketing, web/UI, documents, and business automation.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "DRAMAC",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dmsuite.app",
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; href: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dmsuite.app"}${item.href}`,
    })),
  };
}
