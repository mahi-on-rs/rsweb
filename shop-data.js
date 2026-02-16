const TOPSEAL_DATA_KEY = "topseal_admin_data";

const TOPSEAL_DEFAULT_DATA = {
  settings: {
    brandName: "TOP SEAL",
    whatsappNumber: "8801894527991",
    primaryColor: "#1c4e80"
  },
  homeSlides: [],
  categories: [
    {
      id: "cat-spray-paints",
      label: "Spray Paints",
      slug: "spray-paints",
      subcategories: [
        { id: "sub-general-use", label: "General Use", slug: "general-use" },
        { id: "sub-high-performance", label: "High Performance", slug: "high-performance" }
      ]
    },
    {
      id: "cat-adhesives",
      label: "Adhesives",
      slug: "adhesives",
      subcategories: [
        { id: "sub-instant-bond", label: "Instant Bond", slug: "instant-bond" },
        { id: "sub-structural", label: "Structural", slug: "structural" },
        { id: "sub-construction", label: "Construction", slug: "construction" }
      ]
    },
    {
      id: "cat-automotive",
      label: "Automotive",
      slug: "automotive",
      subcategories: [
        { id: "sub-car-care", label: "Car Care", slug: "car-care" },
        { id: "sub-cleaners", label: "Cleaners", slug: "cleaners" }
      ]
    },
    {
      id: "cat-hardware",
      label: "Hardware",
      slug: "hardware",
      subcategories: [
        { id: "sub-fasteners", label: "Fasteners", slug: "fasteners" },
        { id: "sub-fittings", label: "Fittings", slug: "fittings" },
        { id: "sub-cutting-tools", label: "Cutting Tools", slug: "cutting-tools" }
      ]
    },
    {
      id: "cat-silicon-sealants",
      label: "Silicon & Sealants",
      slug: "silicon-sealants",
      subcategories: [
        { id: "sub-general-sealants", label: "General Sealants", slug: "general-sealants" },
        { id: "sub-high-temp", label: "High Temp", slug: "high-temp" },
        { id: "sub-weatherproof", label: "Weatherproof", slug: "weatherproof" }
      ]
    },
    {
      id: "cat-more-products",
      label: "More Products",
      slug: "more-products",
      subcategories: [
        { id: "sub-safety", label: "Safety", slug: "safety" },
        { id: "sub-consumables", label: "Consumables", slug: "consumables" },
        { id: "sub-maintenance", label: "Maintenance", slug: "maintenance" }
      ]
    }
  ],
  products: [
    {
      id: "prd-acrylic-spray-paint",
      name: "Acrylic Spray Paint (400ml)",
      slug: "acrylic-spray-paint",
      categoryId: "cat-spray-paints",
      subcategoryId: "sub-general-use",
      description: "Fast-drying acrylic spray paint for smooth indoor and outdoor finishing.",
      features: ["Multiple colors available", "Quick dry formula", "Rust-resistant coating"],
      imageData: ""
    },
    {
      id: "prd-heat-resistant-spray",
      name: "Heat Resistant Spray",
      slug: "heat-resistant-spray",
      categoryId: "cat-spray-paints",
      subcategoryId: "sub-high-performance",
      description: "Designed for high-temperature metal surfaces and machinery parts.",
      features: ["Up to 600°C resistance", "Durable matte finish", "Industrial grade"],
      imageData: ""
    },
    {
      id: "prd-primer-spray",
      name: "Primer Spray Coating",
      slug: "primer-spray",
      categoryId: "cat-spray-paints",
      subcategoryId: "sub-general-use",
      description: "High-adhesion primer for preparing surfaces before topcoat application.",
      features: ["Improves paint grip", "Corrosion protection", "Easy to apply"],
      imageData: ""
    },
    {
      id: "prd-industrial-super-glue",
      name: "Industrial Super Glue",
      slug: "industrial-super-glue",
      categoryId: "cat-adhesives",
      subcategoryId: "sub-instant-bond",
      description: "Strong instant adhesive for metal, plastic, rubber, and wood.",
      features: ["Fast bonding", "High strength", "Workshop friendly"],
      imageData: ""
    },
    {
      id: "prd-epoxy-adhesive",
      name: "2-Part Epoxy Adhesive",
      slug: "epoxy-adhesive",
      categoryId: "cat-adhesives",
      subcategoryId: "sub-structural",
      description: "Heavy-duty epoxy for structural and repair applications.",
      features: ["Chemical resistance", "Gap filling", "Long-lasting bond"],
      imageData: ""
    },
    {
      id: "prd-construction-adhesive",
      name: "Construction Adhesive",
      slug: "construction-adhesive",
      categoryId: "cat-adhesives",
      subcategoryId: "sub-construction",
      description: "Reliable adhesive for concrete, wood panels, tiles, and more.",
      features: ["Strong grip", "Indoor/outdoor use", "Low shrinkage"],
      imageData: ""
    },
    {
      id: "prd-car-polish",
      name: "Premium Car Polish",
      slug: "car-polish",
      categoryId: "cat-automotive",
      subcategoryId: "sub-car-care",
      description: "Restores shine and protects paint from dust and weathering.",
      features: ["Gloss finish", "UV protection", "Easy wipe-off"],
      imageData: ""
    },
    {
      id: "prd-brake-cleaner",
      name: "Brake Cleaner Spray",
      slug: "brake-cleaner",
      categoryId: "cat-automotive",
      subcategoryId: "sub-cleaners",
      description: "Removes oil, grease, and brake dust quickly.",
      features: ["Residue-free", "Fast evaporation", "Workshop standard"],
      imageData: ""
    },
    {
      id: "prd-engine-degreaser",
      name: "Engine Degreaser",
      slug: "engine-degreaser",
      categoryId: "cat-automotive",
      subcategoryId: "sub-cleaners",
      description: "Deep cleaning solution for engine bay and machine parts.",
      features: ["Powerful action", "Safe on metals", "Professional quality"],
      imageData: ""
    },
    {
      id: "prd-galvanized-screws",
      name: "Galvanized Screws Set",
      slug: "galvanized-screws",
      categoryId: "cat-hardware",
      subcategoryId: "sub-fasteners",
      description: "Corrosion-resistant screws suitable for heavy-duty use.",
      features: ["Rust protection", "Mixed sizes", "Industrial pack"],
      imageData: ""
    },
    {
      id: "prd-heavy-duty-hinges",
      name: "Heavy Duty Hinges",
      slug: "heavy-duty-hinges",
      categoryId: "cat-hardware",
      subcategoryId: "sub-fittings",
      description: "Robust hinges for doors, gates, cabinets, and machinery panels.",
      features: ["High load support", "Durable steel", "Smooth movement"],
      imageData: ""
    },
    {
      id: "prd-angle-grinder-disc",
      name: "Angle Grinder Disc",
      slug: "angle-grinder-disc",
      categoryId: "cat-hardware",
      subcategoryId: "sub-cutting-tools",
      description: "Precision cutting disc for metal fabrication and repair jobs.",
      features: ["Stable cutting", "Long life", "Professional reliability"],
      imageData: ""
    },
    {
      id: "prd-neutral-silicon-sealant",
      name: "Neutral Silicon Sealant",
      slug: "neutral-silicon-sealant",
      categoryId: "cat-silicon-sealants",
      subcategoryId: "sub-general-sealants",
      description: "Versatile sealant for glass, aluminum, and general construction joints.",
      features: ["Weather resistant", "Flexible", "Low odor"],
      imageData: ""
    },
    {
      id: "prd-high-temp-rtv",
      name: "High Temp RTV Silicon",
      slug: "high-temp-rtv",
      categoryId: "cat-silicon-sealants",
      subcategoryId: "sub-high-temp",
      description: "Engine-grade RTV for sealing high-temperature components.",
      features: ["Heat durable", "Oil resistant", "Reliable gasket support"],
      imageData: ""
    },
    {
      id: "prd-weatherproof-sealant",
      name: "Weatherproof Sealant",
      slug: "weatherproof-sealant",
      categoryId: "cat-silicon-sealants",
      subcategoryId: "sub-weatherproof",
      description: "Long-lasting sealant for exterior cracks and expansion joints.",
      features: ["UV stable", "Waterproof", "Excellent adhesion"],
      imageData: ""
    },
    {
      id: "prd-safety-gloves",
      name: "Safety Gloves",
      slug: "safety-gloves",
      categoryId: "cat-more-products",
      subcategoryId: "sub-safety",
      description: "Protective gloves for workshop, handling, and general safety tasks.",
      features: ["Comfortable fit", "Grip texture", "Durable material"],
      imageData: ""
    },
    {
      id: "prd-cutting-wheel-pack",
      name: "Cutting Wheel Pack",
      slug: "cutting-wheel-pack",
      categoryId: "cat-more-products",
      subcategoryId: "sub-consumables",
      description: "Bulk pack of high-performance cutting wheels for daily use.",
      features: ["Cost effective", "Consistent performance", "Suitable for metal cutting"],
      imageData: ""
    },
    {
      id: "prd-multi-purpose-lubricant",
      name: "Multi-Purpose Lubricant",
      slug: "multi-purpose-lubricant",
      categoryId: "cat-more-products",
      subcategoryId: "sub-maintenance",
      description: "Lubricates moving parts, prevents rust, and removes moisture.",
      features: ["Multi-surface", "Anti-rust", "Quick action"],
      imageData: ""
    }
  ]
};

function loadTopSealData() {
  try {
    const raw = localStorage.getItem(TOPSEAL_DATA_KEY);
    if (!raw) return structuredClone(TOPSEAL_DEFAULT_DATA);

    const parsed = JSON.parse(raw);
    const merged = { ...structuredClone(TOPSEAL_DEFAULT_DATA), ...parsed };

    const defaultCategories = structuredClone(TOPSEAL_DEFAULT_DATA.categories);
    const categoryBySlug = new Map((merged.categories || []).map((c) => [c.slug, c]));

    defaultCategories.forEach((defaultCat) => {
      if (!categoryBySlug.has(defaultCat.slug)) {
        (merged.categories ||= []).push(defaultCat);
      } else {
        const currentCat = categoryBySlug.get(defaultCat.slug);
        const currentSubBySlug = new Map((currentCat.subcategories || []).map((s) => [s.slug, s]));
        defaultCat.subcategories.forEach((defaultSub) => {
          if (!currentSubBySlug.has(defaultSub.slug)) {
            (currentCat.subcategories ||= []).push(defaultSub);
          }
        });
      }
    });

    if (!Array.isArray(merged.products) || merged.products.length === 0) {
      merged.products = structuredClone(TOPSEAL_DEFAULT_DATA.products);
    }

    merged.products = merged.products.map((product) => ({
      ...product,
      price: product.price || "Ask Price",
      stock: product.stock || "In Stock"
    }));

    if (!Array.isArray(merged.homeSlides)) merged.homeSlides = [];
    return merged;
  } catch {
    return structuredClone(TOPSEAL_DEFAULT_DATA);
  }
}
