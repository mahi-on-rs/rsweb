const TOPSEAL_DATA_KEY = "topseal_admin_data";

const TOPSEAL_DEFAULT_DATA = {
  settings: {
    brandName: "TOP SEAL",
    whatsappNumber: "8801894527991",
    primaryColor: "#1c4e80",
    heroEyebrow: "Trusted Industrial Supply Partner",
    heroTitle: "Industrial Supplies Built for Reliable Work",
    heroSubtitle: "From spray paints to sealants and hardware, source every category from one dependable supplier.",
    heroPrimaryCtaLabel: "Browse Categories",
    heroSecondaryCtaLabel: "Order on WhatsApp",
    heroBackgroundImage: "",
    brandLogoImage: "",
    faviconImage: "",
    entryPopupEnabled: false,
    entryPopupImage: "",
    entryPopupLink: "",
    entryPopupStartAt: "",
    entryPopupEndAt: "",
    broadcastEnabled: false,
    broadcastText: "",
    broadcastFlow: true,
    broadcastSpeedSeconds: 22,
    secondaryColor: "#16324f",
    backgroundColor: "#f6f9fc",
    surfaceColor: "#ffffff",
    textColor: "#1f2933",
    slideIntervalMs: 3200,
    facebookUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    mapLink: "",
    businessHours: "Saturday - Thursday: 9:00 AM - 8:00 PM\nFriday: Limited Support",
    contactAddress: "Dhaka, Bangladesh",
    sideAds: []
  },
  homeDisplayItems: [],
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

const IS_LOCAL_HOST = window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1";
const TOPSEAL_API_BASE = window.TOPSEAL_API_BASE || (IS_LOCAL_HOST ? "" : "https://api.vortexnodes.xyz");
const LOCAL_ONLY_MODE = !TOPSEAL_API_BASE;

function mergeWithDefaults(payload) {
  const merged = { ...structuredClone(TOPSEAL_DEFAULT_DATA), ...(payload || {}) };
  merged.settings = {
    ...structuredClone(TOPSEAL_DEFAULT_DATA.settings),
    ...((payload && payload.settings) || {})
  };

  if (!Array.isArray(merged.settings.sideAds)) merged.settings.sideAds = [];
  merged.settings.sideAds = merged.settings.sideAds.map((item, index) => ({
    id: item?.id || `side-ad-${index + 1}`,
    side: item?.side === "right" ? "right" : "left",
    imageData: item?.imageData || "",
    link: item?.link || ""
  })).filter((item) => item.imageData);

  if (!Array.isArray(merged.categories)) {
    merged.categories = structuredClone(TOPSEAL_DEFAULT_DATA.categories);
  }

  if (!Array.isArray(merged.products) || merged.products.length === 0) {
    merged.products = structuredClone(TOPSEAL_DEFAULT_DATA.products);
  }

  merged.products = merged.products.map((product) => ({
    ...product,
    price: product.price || "Ask Price",
    stock: product.stock || "In Stock",
    badges: Array.isArray(product.badges) ? product.badges : [],
    specs: Array.isArray(product.specs) ? product.specs.filter((item) => item?.label && item?.value) : [],
    trustPoints: Array.isArray(product.trustPoints) ? product.trustPoints.filter(Boolean) : [],
    featuredOnHome: !!product.featuredOnHome
  }));

  if (!Array.isArray(merged.homeSlides)) merged.homeSlides = [];
  if (!Array.isArray(merged.homeDisplayItems)) merged.homeDisplayItems = [];
  merged.homeDisplayItems = merged.homeDisplayItems.map((item, index) => ({
    id: item?.id || `display-${index + 1}`,
    title: item?.title || "",
    description: item?.description || "",
    imageData: item?.imageData || ""
  }));
  return merged;
}



function optimizeImageSource(src, options = {}) {
  if (!src || typeof src !== "string") return src;
  if (src.startsWith("data:")) return src;

  const {
    width = 1200,
    quality = "auto",
    format = "auto",
    fit = "limit"
  } = options;

  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src;
  }

  const transforms = `f_${format},q_${quality},c_${fit},w_${width}`;
  return src.replace("/upload/", `/upload/${transforms}/`);
}

function buildImageVariantSet(src) {
  return {
    small: optimizeImageSource(src, { width: 420 }),
    medium: optimizeImageSource(src, { width: 820 }),
    large: optimizeImageSource(src, { width: 1280 })
  };
}

function applyStoreTheme(settings = {}) {
  const root = document.documentElement;
  root.style.setProperty("--primary", settings.primaryColor || TOPSEAL_DEFAULT_DATA.settings.primaryColor);
  root.style.setProperty("--secondary", settings.secondaryColor || TOPSEAL_DEFAULT_DATA.settings.secondaryColor);
  root.style.setProperty("--bg", settings.backgroundColor || TOPSEAL_DEFAULT_DATA.settings.backgroundColor);
  root.style.setProperty("--surface", settings.surfaceColor || TOPSEAL_DEFAULT_DATA.settings.surfaceColor);
  root.style.setProperty("--white", settings.surfaceColor || TOPSEAL_DEFAULT_DATA.settings.surfaceColor);
  root.style.setProperty("--text", settings.textColor || TOPSEAL_DEFAULT_DATA.settings.textColor);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${TOPSEAL_API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `API error ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return null;
}

async function loadTopSealData() {
  if (LOCAL_ONLY_MODE) {
    try {
      const raw = localStorage.getItem(TOPSEAL_DATA_KEY);
      if (!raw) return structuredClone(TOPSEAL_DEFAULT_DATA);
      return mergeWithDefaults(JSON.parse(raw));
    } catch {
      return structuredClone(TOPSEAL_DEFAULT_DATA);
    }
  }

  try {
    const payload = await apiRequest("/state", { method: "GET" });
    return mergeWithDefaults(payload);
  } catch {
    try {
      const raw = localStorage.getItem(TOPSEAL_DATA_KEY);
      if (!raw) return structuredClone(TOPSEAL_DEFAULT_DATA);
      return mergeWithDefaults(JSON.parse(raw));
    } catch {
      return structuredClone(TOPSEAL_DEFAULT_DATA);
    }
  }
}

async function saveTopSealData(data) {
  if (LOCAL_ONLY_MODE) {
    localStorage.setItem(TOPSEAL_DATA_KEY, JSON.stringify(data));
    return;
  }

  try {
    await apiRequest("/state", {
      method: "PUT",
      body: JSON.stringify(data)
    });
  } catch {
    localStorage.setItem(TOPSEAL_DATA_KEY, JSON.stringify(data));
  }
}

async function loginAdmin(username, password) {
  if (LOCAL_ONLY_MODE) {
    if (username === "admin" && password === "topseal123") return { ok: true };
    throw new Error("Invalid credentials");
  }

  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

async function logoutAdmin() {
  if (LOCAL_ONLY_MODE) return { ok: true };
  return apiRequest("/auth/logout", { method: "POST" });
}

async function getAdminSession() {
  if (LOCAL_ONLY_MODE) return sessionStorage.getItem("topseal_admin_auth") === "ok";
  try {
    const result = await apiRequest("/auth/me", { method: "GET" });
    return !!result?.ok;
  } catch {
    return false;
  }
}

async function uploadImageToStorage(file) {
  if (LOCAL_ONLY_MODE) {
    throw new Error("Upload API not available in local-only mode");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${TOPSEAL_API_BASE}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || "Upload failed");
  }

  const payload = await response.json();
  return payload.url;
}


function getDisplayBadges(product) {
  const badgeMap = {
    "new": "New",
    "hot": "Hot",
    "best-seller": "Best Seller"
  };
  const badges = (product.badges || []).map((key) => badgeMap[key]).filter(Boolean);
  const stockText = (product.stock || "").toLowerCase();
  if (stockText && !stockText.includes("out") && !stockText.includes("unavailable")) {
    badges.push("In Stock");
  }
  return badges;
}

function scoreProductSearch(product, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return 0;

  const name = (product.name || "").toLowerCase();
  const slug = (product.slug || "").toLowerCase();
  const text = `${name} ${slug} ${(product.description || "").toLowerCase()}`;
  const tokens = q.split(/\s+/).filter(Boolean);

  let score = 0;
  if (name === q || slug === q) score += 300;
  if (name.startsWith(q)) score += 160;
  if (name.includes(q)) score += 120;
  if (slug.includes(q)) score += 100;

  tokens.forEach((token) => {
    if (name.includes(token)) score += 30;
    if (slug.includes(token)) score += 24;
    if (text.includes(token)) score += 12;
  });

  const compactQ = q.replace(/\s+/g, "");
  const compactName = name.replace(/\s+/g, "");
  if (compactQ && compactName.includes(compactQ)) score += 40;

  return score;
}

function findProductsByRelevance(products, query, limit = 8) {
  return (products || [])
    .map((product) => ({ product, score: scoreProductSearch(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

function setupTopNavSearch(data, options = {}) {
  const form = document.getElementById(options.formId || "top-nav-search");
  const input = document.getElementById(options.inputId || "top-nav-search-input");
  if (!form || !input) return;

  form.classList.add("search-ready");

  const results = document.createElement("div");
  results.className = "search-suggestions hidden";
  results.id = "search-suggestions";
  results.setAttribute("role", "listbox");
  form.appendChild(results);

  const searchProducts = Array.isArray(data?.products) ? data.products : [];

  function renderList(query) {
    const q = (query || "").trim();
    if (!q) {
      results.classList.add("hidden");
      results.innerHTML = "";
      return;
    }

    const matches = findProductsByRelevance(searchProducts, q, 8);
    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No close products found for “${q}”.</p>`;
      results.classList.remove("hidden");
      return;
    }

    results.innerHTML = "";
    matches.forEach((product) => {
      const item = document.createElement("a");
      item.className = "search-suggestion-item";
      item.href = `product.html?item=${product.slug}`;
      item.setAttribute("role", "option");

      const imageHtml = product.imageData
        ? `<img class="search-suggestion-image" src="${optimizeImageSource(product.imageData, { width: 120 })}" alt="${product.name}" loading="lazy" decoding="async" />`
        : `<div class="search-suggestion-placeholder">No Image</div>`;
      const badges = getDisplayBadges(product).map((badge) => `<span class="search-badge">${badge}</span>`).join("");
      item.innerHTML = `
        ${imageHtml}
        <span class="search-suggestion-meta">
          <span class="search-suggestion-name">${product.name}</span>
          <span class="search-suggestion-price">৳ ${product.price || "Ask Price"}</span>
          <span class="search-suggestion-badges">${badges}</span>
        </span>
      `;

      results.appendChild(item);
    });
    results.classList.remove("hidden");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = (input.value || "").trim();
    if (!q) return;

    const matches = findProductsByRelevance(searchProducts, q, 8);
    renderList(q);

    if (!matches.length) return;
    const exact = matches.find((product) => {
      const name = (product.name || "").toLowerCase();
      const slug = (product.slug || "").toLowerCase();
      const query = q.toLowerCase();
      return name === query || slug === query || slug === query.replace(/\s+/g, "-");
    });

    if (exact) {
      window.location.href = `product.html?item=${exact.slug}`;
    }
  });

  input.addEventListener("input", () => renderList(input.value));
  input.addEventListener("focus", () => renderList(input.value));

  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) {
      results.classList.add("hidden");
    }
  });
}

function setupPageLoadingScreen(message = "Loading store…") {
  if (document.getElementById("page-loading-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "page-loading-overlay";
  overlay.className = "page-loading-overlay";
  overlay.innerHTML = `<div class="page-loading-card"><div class="page-loading-spinner" aria-hidden="true"></div><p>${message}</p></div>`;
  document.body.appendChild(overlay);
}

function hidePageLoadingScreen() {
  const overlay = document.getElementById("page-loading-overlay");
  if (!overlay) return;
  overlay.classList.add("is-hidden");
  setTimeout(() => overlay.remove(), 260);
}

function setupSubcategoryDropdown(data, menuId = "subcategory-dropdown-menu") {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  menu.innerHTML = "";
  (data.categories || []).forEach((cat) => {
    (cat.subcategories || []).forEach((sub) => {
      const link = document.createElement("a");
      link.href = `category.html?cat=${cat.slug}&sub=${sub.slug}`;
      link.textContent = `${cat.label} · ${sub.label}`;
      link.setAttribute("role", "menuitem");
      menu.appendChild(link);
    });
  });
}


function setupSideAds(settings = {}) {
  const existing = document.querySelectorAll('.side-ads-column');
  existing.forEach((node) => node.remove());

  const ads = Array.isArray(settings.sideAds) ? settings.sideAds.filter((item) => item?.imageData) : [];
  if (!ads.length) return;

  const leftItems = ads.filter((item) => item.side !== 'right');
  const rightItems = ads.filter((item) => item.side === 'right');

  function buildColumn(side, items) {
    if (!items.length) return;
    const column = document.createElement('aside');
    column.className = `side-ads-column ${side}`;
    column.setAttribute('aria-label', `${side} side ads`);

    items.forEach((item) => {
      const wrapper = document.createElement(item.link ? 'a' : 'div');
      wrapper.className = 'side-ad-item';
      if (item.link) {
        wrapper.href = item.link;
        wrapper.target = '_blank';
        wrapper.rel = 'noopener noreferrer';
      }

      const img = document.createElement('img');
      img.className = 'side-ad-image';
      img.src = item.imageData;
      img.alt = 'Promotional side advertisement';
      img.loading = 'lazy';
      img.decoding = 'async';
      wrapper.appendChild(img);

      column.appendChild(wrapper);
    });

    document.body.appendChild(column);
  }

  buildColumn('left', leftItems);
  buildColumn('right', rightItems);
}

function setupBroadcastBar(settings = {}) {
  const bar = document.getElementById("broadcast-bar");
  const textEl = document.getElementById("broadcast-text");
  if (!bar || !textEl) return;

  const enabled = !!settings.broadcastEnabled && !!(settings.broadcastText || "").trim();
  if (!enabled) {
    bar.classList.add("hidden");
    return;
  }

  bar.classList.remove("hidden");
  textEl.textContent = settings.broadcastText;
  const flowEnabled = settings.broadcastFlow !== false;
  const speed = Math.max(8, Number(settings.broadcastSpeedSeconds) || 22);
  bar.classList.toggle("no-flow", !flowEnabled);
  bar.style.setProperty("--broadcast-speed", `${speed}s`);
}

function setupEntryPopup(settings = {}) {
  return new Promise((resolve) => {
    const enabled = !!settings.entryPopupEnabled;
    const image = settings.entryPopupImage || "";
    if (!enabled || !image) {
      resolve();
      return;
    }

    const sessionKey = "topseal_entry_popup_seen";
    if (sessionStorage.getItem(sessionKey) === "1") {
      resolve();
      return;
    }

    const now = Date.now();
    const starts = settings.entryPopupStartAt ? Date.parse(settings.entryPopupStartAt) : NaN;
    const ends = settings.entryPopupEndAt ? Date.parse(settings.entryPopupEndAt) : NaN;
    if (!Number.isNaN(starts) && now < starts) {
      resolve();
      return;
    }
    if (!Number.isNaN(ends) && now > ends) {
      resolve();
      return;
    }

    sessionStorage.setItem(sessionKey, "1");

    const preloader = new Image();
    preloader.onload = () => {
      const modal = document.createElement("div");
      modal.className = "entry-popup-overlay";

      const shell = document.createElement("div");
      shell.className = "entry-popup-shell";

      const close = document.createElement("button");
      close.type = "button";
      close.className = "entry-popup-close";
      close.setAttribute("aria-label", "Close popup");
      close.textContent = "×";

      const card = document.createElement(settings.entryPopupLink ? "a" : "div");
      card.className = "entry-popup-card";
      if (settings.entryPopupLink) {
        card.href = settings.entryPopupLink;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
      }

      const img = document.createElement("img");
      img.src = image;
      img.alt = "Event notification";
      img.className = "entry-popup-image";
      card.appendChild(img);

      const closePopup = () => modal.remove();
      close.addEventListener("click", closePopup);
      card.addEventListener("click", () => {
        setTimeout(closePopup, 0);
      });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closePopup();
      });

      shell.append(close, card);
      modal.appendChild(shell);
      document.body.appendChild(modal);
      resolve();
    };

    preloader.onerror = () => resolve();
    preloader.src = image;
  });
}


function appendSubcategoriesIntoCategoryMenu(data, categoryMenuId = "category-dropdown-menu") {
  const menu = document.getElementById(categoryMenuId);
  if (!menu) return;

  const divider = document.createElement("span");
  divider.className = "nav-menu-divider";
  divider.textContent = "Sub-Categories";
  menu.appendChild(divider);

  (data.categories || []).forEach((cat) => {
    (cat.subcategories || []).forEach((sub) => {
      const link = document.createElement("a");
      link.href = `category.html?cat=${cat.slug}&sub=${sub.slug}`;
      link.textContent = `- ${sub.label}`;
      link.classList.add("nav-subcategory-item");
      link.setAttribute("role", "menuitem");
      menu.appendChild(link);
    });
  });
}
