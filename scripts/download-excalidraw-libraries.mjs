#!/usr/bin/env node
/**
 * Download & organize the top 50 Excalidraw community libraries.
 *
 * Usage:  node scripts/download-excalidraw-libraries.mjs
 *
 * Output:
 *   public/libraries/excalidraw/catalog.json       — manifest with categories
 *   public/libraries/excalidraw/categories/*.json   — per-category library bundles
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = "https://libraries.excalidraw.com/libraries";
const OUT_DIR = join(process.cwd(), "public", "libraries", "excalidraw");
const CAT_DIR = join(OUT_DIR, "categories");

// ── Top 50 libraries organized into 11 categories ──────────────────────

const CATEGORIES = [
  {
    id: "shapes-basics",
    name: "Shapes & Basics",
    description: "Fundamental geometric shapes, polygons, stars, and basic drawing elements",
    icon: "shapes",
    libraries: [
      { name: "Basic shapes", source: "pgilfernandez/basic-shapes.excalidrawlib", downloads: 16060 },
      { name: "Polygons", source: "lipis/polygons.excalidrawlib", downloads: 5329 },
      { name: "Stars", source: "lipis/stars.excalidrawlib", downloads: 2881 },
      { name: "Hearts", source: "dwelle/hearts.excalidrawlib", downloads: 2956 },
      { name: "Clouds", source: "dimitrios-fkliaras/clouds.excalidrawlib", downloads: 2804 },
    ],
  },
  {
    id: "icons-symbols",
    name: "Icons & Symbols",
    description: "General-purpose icon collections for diagrams and presentations",
    icon: "icons",
    libraries: [
      { name: "Awesome Icons", source: "ferminrp/awesome-icons.excalidrawlib", downloads: 36069 },
      { name: "Icons", source: "xxxdeveloper/icons.excalidrawlib", downloads: 26890 },
      { name: "Artem's icons", source: "artem-anufrij-live-de/artem-s-icons.excalidrawlib", downloads: 11597 },
      { name: "System Icons", source: "xxxdeveloper/system-icons.excalidrawlib", downloads: 8282 },
    ],
  },
  {
    id: "ui-wireframing",
    name: "UI/UX & Wireframing",
    description: "Wireframe kits, UI components, and design system elements",
    icon: "layout",
    libraries: [
      { name: "Lo-Fi Wireframing Kit", source: "spfr/lo-fi-wireframing-kit.excalidrawlib", downloads: 20937 },
      { name: "Web Kit", source: "excacomp/web-kit.excalidrawlib", downloads: 14031 },
      { name: "Universal UI kit", source: "manuelernestog/universal-ui-kit.excalidrawlib", downloads: 10354 },
      { name: "Dropdowns", source: "h7y/dropdowns.excalidrawlib", downloads: 6901 },
      { name: "Mobile Kit", source: "excacomp/mobile-kit.excalidrawlib", downloads: 6054 },
      { name: "Android", source: "g-script/android.excalidrawlib", downloads: 2700 },
    ],
  },
  {
    id: "software-logos",
    name: "Software & Tech Logos",
    description: "Technology brand logos, programming language icons, and software tools",
    icon: "code",
    libraries: [
      { name: "Software Logos", source: "drwnio/drwnio.excalidrawlib", downloads: 61905 },
      { name: "IT Logos", source: "pclainchard/it-logos.excalidrawlib", downloads: 13110 },
      { name: "Some more logos", source: "esteevens/logos.excalidrawlib", downloads: 5506 },
      { name: "IT Logos (Extra)", source: "selanas/it-logos.excalidrawlib", downloads: 4777 },
      { name: "Microsoft 365 icons", source: "wictorwilen/microsoft-365-icons.excalidrawlib", downloads: 3714 },
      { name: "Microsoft Apps", source: "zesty-lemur/microsoft-apps.excalidrawlib", downloads: 2620 },
    ],
  },
  {
    id: "architecture-diagrams",
    name: "Architecture & Diagrams",
    description: "Software architecture, system design, UML, and technical diagram components",
    icon: "architecture",
    libraries: [
      { name: "Systems Design Components", source: "arach/systems-design-components.excalidrawlib", downloads: 23425 },
      { name: "Hexagonal Architecture", source: "corlaez/hexagonal-architecture.excalidrawlib", downloads: 7582 },
      { name: "Software Architecture", source: "youritjang/software-architecture.excalidrawlib", downloads: 0 },
      { name: "Shapes for UML & ER Diagrams", source: "BjoernKW/UML-ER-library.excalidrawlib", downloads: 0 },
    ],
  },
  {
    id: "cloud-infrastructure",
    name: "Cloud & Infrastructure",
    description: "AWS, Azure, Google Cloud, and other cloud platform service icons",
    icon: "cloud",
    libraries: [
      { name: "Google Icons", source: "mguidoti/google-icons.excalidrawlib", downloads: 28000 },
      { name: "Azure Compute", source: "7demonsrising/azure-compute.excalidrawlib", downloads: 3558 },
      { name: "Azure General", source: "7demonsrising/azure-general.excalidrawlib", downloads: 3051 },
      { name: "Some common cloud apps", source: "kinghavok/some-common-cloud-apps.excalidrawlib", downloads: 3242 },
      { name: "Snowflake Iconography", source: "https-github-com-patrickcuba/snowflake-iconography.excalidrawlib", downloads: 3307 },
    ],
  },
  {
    id: "networking-hardware",
    name: "Networking & Hardware",
    description: "Network topology, server racks, computers, and hardware device icons",
    icon: "network",
    libraries: [
      { name: "Network topology icons", source: "dwelle/network-topology-icons.excalidrawlib", downloads: 22258 },
      { name: "Computers", source: "ei-au/computers.excalidrawlib", downloads: 12824 },
      { name: "Gadgets", source: "morgemoensch/gadgets.excalidrawlib", downloads: 6169 },
      { name: "Network locations", source: "jgodoy/network-locations.excalidrawlib", downloads: 3141 },
    ],
  },
  {
    id: "data-charts",
    name: "Data & Charts",
    description: "Data visualizations, charts, graphs, and algorithm/data structure diagrams",
    icon: "chart",
    libraries: [
      { name: "Data Viz", source: "dbssticky/data-viz.excalidrawlib", downloads: 40627 },
      { name: "Charts", source: "g-script/charts.excalidrawlib", downloads: 6873 },
      { name: "Graphs", source: "jakubpawlina/graphs.excalidrawlib", downloads: 6395 },
      { name: "Algorithms & Data Structures", source: "intradeus/algorithms-and-data-structures-arrays-matrices-trees.excalidrawlib", downloads: 21828 },
    ],
  },
  {
    id: "people-characters",
    name: "People & Characters",
    description: "Stick figures, characters, emojis, and storytelling illustrations",
    icon: "people",
    libraries: [
      { name: "Stick Figures", source: "youritjang/stick-figures.excalidrawlib", downloads: 58169 },
      { name: "Storytelling", source: "drwnio/storytelling.excalidrawlib", downloads: 12880 },
      { name: "Emojis", source: "anumithaapollo12/emojis.excalidrawlib", downloads: 10012 },
      { name: "Robots", source: "kaligule/robots.excalidrawlib", downloads: 7986 },
    ],
  },
  {
    id: "business-productivity",
    name: "Business & Productivity",
    description: "Business models, office items, presentations, and productivity templates",
    icon: "briefcase",
    libraries: [
      { name: "Wardley Maps Symbols", source: "simalexan/wardley-maps-symbols.excalidrawlib", downloads: 5665 },
      { name: "Business Model Templates", source: "shellerbrand/canvases.excalidrawlib", downloads: 4317 },
      { name: "Office Items", source: "m47812/office-items.excalidrawlib", downloads: 3553 },
      { name: "Presentation Templates", source: "shinkim/presentation-templates.excalidrawlib", downloads: 3550 },
      { name: "Simple Sticky Notes", source: "kleinpetr/simple-sticky-notes.excalidrawlib", downloads: 3049 },
    ],
  },
  {
    id: "engineering-science",
    name: "Engineering & Science",
    description: "Electrical schematics, architecture floor plans, math, and media components",
    icon: "science",
    libraries: [
      { name: "Schematic Symbols", source: "rkjc/schematic-symbols.excalidrawlib", downloads: 4990 },
      { name: "Architecture floor plan", source: "Arqtangeles/architecture.excalidrawlib", downloads: 4610 },
      { name: "Medias", source: "g-script/medias.excalidrawlib", downloads: 4518 },
    ],
  },
];

// ── Download helpers ────────────────────────────────────────────────────

async function fetchLibrary(source) {
  const url = `${BASE_URL}/${source}`;
  console.log(`  ↓ ${source}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/**
 * Normalize both v1 and v2 library formats into v2 LibraryItem[].
 * v1 has `library: [[elements...], ...]`
 * v2 has `libraryItems: [{ id, status, elements, name?, created? }, ...]`
 */
function normalizeItems(data, libraryName) {
  if (data.libraryItems && Array.isArray(data.libraryItems)) {
    // v2 format — ensure each item has required fields
    return data.libraryItems.map((item, i) => ({
      id: item.id || `${libraryName.replace(/\s+/g, "-").toLowerCase()}-${i}`,
      status: item.status || "published",
      elements: item.elements || [],
      name: item.name || `${libraryName} ${i + 1}`,
      created: item.created || Date.now(),
    }));
  }

  if (data.library && Array.isArray(data.library)) {
    // v1 format — each entry is an array of elements
    return data.library.map((elements, i) => ({
      id: `${libraryName.replace(/\s+/g, "-").toLowerCase()}-${i}`,
      status: "published",
      elements: Array.isArray(elements) ? elements : [],
      name: `${libraryName} ${i + 1}`,
      created: Date.now(),
    }));
  }

  console.warn(`  ⚠ Unknown format for ${libraryName}`);
  return [];
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Downloading top 50 Excalidraw libraries ===\n");

  await mkdir(CAT_DIR, { recursive: true });

  const catalog = { version: 1, generated: new Date().toISOString(), categories: [] };
  let totalItems = 0;
  let totalLibraries = 0;
  let failedLibraries = [];

  for (const cat of CATEGORIES) {
    console.log(`\n📂 ${cat.name}`);
    const categoryBundle = {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      libraries: [],
    };

    for (const lib of cat.libraries) {
      try {
        const data = await fetchLibrary(lib.source);
        const items = normalizeItems(data, lib.name);

        categoryBundle.libraries.push({
          name: lib.name,
          source: lib.source,
          downloads: lib.downloads,
          itemCount: items.length,
          items,
        });

        totalItems += items.length;
        totalLibraries++;
        console.log(`    ✓ ${lib.name}: ${items.length} items`);
      } catch (err) {
        console.error(`    ✗ ${lib.name}: ${err.message}`);
        failedLibraries.push(lib.name);
      }
    }

    // Write per-category bundle
    const catFile = join(CAT_DIR, `${cat.id}.json`);
    await writeFile(catFile, JSON.stringify(categoryBundle));
    console.log(`  → Saved ${catFile.replace(process.cwd(), ".")}`);

    // Add to catalog (without items — only metadata)
    catalog.categories.push({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      libraryCount: categoryBundle.libraries.length,
      totalItems: categoryBundle.libraries.reduce((s, l) => s + l.itemCount, 0),
      libraries: categoryBundle.libraries.map((l) => ({
        name: l.name,
        itemCount: l.itemCount,
        downloads: l.downloads,
      })),
    });
  }

  // Write catalog manifest
  const catalogFile = join(OUT_DIR, "catalog.json");
  await writeFile(catalogFile, JSON.stringify(catalog, null, 2));
  console.log(`\n✓ Catalog saved: ${catalogFile.replace(process.cwd(), ".")}`);

  console.log(`\n=== Summary ===`);
  console.log(`  Libraries downloaded: ${totalLibraries}`);
  console.log(`  Total items: ${totalItems}`);
  if (failedLibraries.length > 0) {
    console.log(`  Failed: ${failedLibraries.join(", ")}`);
  }
  console.log("Done!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
