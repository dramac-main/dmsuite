/* ============================================================
   DMSuite — AI Tool Categories & Tools Registry
   ────────────────────────────────────────────────────────────
   250+ AI-powered tools across 8 categories — everything a
   designer/creative agency needs to drop any client's jaw.
   ============================================================ */

// ── Types ───────────────────────────────────────────────────

export type ToolStatus = "ready" | "beta" | "coming-soon";

/** Which AI provider(s) a tool can leverage */
export type AIProvider =
  | "claude"
  | "luma"
  | "runway"
  | "elevenlabs"
  | "stable-diffusion"
  | "flux"
  | "midjourney"
  | "suno"
  | "whisper"
  | "built-in";

/** Output format a tool can produce */
export type OutputFormat =
  | "png"
  | "jpg"
  | "svg"
  | "pdf"
  | "mp4"
  | "webm"
  | "gif"
  | "webp"
  | "avif"
  | "mov"
  | "wav"
  | "mp3"
  | "html"
  | "json"
  | "psd"
  | "ai"
  | "eps"
  | "docx"
  | "pptx"
  | "xlsx"
  | "tiff"
  | "bmp";

/** Print size presets */
export type PrintSize =
  | "A3"
  | "A4"
  | "A5"
  | "A6"
  | "letter"
  | "legal"
  | "tabloid"
  | "DL"
  | "square"
  | "custom";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: ToolStatus;
  tags: string[];
  /** AI providers this tool uses */
  aiProviders?: AIProvider[];
  /** Export formats supported */
  outputs?: OutputFormat[];
  /** Supports part-editing (change one element, keep rest consistent) */
  supportsPartEdit?: boolean;
  /** Print-ready with bleed/trim marks */
  printReady?: boolean;
  /** Available print sizes */
  printSizes?: PrintSize[];
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorClass: string;
  textColorClass: string;
  ringColorClass: string;
  tools: Tool[];
}

// ── Status badge config ─────────────────────────────────────

export const statusConfig: Record<
  ToolStatus,
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  ready: {
    label: "Ready",
    bgClass: "bg-success/15",
    textClass: "text-success",
    dotClass: "bg-success",
  },
  beta: {
    label: "Beta",
    bgClass: "bg-warning/15",
    textClass: "text-warning",
    dotClass: "bg-warning",
  },
  "coming-soon": {
    label: "Coming Soon",
    bgClass: "bg-info/15",
    textClass: "text-info",
    dotClass: "bg-info",
  },
};

// ── All Tool Categories ─────────────────────────────────────

export const toolCategories: ToolCategory[] = [
  // ════════════════════════════════════════════════════════════
  // 🎨  1.  DESIGN STUDIO
  // ════════════════════════════════════════════════════════════
  {
    id: "design",
    name: "Design Studio",
    description:
      "AI-powered graphic design for logos, branding, social media, print, packaging, signage, apparel, and everything visual",
    icon: "palette",
    colorClass: "bg-primary-500",
    textColorClass: "text-primary-500",
    ringColorClass: "ring-primary-500/30",
    tools: [
      // ── Branding & Identity ─────────────────────────────────
      {
        id: "logo-generator",
        name: "Logo Generator",
        description:
          "Generate professional logos — wordmarks, icon marks, emblems, lettermarks, and combo marks with brand-ready exports",
        icon: "sparkles",
        status: "ready",
        tags: ["logo", "branding", "identity", "wordmark", "emblem"],
        aiProviders: ["claude", "stable-diffusion", "flux"],
        outputs: ["svg", "png", "pdf", "eps", "ai"],
        supportsPartEdit: true,
      },
      {
        id: "logo-animation",
        name: "Logo Reveal & Animation",
        description:
          "Create cinematic logo reveals, animated intros, 3D logo spins, and motion logos",
        icon: "play",
        status: "ready",
        tags: ["logo", "animation", "motion", "reveal", "intro"],
        aiProviders: ["luma", "runway"],
        outputs: ["mp4", "webm", "gif", "mov"],
        supportsPartEdit: true,
      },
      {
        id: "brand-identity",
        name: "Brand Identity Kit",
        description:
          "Generate complete brand identities — color palettes, font systems, patterns, tone of voice, and style guides",
        icon: "layers",
        status: "ready",
        tags: ["branding", "identity", "style guide", "brand book"],
        aiProviders: ["claude", "stable-diffusion"],
        outputs: ["pdf", "png", "svg"],
        supportsPartEdit: true,
      },
      {
        id: "brand-guidelines",
        name: "Brand Guidelines Document",
        description:
          "Create comprehensive brand guidelines with logo usage, color specs, typography rules, and do/don't examples",
        icon: "bookOpen",
        status: "ready",
        tags: ["brand guidelines", "style guide", "brand book", "identity"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
        printReady: true,
        printSizes: ["A4", "letter"],
      },
      // ── Business Stationery ─────────────────────────────────
      {
        id: "business-card",
        name: "Business Card Designer",
        description:
          "Design professional business cards with smart layouts, QR codes, and print-ready output (standard, square, folded)",
        icon: "card",
        status: "ready",
        tags: ["business card", "print", "branding", "stationery"],
        outputs: ["pdf", "png", "svg", "ai"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "letterhead",
        name: "Letterhead Designer",
        description:
          "Create branded letterheads for official correspondence with matching continuation pages",
        icon: "fileText",
        status: "ready",
        tags: ["letterhead", "stationery", "branding", "corporate"],
        outputs: ["pdf", "docx", "png"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "envelope",
        name: "Envelope Designer",
        description:
          "Design branded envelopes — DL, C5, C4, #10, and custom sizes with window placement",
        icon: "mail",
        status: "ready",
        tags: ["envelope", "stationery", "mail", "print"],
        outputs: ["pdf", "png", "ai"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "compliment-slip",
        name: "Compliment Slip Designer",
        description:
          "Design branded compliment slips and with-compliments cards matching your stationery suite",
        icon: "fileText",
        status: "ready",
        tags: ["compliment slip", "stationery", "corporate"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["DL", "A5"],
        supportsPartEdit: true,
      },
      {
        id: "stamp-seal",
        name: "Stamp & Seal Designer",
        description:
          "Create company stamps, rubber stamps, embossed seals, and wax seal designs",
        icon: "award",
        status: "ready",
        tags: ["stamp", "seal", "emboss", "wax", "corporate"],
        outputs: ["svg", "png", "pdf", "ai"],
        supportsPartEdit: true,
      },
      // ── Social Media Design ─────────────────────────────────
      {
        id: "social-media-post",
        name: "Social Media Post Designer",
        description:
          "Design eye-catching posts for Instagram, Facebook, LinkedIn, X, Pinterest, and Threads",
        icon: "share",
        status: "ready",
        tags: ["social media", "post", "instagram", "facebook", "linkedin"],
        aiProviders: ["claude", "stable-diffusion"],
        outputs: ["png", "jpg", "webp"],
        supportsPartEdit: true,
      },
      {
        id: "social-media-story",
        name: "Story & Reel Cover Designer",
        description:
          "Create vertical stories, reel covers, and highlight covers for Instagram, TikTok, and Snapchat",
        icon: "smartphone",
        status: "ready",
        tags: ["stories", "reels", "vertical", "highlight", "social media"],
        outputs: ["png", "jpg"],
        supportsPartEdit: true,
      },
      {
        id: "social-media-carousel",
        name: "Carousel Post Designer",
        description:
          "Design multi-slide carousels for Instagram, LinkedIn, and Facebook with consistent styling",
        icon: "layers",
        status: "ready",
        tags: ["carousel", "swipe", "instagram", "linkedin", "multi-slide"],
        outputs: ["png", "pdf"],
        supportsPartEdit: true,
      },
      {
        id: "social-profile-kit",
        name: "Social Profile Kit",
        description:
          "Design matching profile pictures, cover photos, and banners for all platforms at once",
        icon: "user",
        status: "ready",
        tags: ["profile", "cover photo", "banner", "social media"],
        outputs: ["png", "jpg"],
        supportsPartEdit: true,
      },
      {
        id: "pinterest-pin",
        name: "Pinterest Pin Designer",
        description:
          "Create tall, scroll-stopping Pinterest pins optimized for clicks and saves",
        icon: "image",
        status: "ready",
        tags: ["pinterest", "pin", "tall", "vertical"],
        outputs: ["png", "jpg"],
        supportsPartEdit: true,
      },
      // ── Advertising & Marketing Collateral ──────────────────
      {
        id: "banner-ad",
        name: "Banner & Display Ad Creator",
        description:
          "Design web banners, Google Display ads, retargeting ads, and responsive HTML5 ads in all IAB sizes",
        icon: "layout",
        status: "ready",
        tags: ["banner", "ad", "display", "web", "IAB", "Google Ads"],
        outputs: ["png", "jpg", "html", "gif"],
        supportsPartEdit: true,
      },
      {
        id: "poster",
        name: "Poster Designer",
        description:
          "Create striking posters for events, concerts, promotions, and campaigns in any size",
        icon: "image",
        status: "ready",
        tags: ["poster", "print", "event", "campaign", "large format"],
        outputs: ["pdf", "png", "jpg", "tiff"],
        printReady: true,
        printSizes: ["A3", "A4", "A5", "tabloid", "custom"],
        supportsPartEdit: true,
      },
      {
        id: "flyer",
        name: "Flyer & Leaflet Designer",
        description:
          "Design single and double-sided flyers, leaflets, and handouts for print distribution",
        icon: "fileText",
        status: "ready",
        tags: ["flyer", "leaflet", "print", "handout", "A5", "DL"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "A5", "DL", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "brochure",
        name: "Brochure Designer",
        description:
          "Create bi-fold, tri-fold, z-fold, and gate-fold brochures with professional layouts",
        icon: "bookOpen",
        status: "ready",
        tags: ["brochure", "print", "fold", "bi-fold", "tri-fold"],
        outputs: ["pdf", "png", "ai"],
        printReady: true,
        printSizes: ["A4", "A5", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "rack-card",
        name: "Rack Card Designer",
        description:
          "Design standard 4×9 inch rack cards for hotels, tourism, real estate, and retail",
        icon: "fileText",
        status: "ready",
        tags: ["rack card", "tourism", "hotel", "real estate", "print"],
        outputs: ["pdf", "png"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "door-hanger",
        name: "Door Hanger Designer",
        description:
          "Create custom door hangers for real estate, hospitality, and marketing campaigns",
        icon: "home",
        status: "ready",
        tags: ["door hanger", "real estate", "marketing", "print"],
        outputs: ["pdf", "png"],
        printReady: true,
        supportsPartEdit: true,
      },
      // ── Print & Publication ─────────────────────────────────
      {
        id: "infographic",
        name: "Infographic Maker",
        description:
          "Build data-driven infographics with smart data visualizations, charts, icons, and flow diagrams",
        icon: "chart",
        status: "ready",
        tags: ["infographic", "data", "visualization", "chart"],
        aiProviders: ["claude"],
        outputs: ["png", "pdf", "svg"],
        supportsPartEdit: true,
      },
      {
        id: "magazine-layout",
        name: "Magazine Layout Designer",
        description:
          "Design magazine spreads, covers, and interior layouts with professional typography and grids",
        icon: "bookOpen",
        status: "ready",
        tags: ["magazine", "layout", "spread", "editorial", "publication"],
        outputs: ["pdf", "png", "ai"],
        printReady: true,
        printSizes: ["A4", "letter", "tabloid"],
        supportsPartEdit: true,
      },
      {
        id: "book-cover",
        name: "Book Cover Designer",
        description:
          "Design stunning front covers, back covers, and full wraps for paperback and hardcover books",
        icon: "bookOpen",
        status: "ready",
        tags: ["book cover", "publishing", "paperback", "hardcover"],
        outputs: ["pdf", "png", "tiff", "ai"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "newspaper-ad",
        name: "Newspaper & Magazine Ad",
        description:
          "Design print advertisements for newspapers and magazines in standard column sizes",
        icon: "newspaper",
        status: "ready",
        tags: ["newspaper", "magazine", "ad", "print", "advertising"],
        outputs: ["pdf", "tiff", "eps"],
        printReady: true,
        supportsPartEdit: true,
      },
      // ── Image & Photo Tools ─────────────────────────────────
      {
        id: "icon-illustration",
        name: "Icon & Illustration Generator",
        description:
          "Generate custom icons, spot illustrations, and vector graphics in any style with AI",
        icon: "penTool",
        status: "ready",
        tags: ["icon", "illustration", "vector", "custom", "flat", "3d"],
        aiProviders: ["stable-diffusion", "flux"],
        outputs: ["svg", "png", "ai"],
        supportsPartEdit: true,
      },
      {
        id: "background-remover",
        name: "Background Remover",
        description:
          "Remove, replace, and composite backgrounds from any image with pixel-perfect edge detection",
        icon: "scissors",
        status: "ready",
        tags: ["background", "remove", "cutout", "composite"],
        aiProviders: ["built-in"],
        outputs: ["png", "webp"],
      },
      {
        id: "image-enhancer",
        name: "Image Enhancer & Upscaler",
        description:
          "Enhance image quality, upscale to 4K/8K, fix lighting/colors, and restore old photos",
        icon: "zap",
        status: "ready",
        tags: ["enhance", "upscale", "quality", "resolution", "4K", "8K"],
        aiProviders: ["stable-diffusion"],
        outputs: ["png", "jpg", "tiff"],
      },
      {
        id: "photo-retoucher",
        name: "Photo Retoucher",
        description:
          "Professional photo retouching — skin smoothing, lighting correction, color grading, object removal",
        icon: "wand",
        status: "ready",
        tags: ["retouch", "photo", "correction", "beauty"],
        aiProviders: ["stable-diffusion"],
        outputs: ["png", "jpg", "tiff"],
        supportsPartEdit: true,
      },
      {
        id: "ai-image-generator",
        name: "AI Image Generator",
        description:
          "Generate photorealistic or artistic images from text prompts — product shots, scenes, concepts",
        icon: "sparkles",
        status: "ready",
        tags: ["AI", "image", "generate", "text-to-image", "concept"],
        aiProviders: ["stable-diffusion", "flux"],
        outputs: ["png", "jpg", "webp"],
        supportsPartEdit: true,
      },
      {
        id: "image-inpainting",
        name: "AI Image Editor (Inpainting)",
        description:
          "Edit specific parts of an image with AI — change objects, extend scenes, fix details while keeping everything else consistent",
        icon: "penTool",
        status: "ready",
        tags: ["inpainting", "edit", "part-edit", "consistency", "AI"],
        aiProviders: ["stable-diffusion", "flux"],
        outputs: ["png", "jpg"],
        supportsPartEdit: true,
      },
      // ── Product & Packaging ─────────────────────────────────
      {
        id: "mockup-generator",
        name: "Mockup Generator",
        description:
          "Place designs on realistic mockups — t-shirts, mugs, screens, packaging, signage, vehicles, and more",
        icon: "monitor",
        status: "ready",
        tags: ["mockup", "product", "presentation", "realistic"],
        aiProviders: ["stable-diffusion"],
        outputs: ["png", "jpg", "psd"],
        supportsPartEdit: true,
      },
      {
        id: "packaging-design",
        name: "Packaging Designer",
        description:
          "Design product packaging — boxes, bags, bottles, cans, pouches, and custom dielines with 3D preview",
        icon: "box",
        status: "ready",
        tags: ["packaging", "box", "label", "dieline", "3D"],
        outputs: ["pdf", "ai", "svg", "png"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "label-designer",
        name: "Product Label Designer",
        description:
          "Design product labels for bottles, jars, cans, and containers with regulatory layouts",
        icon: "tag",
        status: "ready",
        tags: ["label", "product", "bottle", "jar", "regulatory"],
        outputs: ["pdf", "png", "ai"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "sticker-designer",
        name: "Sticker & Decal Designer",
        description:
          "Create custom stickers, decals, badges, and die-cut shapes for products and branding",
        icon: "tag",
        status: "ready",
        tags: ["sticker", "decal", "badge", "die-cut"],
        outputs: ["pdf", "png", "svg"],
        printReady: true,
        supportsPartEdit: true,
      },
      // ── Environmental & Signage ─────────────────────────────
      {
        id: "signage",
        name: "Signage & Large Format",
        description:
          "Design signage, billboards, pull-up banners, A-frames, and large format prints",
        icon: "maximize",
        status: "ready",
        tags: ["signage", "billboard", "large format", "pull-up", "A-frame"],
        outputs: ["pdf", "tiff", "png"],
        printReady: true,
        printSizes: ["custom"],
        supportsPartEdit: true,
      },
      {
        id: "vehicle-wrap",
        name: "Vehicle Wrap Designer",
        description:
          "Design vehicle wraps for cars, vans, trucks, and buses with template overlays",
        icon: "truck",
        status: "beta",
        tags: ["vehicle wrap", "car", "van", "truck", "fleet"],
        outputs: ["pdf", "ai", "png"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "window-graphics",
        name: "Window & Wall Graphics",
        description:
          "Design window decals, wall murals, vinyl graphics, and environmental graphics",
        icon: "maximize",
        status: "ready",
        tags: ["window", "wall", "mural", "vinyl", "environmental"],
        outputs: ["pdf", "png", "tiff"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "exhibition-stand",
        name: "Exhibition Stand & Booth",
        description:
          "Design trade show booths, exhibition stands, backdrop walls, and popup displays",
        icon: "layout",
        status: "beta",
        tags: ["exhibition", "trade show", "booth", "backdrop", "popup"],
        outputs: ["pdf", "png", "ai"],
        printReady: true,
        supportsPartEdit: true,
      },
      // ── Apparel & Merchandise ───────────────────────────────
      {
        id: "tshirt-merch",
        name: "T-Shirt & Apparel Designer",
        description:
          "Create print-ready designs for t-shirts, hoodies, caps, totebags, and all merchandise",
        icon: "shirt",
        status: "ready",
        tags: ["t-shirt", "merchandise", "apparel", "hoodie", "print-on-demand"],
        outputs: ["png", "svg", "pdf", "psd"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "uniform-designer",
        name: "Uniform & Workwear Designer",
        description:
          "Design corporate uniforms, workwear, and sports team kits with logo placement",
        icon: "shirt",
        status: "beta",
        tags: ["uniform", "workwear", "corporate", "sports kit"],
        outputs: ["png", "pdf"],
        supportsPartEdit: true,
      },
      // ── Utility Design Tools ────────────────────────────────
      {
        id: "pattern-texture",
        name: "Pattern & Texture Generator",
        description:
          "Generate seamless patterns, textures, and tileable backgrounds for any design",
        icon: "grid",
        status: "ready",
        tags: ["pattern", "texture", "background", "seamless", "tileable"],
        aiProviders: ["stable-diffusion"],
        outputs: ["png", "svg", "jpg"],
        supportsPartEdit: true,
      },
      {
        id: "color-palette",
        name: "Color Palette Generator",
        description:
          "Generate harmonious palettes from images, moods, keywords, or industry with WCAG contrast checks",
        icon: "droplet",
        status: "ready",
        tags: ["color", "palette", "harmony", "WCAG", "accessibility"],
        outputs: ["png", "json", "svg"],
      },
      {
        id: "typography-pairing",
        name: "Typography Pairing Tool",
        description:
          "Find perfect font combinations, test sizes, and generate type specimens with AI",
        icon: "type",
        status: "ready",
        tags: ["typography", "fonts", "pairing", "type specimen"],
        aiProviders: ["claude"],
        outputs: ["png", "pdf"],
      },
      {
        id: "mood-board",
        name: "Mood Board Creator",
        description:
          "Build visual mood boards with AI-curated images, colors, textures, and typography",
        icon: "grid",
        status: "ready",
        tags: ["mood board", "inspiration", "visual", "creative direction"],
        aiProviders: ["claude", "stable-diffusion"],
        outputs: ["png", "pdf"],
        supportsPartEdit: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // 📄  2.  DOCUMENT & PRINT STUDIO
  // ════════════════════════════════════════════════════════════
  {
    id: "documents",
    name: "Document & Print Studio",
    description:
      "Professional business documents, sales materials, books, catalogs, and print-ready publications",
    icon: "fileText",
    colorClass: "bg-secondary-500",
    textColorClass: "text-secondary-500",
    ringColorClass: "ring-secondary-500/30",
    tools: [
      // ── Sales Books & Catalogs ──────────────────────────────
      {
        id: "sales-book-a4",
        name: "Sales Book Creator (A4)",
        description:
          "Design professional A4 sales books with multi-page layouts, covers, contents, and print-ready export with bleed",
        icon: "bookOpen",
        status: "ready",
        tags: ["sales book", "A4", "print", "catalog", "multi-page"],
        aiProviders: ["claude"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4"],
        supportsPartEdit: true,
      },
      {
        id: "sales-book-a5",
        name: "Sales Book Creator (A5)",
        description:
          "Compact A5 sales books — perfect for product catalogs, handouts, and leave-behinds",
        icon: "bookOpen",
        status: "ready",
        tags: ["sales book", "A5", "print", "catalog", "compact"],
        aiProviders: ["claude"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A5"],
        supportsPartEdit: true,
      },
      {
        id: "product-catalog",
        name: "Product Catalog Designer",
        description:
          "Multi-page product catalogs with smart image layouts, pricing tables, and order forms",
        icon: "grid",
        status: "ready",
        tags: ["catalog", "product", "multi-page", "pricing"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "A5", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "lookbook",
        name: "Lookbook Creator",
        description:
          "Design fashion lookbooks, product lookbooks, and portfolio books with editorial layouts",
        icon: "image",
        status: "ready",
        tags: ["lookbook", "fashion", "portfolio", "editorial"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "square"],
        supportsPartEdit: true,
      },
      {
        id: "price-list",
        name: "Price List & Rate Card",
        description:
          "Create beautiful price lists, rate cards, and service menus with branded layouts",
        icon: "tag",
        status: "ready",
        tags: ["price list", "rate card", "pricing", "service menu"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "A5", "DL"],
        supportsPartEdit: true,
      },
      {
        id: "line-sheet",
        name: "Wholesale Line Sheet",
        description:
          "Create wholesale line sheets with product photos, SKUs, pricing, and order details",
        icon: "grid",
        status: "ready",
        tags: ["line sheet", "wholesale", "B2B", "product"],
        outputs: ["pdf", "xlsx"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      // ── Corporate Documents ─────────────────────────────────
      {
        id: "company-profile",
        name: "Company Profile Designer",
        description:
          "Create stunning multi-page company profiles that showcase your brand story, team, and services",
        icon: "building",
        status: "ready",
        tags: ["company profile", "corporate", "branding", "about us"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "proposal-generator",
        name: "Proposal & Pitch Deck",
        description:
          "Generate winning proposals and pitch decks with data-driven layouts and compelling narratives",
        icon: "presentation",
        status: "ready",
        tags: ["proposal", "pitch", "deck", "presentation", "RFP"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
      {
        id: "presentation",
        name: "Presentation Designer",
        description:
          "Design stunning slide presentations with AI-generated layouts, data viz, and speaker notes",
        icon: "presentation",
        status: "ready",
        tags: ["presentation", "slides", "keynote", "powerpoint", "google slides"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx", "png"],
        supportsPartEdit: true,
      },
      {
        id: "report-generator",
        name: "Report Generator",
        description:
          "Create annual reports, financial reports, ESG reports, and board packs with charts and data",
        icon: "chart",
        status: "ready",
        tags: ["report", "annual", "financial", "ESG", "board pack"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "newsletter-print",
        name: "Printed Newsletter Designer",
        description:
          "Design printed newsletters, bulletins, and internal communications in A4/letter format",
        icon: "newspaper",
        status: "ready",
        tags: ["newsletter", "print", "bulletin", "internal comms"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      // ── Financial Documents ─────────────────────────────────
      {
        id: "invoice-designer",
        name: "Invoice Designer",
        description:
          "Design branded invoices with auto-calculations, tax handling, and multi-currency support",
        icon: "receipt",
        status: "ready",
        tags: ["invoice", "billing", "financial", "tax"],
        outputs: ["pdf", "xlsx"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "quote-estimate",
        name: "Quote & Estimate Creator",
        description:
          "Generate professional quotes and estimates with itemized breakdowns and terms",
        icon: "calculator",
        status: "ready",
        tags: ["quote", "estimate", "pricing", "proposal"],
        outputs: ["pdf", "xlsx"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "receipt-designer",
        name: "Receipt Designer",
        description:
          "Create branded receipts, payment confirmations, and delivery notes",
        icon: "receipt",
        status: "ready",
        tags: ["receipt", "payment", "confirmation", "delivery note"],
        outputs: ["pdf", "png"],
        supportsPartEdit: true,
      },
      {
        id: "purchase-order",
        name: "Purchase Order Creator",
        description:
          "Generate branded purchase orders with vendor details, line items, and approval workflows",
        icon: "clipboard",
        status: "ready",
        tags: ["purchase order", "PO", "procurement", "vendor"],
        outputs: ["pdf", "xlsx"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "statement-of-account",
        name: "Statement of Account",
        description:
          "Create account statements showing transaction history, balances, and aging summaries",
        icon: "chart",
        status: "ready",
        tags: ["statement", "account", "aging", "balance"],
        outputs: ["pdf", "xlsx"],
        supportsPartEdit: true,
      },
      // ── Legal & HR Documents ────────────────────────────────
      {
        id: "contract-template",
        name: "Contract & Agreement Creator",
        description:
          "Generate legal contracts, service agreements, NDAs, and freelancer agreements from templates",
        icon: "shield",
        status: "ready",
        tags: ["contract", "agreement", "legal", "NDA", "freelancer"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "business-plan",
        name: "Business Plan Writer",
        description:
          "AI-powered business plan generator with executive summary, market analysis, and financial projections",
        icon: "target",
        status: "ready",
        tags: ["business plan", "strategy", "projections", "startup"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "employee-handbook",
        name: "Employee Handbook Creator",
        description:
          "Build comprehensive employee handbooks with policies, procedures, and company culture sections",
        icon: "bookOpen",
        status: "ready",
        tags: ["employee handbook", "HR", "policies", "onboarding"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "job-description",
        name: "Job Description Generator",
        description:
          "Create compelling job descriptions, role profiles, and hiring posts with inclusive language",
        icon: "users",
        status: "ready",
        tags: ["job description", "hiring", "recruitment", "HR"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      // ── Certificates & Awards ───────────────────────────────
      {
        id: "certificate",
        name: "Certificate Designer",
        description:
          "Design certificates of achievement, completion, appreciation, and training with ornamental borders",
        icon: "award",
        status: "ready",
        tags: ["certificate", "award", "achievement", "diploma"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "diploma-designer",
        name: "Diploma & Accreditation",
        description:
          "Design formal diplomas, accreditations, and professional designation certificates",
        icon: "award",
        status: "ready",
        tags: ["diploma", "accreditation", "formal", "education"],
        outputs: ["pdf", "png", "tiff"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "gift-voucher",
        name: "Gift Voucher & Coupon",
        description:
          "Design gift vouchers, discount coupons, loyalty cards, and promotional offers",
        icon: "tag",
        status: "ready",
        tags: ["gift voucher", "coupon", "loyalty", "discount", "promo"],
        outputs: ["pdf", "png"],
        printReady: true,
        supportsPartEdit: true,
      },
      // ── Specialized Business Documents ──────────────────────
      {
        id: "menu-designer",
        name: "Menu Designer",
        description:
          "Create restaurant menus, cafe menus, bar menus, wine lists, and food truck menus",
        icon: "utensils",
        status: "ready",
        tags: ["menu", "restaurant", "food", "cafe", "wine list"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "A5", "DL", "square"],
        supportsPartEdit: true,
      },
      {
        id: "real-estate-listing",
        name: "Real Estate Feature Sheet",
        description:
          "Design property listing sheets, feature sheets, open house flyers, and market reports",
        icon: "home",
        status: "ready",
        tags: ["real estate", "listing", "property", "feature sheet"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "event-program",
        name: "Event Program & Agenda",
        description:
          "Design event programs, conference agendas, wedding programs, and ceremony booklets",
        icon: "calendar",
        status: "ready",
        tags: ["event program", "agenda", "conference", "wedding"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A4", "A5"],
        supportsPartEdit: true,
      },
      {
        id: "ticket-designer",
        name: "Ticket & Pass Designer",
        description:
          "Design event tickets, admission passes, raffle tickets, and VIP passes with barcodes/QR",
        icon: "creditCard",
        status: "ready",
        tags: ["ticket", "pass", "event", "VIP", "barcode"],
        outputs: ["pdf", "png"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "id-badge",
        name: "ID Badge & Lanyard Designer",
        description:
          "Design employee ID badges, event passes, conference badges, and lanyards with photo areas",
        icon: "creditCard",
        status: "ready",
        tags: ["ID badge", "lanyard", "pass", "event", "employee"],
        outputs: ["pdf", "png"],
        printReady: true,
        supportsPartEdit: true,
      },
      {
        id: "calendar-designer",
        name: "Calendar Designer",
        description:
          "Create branded desk, wall, and pocket calendars with custom imagery and events",
        icon: "calendar",
        status: "ready",
        tags: ["calendar", "desk", "wall", "pocket", "print"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A3", "A4", "A5"],
        supportsPartEdit: true,
      },
      // ── Educational & Training ──────────────────────────────
      {
        id: "training-manual",
        name: "Training Manual Creator",
        description:
          "Build training manuals, SOPs, onboarding guides, and instruction booklets with step-by-step layouts",
        icon: "bookOpen",
        status: "ready",
        tags: ["training", "manual", "SOP", "onboarding", "instruction"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        printReady: true,
        printSizes: ["A4", "letter"],
        supportsPartEdit: true,
      },
      {
        id: "user-guide",
        name: "User Guide & Documentation",
        description:
          "Create product user guides, help docs, technical documentation, and quick-start guides",
        icon: "helpCircle",
        status: "ready",
        tags: ["user guide", "documentation", "help", "technical"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx", "html"],
        supportsPartEdit: true,
      },
      {
        id: "worksheet-designer",
        name: "Worksheet & Form Designer",
        description:
          "Create fillable worksheets, forms, checklists, and planning templates for print or digital",
        icon: "clipboard",
        status: "ready",
        tags: ["worksheet", "form", "checklist", "fillable", "template"],
        outputs: ["pdf", "docx"],
        printReady: true,
        supportsPartEdit: true,
      },
      // ── Knowledge & Research ─────────────────────────────────
      {
        id: "white-paper",
        name: "White Paper Generator",
        description:
          "Write and design professional white papers and research documents with citations",
        icon: "fileText",
        status: "ready",
        tags: ["white paper", "research", "thought leadership", "academic"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "case-study",
        name: "Case Study Creator",
        description:
          "Build compelling case studies that showcase client results with before/after data visualizations",
        icon: "trendingUp",
        status: "ready",
        tags: ["case study", "success story", "portfolio", "results"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx", "pptx"],
        supportsPartEdit: true,
      },
      {
        id: "media-kit",
        name: "Media Kit & Press Kit",
        description:
          "Create media kits, press kits, and sponsorship packages for PR and partnerships",
        icon: "newspaper",
        status: "ready",
        tags: ["media kit", "press", "PR", "sponsorship"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
      {
        id: "ebook-creator",
        name: "eBook & Digital Publication",
        description:
          "Design and export eBooks, digital magazines, interactive PDFs, and EPUB publications",
        icon: "tablet",
        status: "ready",
        tags: ["ebook", "digital", "publication", "magazine", "EPUB"],
        aiProviders: ["claude"],
        outputs: ["pdf", "html"],
        supportsPartEdit: true,
      },
      // ── Personal Documents ──────────────────────────────────
      {
        id: "resume-cv",
        name: "Resume & CV Builder",
        description:
          "Build ATS-friendly resumes and beautiful CVs with AI optimization and multiple templates",
        icon: "user",
        status: "ready",
        tags: ["resume", "CV", "career", "ATS"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "cover-letter",
        name: "Cover Letter Writer",
        description:
          "Generate tailored cover letters that match job descriptions with keyword optimization",
        icon: "mail",
        status: "ready",
        tags: ["cover letter", "job", "application", "career"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "portfolio-builder",
        name: "Portfolio Builder",
        description:
          "Create stunning design portfolios, photography portfolios, and creative portfolios for print or web",
        icon: "image",
        status: "ready",
        tags: ["portfolio", "creative", "photography", "design"],
        outputs: ["pdf", "html", "png"],
        supportsPartEdit: true,
      },
      // ── Invitations & Personal ──────────────────────────────
      {
        id: "invitation-designer",
        name: "Invitation Designer",
        description:
          "Design wedding invitations, party invites, corporate event invitations, and RSVPs",
        icon: "mail",
        status: "ready",
        tags: ["invitation", "wedding", "party", "event", "RSVP"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A5", "A6", "square", "DL"],
        supportsPartEdit: true,
      },
      {
        id: "greeting-card",
        name: "Greeting Card Designer",
        description:
          "Create greeting cards, thank-you cards, holiday cards, and folded cards with envelopes",
        icon: "mail",
        status: "ready",
        tags: ["greeting card", "thank you", "holiday", "birthday"],
        outputs: ["pdf", "png"],
        printReady: true,
        printSizes: ["A5", "A6", "square"],
        supportsPartEdit: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // 🎬  3.  VIDEO & MOTION STUDIO
  // ════════════════════════════════════════════════════════════
  {
    id: "video",
    name: "Video & Motion Studio",
    description:
      "AI video editing, motion graphics, animations, VFX, logo reveals, and cinematic content creation",
    icon: "video",
    colorClass: "bg-error",
    textColorClass: "text-error",
    ringColorClass: "ring-error/30",
    tools: [
      // ── Core Video Editing ──────────────────────────────────
      {
        id: "video-editor",
        name: "AI Video Editor",
        description:
          "Edit videos with AI-powered smart cuts, transitions, color grading, and timeline editing",
        icon: "film",
        status: "ready",
        tags: ["video", "edit", "cut", "trim", "timeline"],
        aiProviders: ["built-in"],
        outputs: ["mp4", "webm", "mov"],
        supportsPartEdit: true,
      },
      {
        id: "video-trimmer",
        name: "Smart Video Trimmer",
        description:
          "AI-powered video trimming that detects scenes, removes silence, and keeps the best parts",
        icon: "scissors",
        status: "ready",
        tags: ["trim", "cut", "scene detection", "silence removal"],
        aiProviders: ["built-in"],
        outputs: ["mp4", "webm"],
      },
      {
        id: "video-merger",
        name: "Video Merger & Joiner",
        description:
          "Merge multiple video clips into one seamless video with transition effects",
        icon: "layers",
        status: "ready",
        tags: ["merge", "join", "combine", "video"],
        outputs: ["mp4", "webm", "mov"],
      },
      // ── Motion Graphics & Effects ───────────────────────────
      {
        id: "motion-graphics",
        name: "Motion Graphics Creator",
        description:
          "Create professional motion graphics for ads, intros, explainers, and social content",
        icon: "zap",
        status: "ready",
        tags: ["motion", "graphics", "animation", "mograph"],
        aiProviders: ["luma"],
        outputs: ["mp4", "webm", "gif", "mov"],
        supportsPartEdit: true,
      },
      {
        id: "logo-reveal",
        name: "Logo Reveal Maker",
        description:
          "Generate cinematic logo reveals, stingers, and animated brand intros with 3D effects, particles, and light",
        icon: "sparkles",
        status: "ready",
        tags: ["logo", "reveal", "intro", "cinematic", "stinger"],
        aiProviders: ["luma", "runway"],
        outputs: ["mp4", "webm", "mov", "gif"],
        supportsPartEdit: true,
      },
      {
        id: "intro-outro",
        name: "Intro & Outro Creator",
        description:
          "Create YouTube intros, outros, end screens, and channel bumpers with animations",
        icon: "play",
        status: "ready",
        tags: ["intro", "outro", "youtube", "end screen", "bumper"],
        outputs: ["mp4", "webm", "gif"],
        supportsPartEdit: true,
      },
      {
        id: "text-animation",
        name: "Text & Title Animation",
        description:
          "Animate text, titles, lower thirds, typography reveals, and call-to-action overlays",
        icon: "type",
        status: "ready",
        tags: ["text", "animation", "title", "lower third", "CTA"],
        outputs: ["mp4", "webm", "gif"],
        supportsPartEdit: true,
      },
      {
        id: "kinetic-typography",
        name: "Kinetic Typography",
        description:
          "Create dynamic text animations synchronized with audio for lyrics, quotes, and storytelling",
        icon: "type",
        status: "ready",
        tags: ["kinetic", "typography", "lyrics", "audio sync"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "transition-effects",
        name: "Transition & Effects Library",
        description:
          "Apply cinematic transitions, glitch effects, light leaks, lens flares, and overlays",
        icon: "layers",
        status: "ready",
        tags: ["transition", "effects", "glitch", "cinematic", "overlay"],
        outputs: ["mp4", "webm"],
      },
      {
        id: "particle-effects",
        name: "Particle & VFX Creator",
        description:
          "Add particle systems, fire, smoke, sparks, rain, snow, dust, and environmental VFX",
        icon: "sparkles",
        status: "beta",
        tags: ["particles", "VFX", "effects", "fire", "smoke"],
        outputs: ["mp4", "webm", "mov"],
        supportsPartEdit: true,
      },
      {
        id: "3d-text",
        name: "3D Text & Object Animator",
        description:
          "Create 3D text animations, object reveals, and product spins with cinematic lighting",
        icon: "box",
        status: "beta",
        tags: ["3D", "text", "animation", "object", "product spin"],
        aiProviders: ["luma"],
        outputs: ["mp4", "webm", "mov"],
        supportsPartEdit: true,
      },
      // ── AI Video Generation ─────────────────────────────────
      {
        id: "text-to-video",
        name: "Text-to-Video Generator",
        description:
          "Turn text prompts into video clips with AI — commercials, scenes, B-roll, and concept videos",
        icon: "wand",
        status: "ready",
        tags: ["text-to-video", "AI", "generative", "commercial"],
        aiProviders: ["luma", "runway"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "image-to-video",
        name: "Image-to-Video Animator",
        description:
          "Bring still images to life with AI — camera motion, parallax, zoom, and cinematic movement",
        icon: "play",
        status: "ready",
        tags: ["image-to-video", "animate", "parallax", "camera motion"],
        aiProviders: ["luma", "runway"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "ai-b-roll",
        name: "AI B-Roll Generator",
        description:
          "Generate contextual B-roll footage from text descriptions to fill gaps in your videos",
        icon: "film",
        status: "beta",
        tags: ["B-roll", "stock", "AI", "footage", "contextual"],
        aiProviders: ["luma", "runway"],
        outputs: ["mp4", "webm"],
      },
      // ── Social & Marketing Video ────────────────────────────
      {
        id: "social-video",
        name: "Social Media Video",
        description:
          "Create vertical videos for Reels, TikTok, Shorts, and Stories with auto-format for each platform",
        icon: "smartphone",
        status: "ready",
        tags: ["social media", "reels", "tiktok", "shorts", "vertical"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "product-demo",
        name: "Product Demo Video",
        description:
          "Create product demonstration videos, unboxing sequences, and app walkthroughs",
        icon: "monitor",
        status: "ready",
        tags: ["product", "demo", "walkthrough", "unboxing"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "explainer-video",
        name: "Explainer Video Creator",
        description:
          "Build animated explainer videos for products, services, and complex concepts",
        icon: "messageCircle",
        status: "ready",
        tags: ["explainer", "animated", "whiteboard", "video"],
        aiProviders: ["claude"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "testimonial-video",
        name: "Testimonial Video Maker",
        description:
          "Create client testimonial videos with lower thirds, branding, and text overlays",
        icon: "star",
        status: "ready",
        tags: ["testimonial", "review", "client", "video"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "promo-video",
        name: "Promotional Video Creator",
        description:
          "Create promotional videos, sale announcements, and marketing video ads",
        icon: "megaphone",
        status: "ready",
        tags: ["promo", "promotional", "ad", "sale", "marketing"],
        outputs: ["mp4", "webm", "gif"],
        supportsPartEdit: true,
      },
      {
        id: "countdown-timer",
        name: "Countdown & Timer Video",
        description:
          "Create animated countdown timers, launch countdowns, and event teasers",
        icon: "clock",
        status: "ready",
        tags: ["countdown", "timer", "launch", "teaser"],
        outputs: ["mp4", "gif"],
        supportsPartEdit: true,
      },
      // ── Utility Video Tools ─────────────────────────────────
      {
        id: "thumbnail-generator",
        name: "Thumbnail Generator",
        description:
          "Design click-worthy thumbnails for YouTube, courses, podcasts, and video content",
        icon: "image",
        status: "ready",
        tags: ["thumbnail", "youtube", "click", "CTR"],
        outputs: ["png", "jpg"],
        supportsPartEdit: true,
      },
      {
        id: "slideshow-video",
        name: "Slideshow Video Maker",
        description:
          "Turn images into stunning slideshow videos with transitions, Ken Burns, and music sync",
        icon: "image",
        status: "ready",
        tags: ["slideshow", "photo", "video", "Ken Burns"],
        outputs: ["mp4", "webm"],
        supportsPartEdit: true,
      },
      {
        id: "subtitle-caption",
        name: "Subtitle & Caption Generator",
        description:
          "Auto-generate accurate subtitles, captions, and SRT files with AI transcription in 50+ languages",
        icon: "subtitles",
        status: "ready",
        tags: ["subtitle", "caption", "transcription", "SRT", "multilingual"],
        aiProviders: ["whisper"],
        outputs: ["mp4", "json"],
      },
      {
        id: "video-script",
        name: "Video Script Writer",
        description:
          "Write engaging video scripts for any platform with scene descriptions and shot lists",
        icon: "fileText",
        status: "ready",
        tags: ["script", "writing", "video", "shot list"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
      },
      {
        id: "gif-converter",
        name: "Video-to-GIF Converter",
        description:
          "Convert video clips to optimized GIFs with frame control, speed, and loop settings",
        icon: "repeat",
        status: "ready",
        tags: ["GIF", "convert", "video", "loop"],
        outputs: ["gif", "webp"],
      },
      {
        id: "color-grading",
        name: "Video Color Grading",
        description:
          "Professional color grading, LUT application, and color matching across video clips",
        icon: "droplet",
        status: "ready",
        tags: ["color", "grading", "LUT", "cinematic", "matching"],
        outputs: ["mp4", "mov"],
        supportsPartEdit: true,
      },
      {
        id: "audio-sync",
        name: "Audio & Music Sync",
        description:
          "Auto-sync video cuts to music beats, add royalty-free music, and mix audio tracks",
        icon: "music",
        status: "ready",
        tags: ["audio", "music", "sync", "beat", "royalty-free"],
        outputs: ["mp4", "mp3", "wav"],
      },
      {
        id: "screen-recorder",
        name: "Screen Recording Editor",
        description:
          "Record, edit, and enhance screen recordings with cursor effects, zoom, and annotations",
        icon: "monitor",
        status: "ready",
        tags: ["screen", "recording", "tutorial", "cursor", "annotation"],
        outputs: ["mp4", "webm", "gif"],
        supportsPartEdit: true,
      },
      {
        id: "video-background-remover",
        name: "Video Background Remover",
        description:
          "Remove and replace video backgrounds in real-time with AI chroma keying",
        icon: "scissors",
        status: "beta",
        tags: ["background", "remove", "green screen", "chroma key"],
        aiProviders: ["built-in"],
        outputs: ["mp4", "webm"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // 🔊  4.  AUDIO & VOICE STUDIO
  // ════════════════════════════════════════════════════════════
  {
    id: "audio",
    name: "Audio & Voice Studio",
    description:
      "AI voice generation, audio editing, podcast tools, music creation, and sound design",
    icon: "headphones",
    colorClass: "bg-info",
    textColorClass: "text-info",
    ringColorClass: "ring-info/30",
    tools: [
      {
        id: "text-to-speech",
        name: "Text-to-Speech Generator",
        description:
          "Convert text to natural-sounding speech with 100+ voices, accents, and emotions",
        icon: "mic",
        status: "ready",
        tags: ["TTS", "voice", "speech", "narration"],
        aiProviders: ["elevenlabs"],
        outputs: ["mp3", "wav"],
      },
      {
        id: "voice-cloning",
        name: "Voice Cloning Studio",
        description:
          "Clone voices for consistent branding, audiobooks, and content narration",
        icon: "mic",
        status: "beta",
        tags: ["voice clone", "brand voice", "consistent", "narration"],
        aiProviders: ["elevenlabs"],
        outputs: ["mp3", "wav"],
      },
      {
        id: "voiceover-studio",
        name: "Voiceover Studio",
        description:
          "Record, edit, and enhance voiceovers with noise removal, EQ, and compression",
        icon: "mic",
        status: "ready",
        tags: ["voiceover", "recording", "narration", "audio"],
        outputs: ["mp3", "wav"],
        supportsPartEdit: true,
      },
      {
        id: "podcast-editor",
        name: "Podcast Editor",
        description:
          "Edit podcasts with AI — remove filler words, level audio, add intros/outros, and master",
        icon: "headphones",
        status: "ready",
        tags: ["podcast", "edit", "filler removal", "mastering"],
        aiProviders: ["whisper", "built-in"],
        outputs: ["mp3", "wav"],
        supportsPartEdit: true,
      },
      {
        id: "audio-transcription",
        name: "Audio Transcription",
        description:
          "Transcribe audio and video to text with speaker detection, timestamps, and summaries",
        icon: "fileText",
        status: "ready",
        tags: ["transcription", "speech-to-text", "speaker", "summary"],
        aiProviders: ["whisper"],
        outputs: ["json", "docx", "pdf"],
      },
      {
        id: "music-generator",
        name: "AI Music Generator",
        description:
          "Generate royalty-free background music, jingles, and soundtracks from text prompts",
        icon: "music",
        status: "ready",
        tags: ["music", "AI", "soundtrack", "jingle", "royalty-free"],
        aiProviders: ["suno"],
        outputs: ["mp3", "wav"],
        supportsPartEdit: true,
      },
      {
        id: "sound-effects",
        name: "Sound Effects Generator",
        description:
          "Generate and browse sound effects — whooshes, impacts, UI sounds, nature, and ambience",
        icon: "zap",
        status: "ready",
        tags: ["SFX", "sound effects", "foley", "ambience"],
        aiProviders: ["built-in"],
        outputs: ["mp3", "wav"],
      },
      {
        id: "audio-enhancer",
        name: "Audio Enhancer & Denoiser",
        description:
          "Remove background noise, enhance speech clarity, and master audio to broadcast quality",
        icon: "zap",
        status: "ready",
        tags: ["denoise", "enhance", "master", "clarity"],
        aiProviders: ["built-in"],
        outputs: ["mp3", "wav"],
      },
      {
        id: "audio-converter",
        name: "Audio Format Converter",
        description:
          "Convert between MP3, WAV, FLAC, AAC, OGG, and other audio formats with quality settings",
        icon: "repeat",
        status: "ready",
        tags: ["convert", "format", "audio", "MP3", "WAV"],
        outputs: ["mp3", "wav"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // ✍️  5.  CONTENT CREATION
  // ════════════════════════════════════════════════════════════
  {
    id: "content",
    name: "Content Creation",
    description:
      "AI writing, copywriting, content planning, creative text generation, and SEO content",
    icon: "penTool",
    colorClass: "bg-warning",
    textColorClass: "text-warning",
    ringColorClass: "ring-warning/30",
    tools: [
      // ── Long-Form Writing ───────────────────────────────────
      {
        id: "blog-writer",
        name: "Blog & Article Writer",
        description:
          "Write SEO-optimized blog posts, articles, and thought leadership pieces with AI-powered research",
        icon: "fileText",
        status: "ready",
        tags: ["blog", "article", "SEO", "writing", "thought leadership"],
        aiProviders: ["claude"],
        outputs: ["html", "docx", "pdf"],
        supportsPartEdit: true,
      },
      {
        id: "website-copy",
        name: "Website Copywriter",
        description:
          "Write complete website copy — homepages, about pages, services, FAQs, and more with SEO optimization",
        icon: "globe",
        status: "ready",
        tags: ["website", "copy", "web", "pages", "SEO"],
        aiProviders: ["claude"],
        outputs: ["html", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "landing-page-copy",
        name: "Landing Page Copy",
        description:
          "Write high-converting landing page copy with headlines, benefits, CTAs, and objection handling",
        icon: "layout",
        status: "ready",
        tags: ["landing page", "copy", "conversion", "CTA", "objection"],
        aiProviders: ["claude"],
        outputs: ["html", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "ebook-writer",
        name: "eBook Writer",
        description:
          "Write complete eBooks chapter-by-chapter with AI — outlines, drafts, and final polished content",
        icon: "bookOpen",
        status: "ready",
        tags: ["ebook", "book", "chapter", "long-form", "writing"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      // ── Social & Short-Form ─────────────────────────────────
      {
        id: "social-caption",
        name: "Social Media Caption Generator",
        description:
          "Generate engaging captions for all social platforms with hashtags, emojis, and CTAs",
        icon: "messageCircle",
        status: "ready",
        tags: ["caption", "social media", "hashtag", "engagement"],
        aiProviders: ["claude"],
        outputs: ["json"],
      },
      {
        id: "thread-writer",
        name: "Thread & Carousel Writer",
        description:
          "Write viral Twitter/X threads and LinkedIn carousel scripts with hooks and engagement patterns",
        icon: "layers",
        status: "ready",
        tags: ["thread", "twitter", "linkedin", "viral", "carousel"],
        aiProviders: ["claude"],
        outputs: ["json", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "hashtag-generator",
        name: "Hashtag Generator",
        description:
          "Generate trending, niche-specific, and branded hashtag sets with reach estimates",
        icon: "hash",
        status: "ready",
        tags: ["hashtag", "trending", "social media", "reach"],
        aiProviders: ["claude"],
        outputs: ["json"],
      },
      // ── Email & Outreach ────────────────────────────────────
      {
        id: "email-campaign",
        name: "Email Campaign Writer",
        description:
          "Write email sequences, newsletters, drip campaigns, and marketing emails with A/B variants",
        icon: "mail",
        status: "ready",
        tags: ["email", "campaign", "newsletter", "marketing", "drip"],
        aiProviders: ["claude"],
        outputs: ["html", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "cold-outreach",
        name: "Cold Outreach Writer",
        description:
          "Write personalized cold emails, DMs, and outreach sequences that get responses",
        icon: "mail",
        status: "ready",
        tags: ["cold email", "outreach", "personalized", "sales"],
        aiProviders: ["claude"],
        outputs: ["docx"],
        supportsPartEdit: true,
      },
      // ── SEO & Optimization ──────────────────────────────────
      {
        id: "seo-optimizer",
        name: "SEO Content Optimizer",
        description:
          "Optimize content for search with keyword analysis, semantic clusters, and SERP insights",
        icon: "search",
        status: "ready",
        tags: ["SEO", "keywords", "optimization", "SERP", "semantic"],
        aiProviders: ["claude"],
        outputs: ["html", "json"],
      },
      {
        id: "meta-description",
        name: "Meta Description Generator",
        description:
          "Generate SEO-optimized meta descriptions, title tags, and schema markup for any page",
        icon: "search",
        status: "ready",
        tags: ["meta", "description", "title tag", "schema", "SEO"],
        aiProviders: ["claude"],
        outputs: ["json", "html"],
      },
      // ── Advertising Copy ────────────────────────────────────
      {
        id: "ad-copy",
        name: "Ad Copy Generator",
        description:
          "Generate high-converting ad copy for Google Ads, Meta Ads, LinkedIn, TikTok, and display ads",
        icon: "megaphone",
        status: "ready",
        tags: ["ad", "copy", "advertising", "conversion", "Google Ads"],
        aiProviders: ["claude"],
        outputs: ["json", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "product-description",
        name: "Product Description Writer",
        description:
          "Write compelling product descriptions for e-commerce, catalogs, and Amazon listings",
        icon: "tag",
        status: "ready",
        tags: ["product", "description", "e-commerce", "Amazon"],
        aiProviders: ["claude"],
        outputs: ["html", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "tagline-slogan",
        name: "Tagline & Slogan Generator",
        description:
          "Generate memorable taglines, slogans, brand catchphrases, and mission statements",
        icon: "sparkles",
        status: "ready",
        tags: ["tagline", "slogan", "branding", "mission"],
        aiProviders: ["claude"],
        outputs: ["json"],
      },
      // ── Planning & Strategy ─────────────────────────────────
      {
        id: "content-calendar",
        name: "Content Calendar Planner",
        description:
          "Plan and schedule content across all platforms with AI suggestions and content pillars",
        icon: "calendar",
        status: "ready",
        tags: ["calendar", "planning", "schedule", "content pillars"],
        aiProviders: ["claude"],
        outputs: ["json", "xlsx"],
      },
      {
        id: "content-repurposer",
        name: "Content Repurposer",
        description:
          "Transform one piece of content into 10+ formats — blog → threads, carousels, videos, emails",
        icon: "repeat",
        status: "ready",
        tags: ["repurpose", "transform", "multi-format", "recycle"],
        aiProviders: ["claude"],
        outputs: ["json", "docx"],
      },
      // ── Professional Writing ────────────────────────────────
      {
        id: "press-release",
        name: "Press Release Writer",
        description:
          "Write professional press releases, media announcements, and news articles with AP style",
        icon: "newspaper",
        status: "ready",
        tags: ["press release", "PR", "media", "announcement", "AP style"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "speech-writer",
        name: "Speech & Script Writer",
        description:
          "Write speeches, presentation scripts, keynote outlines, and MC scripts with timing",
        icon: "mic",
        status: "ready",
        tags: ["speech", "script", "keynote", "presentation", "MC"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "podcast-notes",
        name: "Podcast Show Notes",
        description:
          "Generate podcast show notes, timestamps, episode summaries, and guest bios",
        icon: "headphones",
        status: "ready",
        tags: ["podcast", "show notes", "summary", "timestamps"],
        aiProviders: ["claude", "whisper"],
        outputs: ["html", "docx"],
      },
      {
        id: "youtube-description",
        name: "YouTube Description Generator",
        description:
          "Write optimized YouTube descriptions with chapters, timestamps, links, and SEO keywords",
        icon: "play",
        status: "ready",
        tags: ["youtube", "description", "SEO", "chapters"],
        aiProviders: ["claude"],
        outputs: ["json"],
      },
      {
        id: "testimonial-generator",
        name: "Testimonial Request Generator",
        description:
          "Generate testimonial request templates, follow-up sequences, and review prompts",
        icon: "star",
        status: "ready",
        tags: ["testimonial", "review", "social proof", "request"],
        aiProviders: ["claude"],
        outputs: ["docx"],
      },
      {
        id: "ai-translator",
        name: "AI Content Translator",
        description:
          "Translate content into 100+ languages while preserving tone, style, and brand voice",
        icon: "globe",
        status: "ready",
        tags: ["translate", "language", "localization", "multilingual"],
        aiProviders: ["claude"],
        outputs: ["docx", "json"],
        supportsPartEdit: true,
      },
      {
        id: "grammar-checker",
        name: "Grammar & Style Checker",
        description:
          "Check grammar, spelling, tone, readability, and style with AI-powered suggestions",
        icon: "penTool",
        status: "ready",
        tags: ["grammar", "spelling", "tone", "readability", "proofread"],
        aiProviders: ["claude"],
        outputs: ["json"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // 📊  6.  MARKETING & SALES
  // ════════════════════════════════════════════════════════════
  {
    id: "marketing",
    name: "Marketing & Sales",
    description:
      "Marketing strategy, campaign management, analytics, sales tools, and growth automation",
    icon: "trendingUp",
    colorClass: "bg-wire-transfer",
    textColorClass: "text-wire-transfer",
    ringColorClass: "ring-wire-transfer/30",
    tools: [
      // ── Strategy & Planning ─────────────────────────────────
      {
        id: "marketing-strategy",
        name: "Marketing Strategy Planner",
        description:
          "Build comprehensive marketing strategies with AI-powered competitive insights and channel recommendations",
        icon: "target",
        status: "ready",
        tags: ["strategy", "marketing", "planning", "competitive"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
      {
        id: "campaign-builder",
        name: "Campaign Builder",
        description:
          "Plan and execute multi-channel marketing campaigns with budgets, timelines, and KPIs",
        icon: "megaphone",
        status: "ready",
        tags: ["campaign", "multi-channel", "marketing", "KPI"],
        aiProviders: ["claude"],
        outputs: ["pdf", "xlsx"],
        supportsPartEdit: true,
      },
      {
        id: "social-strategy",
        name: "Social Media Strategy",
        description:
          "Plan social media strategies with content pillars, posting schedules, and growth tactics",
        icon: "share",
        status: "ready",
        tags: ["social media", "strategy", "content pillars", "growth"],
        aiProviders: ["claude"],
        outputs: ["pdf", "xlsx"],
        supportsPartEdit: true,
      },
      {
        id: "brand-positioning",
        name: "Brand Positioning Framework",
        description:
          "Define brand positioning, unique value proposition, and competitive differentiation strategy",
        icon: "target",
        status: "ready",
        tags: ["positioning", "UVP", "differentiation", "brand"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
      {
        id: "go-to-market",
        name: "Go-to-Market Plan",
        description:
          "Build comprehensive GTM plans for product launches with channels, messaging, and timeline",
        icon: "trendingUp",
        status: "ready",
        tags: ["GTM", "launch", "go-to-market", "product launch"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
      // ── Research & Analysis ─────────────────────────────────
      {
        id: "customer-persona",
        name: "Customer Persona Builder",
        description:
          "Create detailed buyer personas with demographics, psychographics, pain points, and buying triggers",
        icon: "users",
        status: "ready",
        tags: ["persona", "buyer", "customer", "profile", "psychographics"],
        aiProviders: ["claude"],
        outputs: ["pdf", "png"],
        supportsPartEdit: true,
      },
      {
        id: "competitor-analysis",
        name: "Competitor Analysis Tool",
        description:
          "Analyze competitors — strengths, weaknesses, pricing, messaging, and strategic gaps",
        icon: "search",
        status: "ready",
        tags: ["competitor", "analysis", "strategy", "SWOT"],
        aiProviders: ["claude"],
        outputs: ["pdf", "xlsx"],
        supportsPartEdit: true,
      },
      {
        id: "market-research",
        name: "Market Research Brief",
        description:
          "Generate market research briefs, industry analysis, and trend reports with AI insights",
        icon: "chart",
        status: "ready",
        tags: ["market research", "industry", "trends", "analysis"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "swot-analysis",
        name: "SWOT Analysis Generator",
        description:
          "Generate comprehensive SWOT analyses with actionable recommendations and priority matrix",
        icon: "grid",
        status: "ready",
        tags: ["SWOT", "analysis", "strategy", "strengths"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
      // ── Sales Tools ─────────────────────────────────────────
      {
        id: "sales-funnel",
        name: "Sales Funnel Designer",
        description:
          "Design and visualize sales funnels with conversion optimization tips and email sequences",
        icon: "filter",
        status: "ready",
        tags: ["funnel", "sales", "conversion", "optimization"],
        aiProviders: ["claude"],
        outputs: ["pdf", "png"],
        supportsPartEdit: true,
      },
      {
        id: "lead-magnet",
        name: "Lead Magnet Creator",
        description:
          "Create lead magnets — checklists, guides, templates, worksheets, and calculators",
        icon: "magnet",
        status: "ready",
        tags: ["lead magnet", "checklist", "guide", "freebie"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      {
        id: "sales-deck",
        name: "Sales Deck Builder",
        description:
          "Build persuasive sales decks with data, client success stories, and ROI projections",
        icon: "presentation",
        status: "ready",
        tags: ["sales deck", "presentation", "pitch", "ROI"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
      {
        id: "proposal-writer",
        name: "Sales Proposal Writer",
        description:
          "Write customized sales proposals with scope, pricing, timelines, and terms",
        icon: "fileText",
        status: "ready",
        tags: ["proposal", "sales", "scope", "pricing"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
        supportsPartEdit: true,
      },
      // ── Testing & Optimization ──────────────────────────────
      {
        id: "ab-test-copy",
        name: "A/B Test Copy Generator",
        description:
          "Generate A/B test variants for headlines, CTAs, email subject lines, and ad copy",
        icon: "split",
        status: "ready",
        tags: ["A/B test", "variant", "optimization", "CTA"],
        aiProviders: ["claude"],
        outputs: ["json", "docx"],
      },
      {
        id: "email-sequence",
        name: "Email Sequence Builder",
        description:
          "Build automated email sequences for welcome series, nurturing, onboarding, and win-back",
        icon: "mail",
        status: "ready",
        tags: ["email", "sequence", "automation", "nurture", "drip"],
        aiProviders: ["claude"],
        outputs: ["html", "json"],
        supportsPartEdit: true,
      },
      // ── Calculators & Analytics ─────────────────────────────
      {
        id: "pricing-calculator",
        name: "Pricing Strategy Calculator",
        description:
          "Calculate optimal pricing with cost analysis, margin planning, and competitive benchmarking",
        icon: "calculator",
        status: "ready",
        tags: ["pricing", "calculator", "margin", "strategy"],
        aiProviders: ["claude"],
        outputs: ["xlsx", "pdf"],
      },
      {
        id: "roi-calculator",
        name: "ROI Calculator & Reporter",
        description:
          "Calculate and present ROI for campaigns, projects, and investments with visual reports",
        icon: "trendingUp",
        status: "ready",
        tags: ["ROI", "calculator", "campaign", "investment"],
        aiProviders: ["claude"],
        outputs: ["pdf", "xlsx"],
        supportsPartEdit: true,
      },
      {
        id: "analytics-dashboard",
        name: "Analytics Report Builder",
        description:
          "Build marketing analytics reports with KPI dashboards, charts, and executive summaries",
        icon: "chart",
        status: "beta",
        tags: ["analytics", "dashboard", "KPI", "report"],
        aiProviders: ["claude"],
        outputs: ["pdf", "pptx"],
        supportsPartEdit: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // 🌐  7.  WEB & UI DESIGN
  // ════════════════════════════════════════════════════════════
  {
    id: "web",
    name: "Web & UI Design",
    description:
      "Website design, UI/UX prototyping, wireframing, and web asset creation",
    icon: "globe",
    colorClass: "bg-bank-transfer",
    textColorClass: "text-bank-transfer",
    ringColorClass: "ring-bank-transfer/30",
    tools: [
      {
        id: "website-builder",
        name: "AI Website Builder",
        description:
          "Generate complete website designs from text descriptions — layouts, hero sections, and components",
        icon: "globe",
        status: "ready",
        tags: ["website", "builder", "design", "layout", "AI"],
        aiProviders: ["claude"],
        outputs: ["html", "png"],
        supportsPartEdit: true,
      },
      {
        id: "wireframe-generator",
        name: "Wireframe Generator",
        description:
          "Generate wireframes and low-fidelity prototypes from text descriptions or sketches",
        icon: "layout",
        status: "ready",
        tags: ["wireframe", "prototype", "low-fi", "UX"],
        aiProviders: ["claude"],
        outputs: ["png", "svg", "pdf"],
        supportsPartEdit: true,
      },
      {
        id: "ui-component-designer",
        name: "UI Component Designer",
        description:
          "Design buttons, forms, cards, navigation bars, and UI elements with consistent styling",
        icon: "layout",
        status: "ready",
        tags: ["UI", "component", "button", "form", "design system"],
        outputs: ["png", "svg", "html"],
        supportsPartEdit: true,
      },
      {
        id: "app-screen-designer",
        name: "App Screen Designer",
        description:
          "Design mobile app screens, tablet layouts, and responsive UI mockups",
        icon: "smartphone",
        status: "ready",
        tags: ["app", "mobile", "screen", "UI", "responsive"],
        outputs: ["png", "svg", "pdf"],
        supportsPartEdit: true,
      },
      {
        id: "email-template",
        name: "Email Template Designer",
        description:
          "Design responsive HTML email templates for newsletters, promotions, and transactional emails",
        icon: "mail",
        status: "ready",
        tags: ["email", "template", "HTML", "responsive", "newsletter"],
        outputs: ["html", "png"],
        supportsPartEdit: true,
      },
      {
        id: "favicon-generator",
        name: "Favicon & App Icon Generator",
        description:
          "Generate favicons, PWA icons, app store icons, and adaptive icons in all required sizes",
        icon: "image",
        status: "ready",
        tags: ["favicon", "app icon", "PWA", "sizes"],
        outputs: ["png", "svg"],
      },
      {
        id: "og-image-generator",
        name: "Open Graph Image Generator",
        description:
          "Generate OG images, Twitter cards, and social share images for any URL or content",
        icon: "image",
        status: "ready",
        tags: ["OG image", "social share", "Twitter card", "meta"],
        outputs: ["png", "jpg"],
        supportsPartEdit: true,
      },
      {
        id: "screenshot-beautifier",
        name: "Screenshot Beautifier",
        description:
          "Add device frames, backgrounds, annotations, and branding to screenshots",
        icon: "monitor",
        status: "ready",
        tags: ["screenshot", "mockup", "device frame", "annotation"],
        outputs: ["png", "jpg"],
        supportsPartEdit: true,
      },
      {
        id: "css-gradient",
        name: "CSS Gradient Generator",
        description:
          "Create beautiful CSS gradients, mesh gradients, and gradient backgrounds with code export",
        icon: "droplet",
        status: "ready",
        tags: ["CSS", "gradient", "mesh", "background", "code"],
        outputs: ["html", "png"],
      },
      {
        id: "svg-animator",
        name: "SVG Animation Studio",
        description:
          "Create and animate SVG graphics — line draws, morphs, path animations, and micro-interactions",
        icon: "zap",
        status: "beta",
        tags: ["SVG", "animation", "line draw", "morph", "micro-interaction"],
        outputs: ["svg", "html", "gif"],
        supportsPartEdit: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // 🔧  8.  UTILITIES & WORKFLOW
  // ════════════════════════════════════════════════════════════
  {
    id: "utilities",
    name: "Utilities & Workflow",
    description:
      "Essential tools for file management, conversion, project management, and workflow optimization",
    icon: "settings",
    colorClass: "bg-gray-500",
    textColorClass: "text-gray-400",
    ringColorClass: "ring-gray-500/30",
    tools: [
      // ── AI Assistant ────────────────────────────────────────
      {
        id: "ai-chat",
        name: "AI Chat Assistant",
        description:
          "Chat with Claude AI for brainstorming, creative direction, problem-solving, and any question",
        icon: "messageCircle",
        status: "ready",
        tags: ["AI", "chat", "assistant", "brainstorm", "Claude"],
        aiProviders: ["claude"],
        outputs: ["json"],
      },
      {
        id: "ai-image-chat",
        name: "AI Vision Analyzer",
        description:
          "Upload images and get AI analysis — describe designs, suggest improvements, extract colors and fonts",
        icon: "sparkles",
        status: "ready",
        tags: ["AI", "vision", "image", "analyze", "describe"],
        aiProviders: ["claude"],
        outputs: ["json"],
      },
      // ── File Tools ──────────────────────────────────────────
      {
        id: "file-converter",
        name: "File Format Converter",
        description:
          "Convert between image, video, document, and audio formats — 100+ format combinations",
        icon: "repeat",
        status: "ready",
        tags: ["convert", "format", "file", "image", "video"],
        outputs: ["png", "jpg", "pdf", "mp4", "svg"],
      },
      {
        id: "batch-processor",
        name: "Batch Image Processor",
        description:
          "Resize, crop, compress, watermark, rename, and format-convert multiple images at once",
        icon: "layers",
        status: "ready",
        tags: ["batch", "process", "resize", "compress", "watermark"],
        outputs: ["png", "jpg", "webp"],
      },
      {
        id: "image-compression",
        name: "Image Compressor",
        description:
          "Compress images for web without visible quality loss — WebP, AVIF, and optimized PNG/JPG",
        icon: "minimize",
        status: "ready",
        tags: ["compress", "optimize", "web", "image", "WebP", "AVIF"],
        outputs: ["webp", "avif", "png", "jpg"],
      },
      {
        id: "pdf-tools",
        name: "PDF Tools Suite",
        description:
          "Merge, split, compress, convert, protect, and sign PDFs with smart processing",
        icon: "fileText",
        status: "ready",
        tags: ["PDF", "merge", "split", "compress", "sign"],
        outputs: ["pdf"],
      },
      // ── Brand & Asset Management ────────────────────────────
      {
        id: "brand-kit-manager",
        name: "Brand Kit Manager",
        description:
          "Store and manage brand assets — logos, colors, fonts, guidelines, and templates in one place",
        icon: "briefcase",
        status: "ready",
        tags: ["brand kit", "assets", "management", "guidelines"],
      },
      {
        id: "asset-library",
        name: "Asset Library",
        description:
          "Organize, tag, search, and share all your design assets with smart AI categorization",
        icon: "folder",
        status: "ready",
        tags: ["assets", "library", "organize", "search", "DAM"],
      },
      {
        id: "style-guide",
        name: "Style Guide Generator",
        description:
          "Auto-generate comprehensive style guides from your brand assets with usage examples",
        icon: "bookOpen",
        status: "ready",
        tags: ["style guide", "documentation", "brand", "usage"],
        outputs: ["pdf", "html"],
      },
      // ── Project Management ──────────────────────────────────
      {
        id: "project-manager",
        name: "Project Manager",
        description:
          "Track design projects, deadlines, revisions, and client deliverables with kanban boards",
        icon: "clipboard",
        status: "ready",
        tags: ["project", "management", "deadline", "kanban"],
      },
      {
        id: "client-brief",
        name: "Client Brief Generator",
        description:
          "Create structured client briefs from conversations, meeting notes, or requirements with AI",
        icon: "fileText",
        status: "ready",
        tags: ["brief", "client", "requirements", "discovery"],
        aiProviders: ["claude"],
        outputs: ["pdf", "docx"],
      },
      {
        id: "feedback-collector",
        name: "Feedback & Review Collector",
        description:
          "Collect, organize, and track client feedback on design deliverables with annotation tools",
        icon: "messageCircle",
        status: "ready",
        tags: ["feedback", "review", "approval", "annotation"],
      },
      {
        id: "invoice-tracker",
        name: "Invoice & Payment Tracker",
        description:
          "Track invoices, payments, and outstanding balances for freelance and agency work",
        icon: "receipt",
        status: "ready",
        tags: ["invoice", "payment", "tracking", "freelance"],
      },
      // ── Design Utilities ────────────────────────────────────
      {
        id: "qr-code",
        name: "QR Code Generator",
        description:
          "Generate branded QR codes with custom colors, logos, patterns, and trackable analytics",
        icon: "grid",
        status: "ready",
        tags: ["QR code", "link", "scannable", "branded"],
        outputs: ["svg", "png", "pdf"],
      },
      {
        id: "barcode-generator",
        name: "Barcode Generator",
        description:
          "Generate barcodes — UPC, EAN, Code 128, and Data Matrix for products and inventory",
        icon: "grid",
        status: "ready",
        tags: ["barcode", "UPC", "EAN", "product", "inventory"],
        outputs: ["svg", "png", "pdf"],
      },
      {
        id: "watermark-tool",
        name: "Watermark Tool",
        description:
          "Add text or image watermarks to photos, documents, and videos with batch processing",
        icon: "shield",
        status: "ready",
        tags: ["watermark", "protect", "branding", "batch"],
        outputs: ["png", "jpg", "pdf"],
      },
      {
        id: "color-converter",
        name: "Color Code Converter",
        description:
          "Convert between HEX, RGB, HSL, CMYK, Pantone, and RAL color codes with visual preview",
        icon: "droplet",
        status: "ready",
        tags: ["color", "convert", "HEX", "RGB", "CMYK", "Pantone"],
        outputs: ["json"],
      },
      {
        id: "unit-converter",
        name: "Design Unit Converter",
        description:
          "Convert between px, pt, em, rem, cm, mm, inches, and DPI for print and digital",
        icon: "calculator",
        status: "ready",
        tags: ["unit", "convert", "pixel", "print", "DPI"],
      },
      {
        id: "contrast-checker",
        name: "Contrast & Accessibility Checker",
        description:
          "Check color contrast ratios, WCAG compliance, and accessibility scores for designs",
        icon: "helpCircle",
        status: "ready",
        tags: ["contrast", "accessibility", "WCAG", "a11y"],
        outputs: ["json", "pdf"],
      },
    ],
  },
];

// ── Derived helpers ─────────────────────────────────────────

/** Total number of tools across all categories */
export const totalToolCount = toolCategories.reduce(
  (acc, cat) => acc + cat.tools.length,
  0
);

/** Get tools count by status */
export function getToolCountByStatus(status: ToolStatus): number {
  return toolCategories.reduce(
    (acc, cat) => acc + cat.tools.filter((t) => t.status === status).length,
    0
  );
}

/** Get tools that support part-editing */
export function getPartEditTools(): FlatTool[] {
  return getAllToolsFlat().filter((t) => t.supportsPartEdit);
}

/** Get tools by AI provider */
export function getToolsByProvider(provider: AIProvider): FlatTool[] {
  return getAllToolsFlat().filter(
    (t) => t.aiProviders && t.aiProviders.includes(provider)
  );
}

/** Get print-ready tools */
export function getPrintReadyTools(): FlatTool[] {
  return getAllToolsFlat().filter((t) => t.printReady);
}

/** Flat list of all tools with category info */
export interface FlatTool extends Tool {
  categoryId: string;
  categoryName: string;
}

export function getAllToolsFlat(): FlatTool[] {
  return toolCategories.flatMap((cat) =>
    cat.tools.map((tool) => ({
      ...tool,
      categoryId: cat.id,
      categoryName: cat.name,
    }))
  );
}

/** Search tools by query */
export function searchTools(query: string): FlatTool[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getAllToolsFlat().filter(
    (tool) =>
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      tool.categoryName.toLowerCase().includes(q)
  );
}

// ── Hub stats data ──────────────────────────────────────────

export interface HubStat {
  label: string;
  value: string;
  icon: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
}

export const hubStats: HubStat[] = [
  {
    label: "Total Tools",
    value: totalToolCount.toString(),
    icon: "grid",
    change: `${getToolCountByStatus("ready")} ready`,
    changeType: "up",
  },
  {
    label: "Part-Edit Ready",
    value: getPartEditTools().length.toString(),
    icon: "penTool",
    change: "Edit without redo",
    changeType: "up",
  },
  {
    label: "AI Providers",
    value: "8",
    icon: "zap",
    change: "Claude, Luma, Runway +5",
    changeType: "up",
  },
  {
    label: "Print Ready",
    value: getPrintReadyTools().length.toString(),
    icon: "fileText",
    change: "A3→A6, Letter, DL",
    changeType: "up",
  },
];

// ── Quick access / featured tools ───────────────────────────

export const featuredToolIds: string[] = [
  "logo-generator",
  "sales-book-a4",
  "social-media-post",
  "video-editor",
  "text-to-video",
  "logo-reveal",
  "ai-chat",
  "text-to-speech",
  "brand-identity",
  "proposal-generator",
  "website-builder",
  "music-generator",
];

// ── Sidebar navigation for the AI suite ─────────────────────

export interface SuiteNavItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
}

export interface SuiteNavGroup {
  label: string;
  items: SuiteNavItem[];
}

export const suiteNavGroups: SuiteNavGroup[] = [
  {
    label: "MAIN",
    items: [
      { icon: "grid", label: "Dashboard", href: "/dashboard", active: true },
      { icon: "folder", label: "My Projects", href: "/projects" },
      { icon: "briefcase", label: "Brand Kit", href: "/brand-kit" },
      { icon: "clock", label: "Recent", href: "/recent" },
    ],
  },
  {
    label: "CREATIVE STUDIOS",
    items: [
      { icon: "palette", label: "Design Studio", href: "/dashboard#design" },
      { icon: "fileText", label: "Documents & Print", href: "/dashboard#documents" },
      { icon: "video", label: "Video & Motion", href: "/dashboard#video" },
      { icon: "headphones", label: "Audio & Voice", href: "/dashboard#audio", badge: "New" },
      { icon: "penTool", label: "Content", href: "/dashboard#content" },
      { icon: "trendingUp", label: "Marketing & Sales", href: "/dashboard#marketing" },
      { icon: "globe", label: "Web & UI Design", href: "/dashboard#web", badge: "New" },
      { icon: "settings", label: "Utilities", href: "/dashboard#utilities" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { icon: "settings", label: "Settings", href: "/settings" },
      { icon: "helpCircle", label: "Help Center", href: "/help" },
    ],
  },
];
