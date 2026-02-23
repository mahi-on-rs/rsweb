const AUTH_KEY = "topseal_admin_auth";
const CROPPED_IMAGE_SIZE = 800;
async function loadData() {
  return loadTopSealData();
}
async function saveData(data) {
  await saveTopSealData(data);
}
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}
function setNotice(el, message, type = "success") {
  if (!el) return;
  el.textContent = message;
  el.className = `notice ${type}`;
}
function applyThemeSettings(settings) {
  document.documentElement.style.setProperty("--primary", settings.primaryColor);
  document.documentElement.style.setProperty("--secondary", settings.secondaryColor || "#16324f");
  document.documentElement.style.setProperty("--bg", settings.backgroundColor || "#f4f7fb");
  document.documentElement.style.setProperty("--surface", settings.surfaceColor || "#ffffff");
  document.documentElement.style.setProperty("--white", settings.surfaceColor || "#ffffff");
  document.documentElement.style.setProperty("--text", settings.textColor || "#1f2933");
}
function renderCategoryOptions(data, selectEl, includeBlank = true) {
  if (!selectEl) return;
  const current = selectEl.value;
  selectEl.innerHTML = includeBlank ? '<option value="">Select category</option>' : "";
  data.categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.label;
    selectEl.appendChild(option);
  });
  selectEl.value = current;
}
function renderSubcategoryOptions(data, categoryId, selectEl, includeBlank = true) {
  if (!selectEl) return;
  const current = selectEl.value;
  selectEl.innerHTML = includeBlank ? '<option value="">Select sub-category</option>' : "";
  const category = data.categories.find((cat) => cat.id === categoryId);
  if (!category) return;
  category.subcategories.forEach((sub) => {
    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = sub.label;
    selectEl.appendChild(option);
  });
  selectEl.value = current;
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for crop."));
    img.src = src;
  });
}
async function autoCropImageToSquare(file) {
  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(rawDataUrl);
  const sourceSize = Math.min(img.width, img.height);
  const sourceX = Math.floor((img.width - sourceSize) / 2);
  const sourceY = Math.floor((img.height - sourceSize) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = CROPPED_IMAGE_SIZE;
  canvas.height = CROPPED_IMAGE_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, CROPPED_IMAGE_SIZE, CROPPED_IMAGE_SIZE);
  return canvas.toDataURL("image/jpeg", 0.9);
}
async function bootstrapLoginPage() {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;
  try {
    const data = await loadData();
    const brand = data.settings?.brandName || "TOP SEAL";
    document.title = `${brand} Admin Login`;
    const heading = document.querySelector(".login-card h1");
    if (heading) heading.textContent = `${brand} Admin`;
  } catch {
    // ignore branding load issues on login
  }
  if (await getAdminSession()) {
    sessionStorage.setItem(AUTH_KEY, "ok");
    window.location.href = "admin-dashboard.html";
    return;
  }
  const notice = document.getElementById("login-notice");
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    try {
      await loginAdmin(username, password);
      sessionStorage.setItem(AUTH_KEY, "ok");
      window.location.href = "admin-dashboard.html";
    } catch {
      setNotice(notice, "Invalid username or password.", "error");
    }
  });
}
async function bootstrapDashboardPage() {
  const dashboardRoot = document.getElementById("admin-dashboard");
  if (!dashboardRoot) return;
  const isLoggedIn = await getAdminSession();
  if (!isLoggedIn) {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = "admin-login.html";
    return;
  }
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", async () => {
    try {
      await logoutAdmin();
    } finally {
      sessionStorage.removeItem(AUTH_KEY);
      window.location.href = "admin-login.html";
    }
  });
  const data = await loadData();
  applyThemeSettings(data.settings);
  const adminTitleEl = document.getElementById("admin-panel-title");
  document.title = `${data.settings?.brandName || "TOP SEAL"} Admin Panel`;
  if (adminTitleEl) adminTitleEl.textContent = `${data.settings?.brandName || "TOP SEAL"} Admin Panel`;
  const settingsForm = document.getElementById("settings-form");
  const settingsNotice = document.getElementById("settings-notice");
  const brandInput = document.getElementById("brand-name");
  const whatsappInput = document.getElementById("whatsapp-number");
  const colorInput = document.getElementById("primary-color");
  const secondaryColorInput = document.getElementById("secondary-color");
  const backgroundColorInput = document.getElementById("background-color");
  const surfaceColorInput = document.getElementById("surface-color");
  const textColorInput = document.getElementById("text-color");
  const slideIntervalInput = document.getElementById("slide-interval");
  const businessHoursInput = document.getElementById("business-hours");
  const contactAddressInput = document.getElementById("contact-address");
  const mapLinkInput = document.getElementById("map-link");
  const facebookUrlInput = document.getElementById("facebook-url");
  const instagramUrlInput = document.getElementById("instagram-url");
  const youtubeUrlInput = document.getElementById("youtube-url");
  const heroEyebrowInput = document.getElementById("hero-eyebrow");
  const heroTitleInput = document.getElementById("hero-title");
  const heroSubtitleInput = document.getElementById("hero-subtitle");
  const heroPrimaryCtaInput = document.getElementById("hero-primary-cta");
  const heroSecondaryCtaInput = document.getElementById("hero-secondary-cta");
  const heroBgFileInput = document.getElementById("hero-bg-file");
  const heroBgPreview = document.getElementById("hero-bg-preview");
  const brandLogoFileInput = document.getElementById("brand-logo-file");
  const brandLogoPreview = document.getElementById("brand-logo-preview");
  const faviconFileInput = document.getElementById("favicon-file");
  const faviconPreview = document.getElementById("favicon-preview");
  const entryPopupEnabledInput = document.getElementById("entry-popup-enabled");
  const entryPopupLinkInput = document.getElementById("entry-popup-link");
  const entryPopupStartInput = document.getElementById("entry-popup-start");
  const entryPopupEndInput = document.getElementById("entry-popup-end");
  const entryPopupFileInput = document.getElementById("entry-popup-file");
  const entryPopupPreview = document.getElementById("entry-popup-preview");
  const broadcastEnabledInput = document.getElementById("broadcast-enabled");
  const broadcastFlowInput = document.getElementById("broadcast-flow");
  const glowThreadsEnabledInput = document.getElementById("glow-threads-enabled");
  const floatingWhatsappEnabledInput = document.getElementById("floating-whatsapp-enabled");
  const broadcastTextInput = document.getElementById("broadcast-text");
  const broadcastSpeedInput = document.getElementById("broadcast-speed");
  const categoriesList = document.getElementById("categories-list");
  const subcategoriesList = document.getElementById("subcategories-list");
  const categoryForm = document.getElementById("category-form");
  const categoryNameInput = document.getElementById("category-name");
  const categoryNotice = document.getElementById("category-notice");
  const subForm = document.getElementById("subcategory-form");
  const subCategorySelect = document.getElementById("subcategory-category");
  const subNameInput = document.getElementById("subcategory-name");
  const subNotice = document.getElementById("subcategory-notice");
  const homeSlideForm = document.getElementById("home-slide-form");
  const homeSlideFile = document.getElementById("home-slide-file");
  const homeSlideLink = document.getElementById("home-slide-link");
  const homeSlideNotice = document.getElementById("home-slide-notice");
  const homeSlidesList = document.getElementById("home-slides-list");
  const displayItemForm = document.getElementById("display-item-form");
  const displayItemTitleInput = document.getElementById("display-item-title");
  const displayItemDescriptionInput = document.getElementById("display-item-description");
  const displayItemLinkInput = document.getElementById("display-item-link");
  const displayItemFileInput = document.getElementById("display-item-file");
  const displayItemImageDataInput = document.getElementById("display-item-image-data");
  const displayItemPreview = document.getElementById("display-item-preview");
  const displayItemNotice = document.getElementById("display-item-notice");
  const displayItemsList = document.getElementById("display-items-list");
  const sideAdForm = document.getElementById("side-ad-form");
  const sideAdSideInput = document.getElementById("side-ad-side");
  const sideAdLinkInput = document.getElementById("side-ad-link");
  const sideAdFileInput = document.getElementById("side-ad-file");
  const sideAdImageDataInput = document.getElementById("side-ad-image-data");
  const sideAdPreview = document.getElementById("side-ad-preview");
  const sideAdNotice = document.getElementById("side-ad-notice");
  const sideAdsList = document.getElementById("side-ads-list");
  const productForm = document.getElementById("product-form");
  const productNotice = document.getElementById("product-notice");
  const productIdInput = document.getElementById("product-id");
  const productNameInput = document.getElementById("product-name");
  const productSlugInput = document.getElementById("product-slug");
  const productCategorySelect = document.getElementById("product-category");
  const productSubcategorySelect = document.getElementById("product-subcategory");
  const productDescriptionInput = document.getElementById("product-description");
  const productImageFileInput = document.getElementById("product-image-file");
  const productImageDataInput = document.getElementById("product-image-data");
  const productImagePreview = document.getElementById("product-image-preview");
  const productPriceInput = document.getElementById("product-price");
  const productStockInput = document.getElementById("product-stock");
  const productFeaturesInput = document.getElementById("product-features");
  const productSpecsInput = document.getElementById("product-specs");
  const productTrustPointsInput = document.getElementById("product-trust-points");
  const badgeNewInput = document.getElementById("badge-new");
  const badgeHotInput = document.getElementById("badge-hot");
  const badgeBestSellerInput = document.getElementById("badge-best-seller");
  const productsBody = document.getElementById("products-body");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const analyticsKpiGrid = document.getElementById("analytics-kpi-grid");
  const analyticsTopProducts = document.getElementById("analytics-top-products");
  const analyticsTopSearches = document.getElementById("analytics-top-searches");
  function setProductPreview(imageData) {
    if (!imageData) {
      productImagePreview.removeAttribute("src");
      productImagePreview.classList.add("hidden");
      return;
    }
    productImagePreview.src = imageData;
    productImagePreview.classList.remove("hidden");
  }
  function setHeroPreview(imageData) {
    if (!imageData) {
      heroBgPreview.removeAttribute("src");
      heroBgPreview.classList.add("hidden");
      return;
    }
    heroBgPreview.src = imageData;
    heroBgPreview.classList.remove("hidden");
  }
  function setSimplePreview(el, imageData) {
    if (!el) return;
    if (!imageData) {
      el.removeAttribute("src");
      el.classList.add("hidden");
      return;
    }
    el.src = imageData;
    el.classList.remove("hidden");
  }
  function setDisplayPreview(imageData) {
    setSimplePreview(displayItemPreview, imageData);
  }
  function setSideAdPreview(imageData) {
    setSimplePreview(sideAdPreview, imageData);
  }
  function getSelectedBadges() {
    return [
      badgeNewInput.checked ? "new" : "",
      badgeHotInput.checked ? "hot" : "",
      badgeBestSellerInput.checked ? "best-seller" : ""
    ].filter(Boolean);
  }
  function setSelectedBadges(badges = []) {
    const selected = new Set(badges);
    badgeNewInput.checked = selected.has("new");
    badgeHotInput.checked = selected.has("hot");
    badgeBestSellerInput.checked = selected.has("best-seller");
  }
  heroBgFileInput.addEventListener("change", async () => {
    const file = heroBgFileInput.files?.[0];
    if (!file) return;
    try {
      let finalImage = "";
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = await autoCropImageToSquare(file);
      }
      data.settings.heroBackgroundImage = finalImage;
      setHeroPreview(finalImage);
      setNotice(settingsNotice, "Hero background uploaded. Save settings to publish.");
    } catch (error) {
      setNotice(settingsNotice, error.message, "error");
    }
  });
  brandLogoFileInput.addEventListener("change", async () => {
    const file = brandLogoFileInput.files?.[0];
    if (!file) return;
    try {
      let finalImage = "";
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = await autoCropImageToSquare(file);
      }
      data.settings.brandLogoImage = finalImage;
      setSimplePreview(brandLogoPreview, finalImage);
      setNotice(settingsNotice, "Brand logo uploaded. Save settings to publish.");
    } catch (error) {
      setNotice(settingsNotice, error.message, "error");
    }
  });
  faviconFileInput.addEventListener("change", async () => {
    const file = faviconFileInput.files?.[0];
    if (!file) return;
    try {
      let finalImage = "";
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = await autoCropImageToSquare(file);
      }
      data.settings.faviconImage = finalImage;
      setSimplePreview(faviconPreview, finalImage);
      setNotice(settingsNotice, "Favicon uploaded. Save settings to publish.");
    } catch (error) {
      setNotice(settingsNotice, error.message, "error");
    }
  });
  entryPopupFileInput.addEventListener("change", async () => {
    const file = entryPopupFileInput.files?.[0];
    if (!file) return;
    try {
      let finalImage = "";
      const isGif = file.type === "image/gif" || /\.gif$/i.test(file.name || "");
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = isGif ? await readFileAsDataUrl(file) : await autoCropImageToSquare(file);
      }
      data.settings.entryPopupImage = finalImage;
      setSimplePreview(entryPopupPreview, finalImage);
      setNotice(settingsNotice, isGif ? "GIF popup uploaded. Save settings to publish." : "Entry popup image uploaded. Save settings to publish.");
    } catch (error) {
      setNotice(settingsNotice, error.message, "error");
    }
  });
  displayItemFileInput?.addEventListener("change", async () => {
    const file = displayItemFileInput.files?.[0];
    if (!file) return;
    try {
      let finalImage = "";
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = await readFileAsDataUrl(file);
      }
      displayItemImageDataInput.value = finalImage;
      setDisplayPreview(finalImage);
      setNotice(displayItemNotice, "Display image uploaded.");
    } catch (error) {
      setNotice(displayItemNotice, error.message, "error");
    }
  });
  sideAdFileInput?.addEventListener("change", async () => {
    const file = sideAdFileInput.files?.[0];
    if (!file) return;
    try {
      let finalImage = "";
      const isGif = file.type === "image/gif" || /\.gif$/i.test(file.name || "");
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = isGif ? await readFileAsDataUrl(file) : await autoCropImageToSquare(file);
      }
      sideAdImageDataInput.value = finalImage;
      setSideAdPreview(finalImage);
      setNotice(sideAdNotice, "Side ad image uploaded.");
    } catch (error) {
      setNotice(sideAdNotice, error.message, "error");
    }
  });
  productImageFileInput.addEventListener("change", async () => {
    const file = productImageFileInput.files?.[0];
    if (!file) return;
    try {
      let finalImage = "";
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = await autoCropImageToSquare(file);
      }
      productImageDataInput.value = finalImage;
      setProductPreview(finalImage);
      setNotice(productNotice, "Image uploaded.");
    } catch (error) {
      setNotice(productNotice, error.message, "error");
    }
  });
  function redrawCategoryList() {
    categoriesList.innerHTML = "";
    data.categories.forEach((cat) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${cat.label}</strong>`;
      const upBtn = document.createElement("button");
      upBtn.textContent = "↑";
      upBtn.className = "secondary icon-btn";
      upBtn.type = "button";
      upBtn.title = "Move up";
      upBtn.disabled = data.categories.indexOf(cat) === 0;
      upBtn.addEventListener("click", async () => {
        const index = data.categories.indexOf(cat);
        if (index <= 0) return;
        [data.categories[index - 1], data.categories[index]] = [data.categories[index], data.categories[index - 1]];
        await saveData(data);
        redrawAll();
        setNotice(categoryNotice, "Category order updated.");
      });
      const downBtn = document.createElement("button");
      downBtn.textContent = "↓";
      downBtn.className = "secondary icon-btn";
      downBtn.type = "button";
      downBtn.title = "Move down";
      downBtn.disabled = data.categories.indexOf(cat) === data.categories.length - 1;
      downBtn.addEventListener("click", async () => {
        const index = data.categories.indexOf(cat);
        if (index < 0 || index === data.categories.length - 1) return;
        [data.categories[index], data.categories[index + 1]] = [data.categories[index + 1], data.categories[index]];
        await saveData(data);
        redrawAll();
        setNotice(categoryNotice, "Category order updated.");
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "danger";
      deleteBtn.type = "button";
      deleteBtn.addEventListener("click", async () => {
        const subIds = new Set((cat.subcategories || []).map((sub) => sub.id));
        data.products = data.products.filter((product) => product.categoryId !== cat.id && !subIds.has(product.subcategoryId));
        data.categories = data.categories.filter((item) => item.id !== cat.id);
        await saveData(data);
        redrawAll();
        setNotice(categoryNotice, "Category deleted.");
      });
      const actionWrap = document.createElement("div");
      actionWrap.className = "inline-actions";
      actionWrap.append(upBtn, downBtn, deleteBtn);
      li.appendChild(actionWrap);
      categoriesList.appendChild(li);
    });
  }
  function redrawSubcategoryList() {
    subcategoriesList.innerHTML = "";
    data.categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${sub.label}</strong> <span class="muted">(${cat.label})</span>`;
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "danger";
        deleteBtn.type = "button";
        deleteBtn.addEventListener("click", async () => {
          data.products = data.products.filter((product) => product.subcategoryId !== sub.id);
          cat.subcategories = cat.subcategories.filter((item) => item.id !== sub.id);
          await saveData(data);
          redrawAll();
          setNotice(subNotice, "Sub-category deleted.");
        });
        const wrap = document.createElement("div");
        wrap.className = "inline-actions";
        wrap.appendChild(deleteBtn);
        li.appendChild(wrap);
        subcategoriesList.appendChild(li);
      });
    });
  }
  function redrawHomeSlides() {
    homeSlidesList.innerHTML = "";
    (data.homeSlides || []).forEach((slide, idx) => {
      const slideObj = typeof slide === "string" ? { imageData: slide, link: "" } : slide;
      const card = document.createElement("div");
      card.className = "slide-item";
      card.innerHTML = `<img class="slide-thumb" src="${slideObj.imageData}" alt="Slide ${idx + 1}" />${slideObj.link ? `<a class="small" href="${slideObj.link}" target="_blank" rel="noopener noreferrer">Open link</a>` : '<span class="small muted">No link</span>'}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "danger";
      btn.textContent = "Remove";
      btn.addEventListener("click", async () => {
        data.homeSlides.splice(idx, 1);
        await saveData(data);
        redrawHomeSlides();
      });
      card.appendChild(btn);
      homeSlidesList.appendChild(card);
    });
  }
  function redrawDisplayItems() {
    if (!displayItemsList) return;
    displayItemsList.innerHTML = "";
    (data.homeDisplayItems || []).forEach((item, idx) => {
      const card = document.createElement("article");
      card.className = "display-item-card";
      const thumb = item.imageData
        ? `<img class="slide-thumb" src="${item.imageData}" alt="${item.title || `Display item ${idx + 1}`}" />`
        : '<div class="slide-thumb display-thumb-placeholder">No image</div>';
      card.innerHTML = `${thumb}<div><strong>${item.title || "Untitled"}</strong><p class="small muted">${item.description || "No description"}</p><p class="small muted">${item.link || "No image link"}</p></div>`;
      const actions = document.createElement("div");
      actions.className = "inline-actions";
      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "secondary icon-btn";
      upBtn.textContent = "↑";
      upBtn.title = "Move up";
      upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", async () => {
        if (idx === 0) return;
        [data.homeDisplayItems[idx - 1], data.homeDisplayItems[idx]] = [data.homeDisplayItems[idx], data.homeDisplayItems[idx - 1]];
        await saveData(data);
        redrawDisplayItems();
      });
      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "secondary icon-btn";
      downBtn.textContent = "↓";
      downBtn.title = "Move down";
      downBtn.disabled = idx === data.homeDisplayItems.length - 1;
      downBtn.addEventListener("click", async () => {
        if (idx === data.homeDisplayItems.length - 1) return;
        [data.homeDisplayItems[idx], data.homeDisplayItems[idx + 1]] = [data.homeDisplayItems[idx + 1], data.homeDisplayItems[idx]];
        await saveData(data);
        redrawDisplayItems();
      });
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "danger";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", async () => {
        data.homeDisplayItems.splice(idx, 1);
        await saveData(data);
        redrawDisplayItems();
        setNotice(displayItemNotice, "Display item removed.");
      });
      actions.append(upBtn, downBtn, removeBtn);
      card.appendChild(actions);
      displayItemsList.appendChild(card);
    });
  }
  function redrawSideAds() {
    if (!sideAdsList) return;
    sideAdsList.innerHTML = "";
    const sideAds = data.settings.sideAds || [];
    sideAds.forEach((ad, idx) => {
      const card = document.createElement("article");
      card.className = "display-item-card";
      const sideLabel = ad.side === "right" ? "Right" : "Left";
      card.innerHTML = `<img class="slide-thumb" src="${ad.imageData}" alt="${sideLabel} side ad" /><div><strong>${sideLabel} side</strong><p class="small muted">${ad.link || "No click link"}</p></div>`;
      const actions = document.createElement("div");
      actions.className = "inline-actions";
      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "secondary icon-btn";
      upBtn.textContent = "↑";
      upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", async () => {
        if (idx === 0) return;
        [sideAds[idx - 1], sideAds[idx]] = [sideAds[idx], sideAds[idx - 1]];
        await saveData(data);
        redrawSideAds();
      });
      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "secondary icon-btn";
      downBtn.textContent = "↓";
      downBtn.disabled = idx === sideAds.length - 1;
      downBtn.addEventListener("click", async () => {
        if (idx === sideAds.length - 1) return;
        [sideAds[idx], sideAds[idx + 1]] = [sideAds[idx + 1], sideAds[idx]];
        await saveData(data);
        redrawSideAds();
      });
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "danger";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", async () => {
        sideAds.splice(idx, 1);
        await saveData(data);
        redrawSideAds();
        setNotice(sideAdNotice, "Side ad removed.");
      });
      actions.append(upBtn, downBtn, removeBtn);
      card.appendChild(actions);
      sideAdsList.appendChild(card);
    });
  }
  function redrawAnalyticsDashboard() {
    if (!analyticsKpiGrid) return;
    const analytics = getStoreAnalyticsSnapshot();
    const totalViews = Object.values(analytics.pageViews || {}).reduce((sum, n) => sum + Number(n || 0), 0);
    const whatsappClicks = Number(analytics.whatsappClicks || 0);
    const leadCaptures = Number(analytics.leadCaptures || 0);
    const conversion = totalViews ? ((leadCaptures + whatsappClicks) / totalViews) * 100 : 0;
    const cards = [
      { label: "Page Views", value: totalViews },
      { label: "WhatsApp Clicks", value: whatsappClicks },
      { label: "Leads Captured", value: leadCaptures },
      { label: "Action Rate", value: `${conversion.toFixed(1)}%` }
    ];
    analyticsKpiGrid.innerHTML = cards.map((card) => `<article class="analytics-kpi"><div class="label">${card.label}</div><div class="value">${card.value}</div></article>`).join("");
    const productEntries = Object.entries(analytics.productViews || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const productMax = productEntries[0]?.[1] || 1;
    analyticsTopProducts.innerHTML = productEntries.length
      ? productEntries.map(([slug, count]) => `<div class="analytics-row"><div><strong>${slug}</strong><div class="bar"><span style="width:${Math.max(8, (count / productMax) * 100)}%"></span></div></div><span>${count}</span></div>`).join("")
      : '<p class="small muted">No product analytics yet.</p>';
    const searchEntries = Object.entries(analytics.topSearches || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const searchMax = searchEntries[0]?.[1] || 1;
    analyticsTopSearches.innerHTML = searchEntries.length
      ? searchEntries.map(([term, count]) => `<div class="analytics-row"><div><strong>${term}</strong><div class="bar"><span style="width:${Math.max(8, (count / searchMax) * 100)}%"></span></div></div><span>${count}</span></div>`).join("")
      : '<p class="small muted">No search analytics yet.</p>';
  }
  function redrawProductsTable() {
    productsBody.innerHTML = "";
    data.products.forEach((product) => {
      const category = data.categories.find((cat) => cat.id === product.categoryId);
      const subcategory = category?.subcategories.find((sub) => sub.id === product.subcategoryId);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${category?.label || "-"} / ${subcategory?.label || "-"}</td>
        <td>${product.slug}</td>
        <td>${product.price || "Ask"}</td>
        <td>${product.stock || "In Stock"}</td>
        <td>${product.featuredOnHome ? "Yes" : "No"}</td>
        <td>${(product.badges || []).map((b) => b.replace(/-/g, " ")).join(", ") || "-"}</td>
        <td>${(product.specs || []).length || 0}</td>
        <td>${product.imageData ? `<img class="product-thumb" src="${product.imageData}" alt="thumb" />` : "No"}</td>
      `;
      const actionsTd = document.createElement("td");
      actionsTd.className = "inline-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "secondary";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productSlugInput.value = product.slug;
        productCategorySelect.value = product.categoryId;
        renderSubcategoryOptions(data, product.categoryId, productSubcategorySelect, true);
        productSubcategorySelect.value = product.subcategoryId;
        productDescriptionInput.value = product.description;
        productImageDataInput.value = product.imageData || "";
        productImageFileInput.value = "";
        setProductPreview(product.imageData || "");
        productPriceInput.value = product.price || "";
        productStockInput.value = product.stock || "";
        productFeaturesInput.value = (product.features || []).join(", ");
        productSpecsInput.value = (product.specs || []).map((spec) => `${spec.label}: ${spec.value}`).join("\n");
        productTrustPointsInput.value = (product.trustPoints || []).join("\n");
        setSelectedBadges(product.badges || []);
      });
      const featureBtn = document.createElement("button");
      featureBtn.type = "button";
      featureBtn.className = product.featuredOnHome ? "secondary" : "";
      featureBtn.textContent = product.featuredOnHome ? "Unfeature" : "Feature";
      featureBtn.addEventListener("click", async () => {
        product.featuredOnHome = !product.featuredOnHome;
        await saveData(data);
        redrawProductsTable();
        setNotice(productNotice, product.featuredOnHome ? "Product featured on home." : "Product removed from featured list.");
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", async () => {
        data.products = data.products.filter((item) => item.id !== product.id);
        await saveData(data);
        redrawProductsTable();
        setNotice(productNotice, "Product deleted.");
      });
      actionsTd.append(editBtn, featureBtn, deleteBtn);
      row.appendChild(actionsTd);
      productsBody.appendChild(row);
    });
  }
  function redrawAll() {
    redrawCategoryList();
    redrawSubcategoryList();
    renderCategoryOptions(data, subCategorySelect, true);
    renderCategoryOptions(data, productCategorySelect, true);
    renderSubcategoryOptions(data, productCategorySelect.value, productSubcategorySelect, true);
    redrawHomeSlides();
    redrawDisplayItems();
    redrawSideAds();
    redrawProductsTable();
    redrawAnalyticsDashboard();
  }
  brandInput.value = data.settings.brandName;
  whatsappInput.value = data.settings.whatsappNumber;
  colorInput.value = data.settings.primaryColor;
  secondaryColorInput.value = data.settings.secondaryColor || "#16324f";
  backgroundColorInput.value = data.settings.backgroundColor || "#f6f9fc";
  surfaceColorInput.value = data.settings.surfaceColor || "#ffffff";
  textColorInput.value = data.settings.textColor || "#1f2933";
  slideIntervalInput.value = ((Number(data.settings.slideIntervalMs) || 3200) / 1000).toFixed(1);
  businessHoursInput.value = data.settings.businessHours || "";
  contactAddressInput.value = data.settings.contactAddress || "";
  mapLinkInput.value = data.settings.mapLink || "";
  facebookUrlInput.value = data.settings.facebookUrl || "";
  instagramUrlInput.value = data.settings.instagramUrl || "";
  youtubeUrlInput.value = data.settings.youtubeUrl || "";
  heroEyebrowInput.value = data.settings.heroEyebrow || "";
  heroTitleInput.value = data.settings.heroTitle || "";
  heroSubtitleInput.value = data.settings.heroSubtitle || "";
  heroPrimaryCtaInput.value = data.settings.heroPrimaryCtaLabel || "";
  heroSecondaryCtaInput.value = data.settings.heroSecondaryCtaLabel || "";
  setHeroPreview(data.settings.heroBackgroundImage || "");
  setSimplePreview(brandLogoPreview, data.settings.brandLogoImage || "");
  setSimplePreview(faviconPreview, data.settings.faviconImage || "");
  entryPopupEnabledInput.checked = !!data.settings.entryPopupEnabled;
  entryPopupLinkInput.value = data.settings.entryPopupLink || "";
  entryPopupStartInput.value = data.settings.entryPopupStartAt || "";
  entryPopupEndInput.value = data.settings.entryPopupEndAt || "";
  setSimplePreview(entryPopupPreview, data.settings.entryPopupImage || "");
  data.homeDisplayItems = data.homeDisplayItems || [];
  data.settings.sideAds = Array.isArray(data.settings.sideAds) ? data.settings.sideAds : [];
  setDisplayPreview("");
  setSideAdPreview("");
  broadcastEnabledInput.checked = !!data.settings.broadcastEnabled;
  broadcastFlowInput.checked = data.settings.broadcastFlow !== false;
  glowThreadsEnabledInput.checked = data.settings.glowThreadsEnabled !== false;
  floatingWhatsappEnabledInput.checked = data.settings.floatingWhatsappEnabled !== false;
  broadcastTextInput.value = data.settings.broadcastText || "";
  broadcastSpeedInput.value = Number(data.settings.broadcastSpeedSeconds) || 22;
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    data.settings.brandName = brandInput.value.trim();
    data.settings.whatsappNumber = whatsappInput.value.trim();
    data.settings.primaryColor = colorInput.value;
    data.settings.secondaryColor = secondaryColorInput.value;
    data.settings.backgroundColor = backgroundColorInput.value;
    data.settings.surfaceColor = surfaceColorInput.value;
    data.settings.textColor = textColorInput.value;
    const slideIntervalMs = Math.round((Number(slideIntervalInput.value) || 3.2) * 1000);
    data.settings.slideIntervalMs = Math.min(10000, Math.max(2000, slideIntervalMs));
    slideIntervalInput.value = (data.settings.slideIntervalMs / 1000).toFixed(1);
    data.settings.businessHours = businessHoursInput.value.trim();
    data.settings.contactAddress = contactAddressInput.value.trim();
    data.settings.mapLink = mapLinkInput.value.trim();
    data.settings.facebookUrl = facebookUrlInput.value.trim();
    data.settings.instagramUrl = instagramUrlInput.value.trim();
    data.settings.youtubeUrl = youtubeUrlInput.value.trim();
    data.settings.heroEyebrow = heroEyebrowInput.value.trim();
    data.settings.heroTitle = heroTitleInput.value.trim();
    data.settings.heroSubtitle = heroSubtitleInput.value.trim();
    data.settings.heroPrimaryCtaLabel = heroPrimaryCtaInput.value.trim();
    data.settings.heroSecondaryCtaLabel = heroSecondaryCtaInput.value.trim();
    data.settings.entryPopupEnabled = !!entryPopupEnabledInput.checked;
    data.settings.entryPopupLink = entryPopupLinkInput.value.trim();
    data.settings.entryPopupStartAt = entryPopupStartInput.value;
    data.settings.entryPopupEndAt = entryPopupEndInput.value;
    data.settings.broadcastEnabled = !!broadcastEnabledInput.checked;
    data.settings.broadcastFlow = !!broadcastFlowInput.checked;
    data.settings.glowThreadsEnabled = !!glowThreadsEnabledInput.checked;
    data.settings.floatingWhatsappEnabled = !!floatingWhatsappEnabledInput.checked;
    data.settings.broadcastText = broadcastTextInput.value.trim();
    data.settings.broadcastSpeedSeconds = Math.min(80, Math.max(8, Number(broadcastSpeedInput.value) || 22));
    await saveData(data);
    applyThemeSettings(data.settings);
  document.title = `${data.settings?.brandName || "TOP SEAL"} Admin Panel`;
  if (adminTitleEl) adminTitleEl.textContent = `${data.settings?.brandName || "TOP SEAL"} Admin Panel`;
    setNotice(settingsNotice, "Settings saved.");
  });
  categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const label = categoryNameInput.value.trim();
    if (!label) return;
    data.categories.push({
      id: uid("cat"),
      label,
      slug: slugify(label),
      subcategories: []
    });
    categoryNameInput.value = "";
    await saveData(data);
    redrawAll();
    setNotice(categoryNotice, "Category added.");
  });
  subForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const categoryId = subCategorySelect.value;
    const label = subNameInput.value.trim();
    if (!categoryId || !label) {
      setNotice(subNotice, "Choose category and enter sub-category name.", "error");
      return;
    }
    const category = data.categories.find((item) => item.id === categoryId);
    category.subcategories.push({ id: uid("sub"), label, slug: slugify(label) });
    subNameInput.value = "";
    await saveData(data);
    redrawAll();
    setNotice(subNotice, "Sub-category added.");
  });
  homeSlideForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = homeSlideFile.files?.[0];
    if (!file) {
      setNotice(homeSlideNotice, "Select an image first.", "error");
      return;
    }
    let slideUrl = "";
    try {
      slideUrl = await uploadImageToStorage(file);
    } catch {
      slideUrl = await autoCropImageToSquare(file);
    }
    data.homeSlides = data.homeSlides || [];
    data.homeSlides.push({ id: uid("slide"), imageData: slideUrl, link: (homeSlideLink?.value || "").trim() });
    await saveData(data);
    homeSlideForm.reset();
    if (homeSlideLink) homeSlideLink.value = "";
    redrawHomeSlides();
    setNotice(homeSlideNotice, "Slide added.");
  });
  displayItemForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = displayItemTitleInput.value.trim();
    const description = displayItemDescriptionInput.value.trim();
    const imageData = displayItemImageDataInput.value.trim();
    const link = displayItemLinkInput.value.trim();
    if (!title || !imageData) {
      setNotice(displayItemNotice, "Heading and image are required.", "error");
      return;
    }
    data.homeDisplayItems = data.homeDisplayItems || [];
    data.homeDisplayItems.push({
      id: uid("display"),
      title,
      description,
      imageData,
      link
    });
    await saveData(data);
    displayItemForm.reset();
    displayItemImageDataInput.value = "";
    setDisplayPreview("");
    redrawDisplayItems();
    setNotice(displayItemNotice, "Display item added.");
  });
  sideAdForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const side = sideAdSideInput.value === "right" ? "right" : "left";
    const imageData = sideAdImageDataInput.value.trim();
    const link = sideAdLinkInput.value.trim();
    if (!imageData) {
      setNotice(sideAdNotice, "Upload a GIF/image for the side ad.", "error");
      return;
    }
    data.settings.sideAds = Array.isArray(data.settings.sideAds) ? data.settings.sideAds : [];
    data.settings.sideAds.push({
      id: uid("side-ad"),
      side,
      imageData,
      link
    });
    await saveData(data);
    sideAdForm.reset();
    sideAdImageDataInput.value = "";
    sideAdSideInput.value = side;
    setSideAdPreview("");
    redrawSideAds();
    setNotice(sideAdNotice, "Side ad added.");
  });
  productNameInput.addEventListener("blur", () => {
    if (!productSlugInput.value.trim()) {
      productSlugInput.value = slugify(productNameInput.value);
    }
  });
  productCategorySelect.addEventListener("change", () => {
    renderSubcategoryOptions(data, productCategorySelect.value, productSubcategorySelect, true);
  });
  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = productIdInput.value.trim();
    const name = productNameInput.value.trim();
    const slug = productSlugInput.value.trim() || slugify(name);
    const categoryId = productCategorySelect.value;
    const subcategoryId = productSubcategorySelect.value;
    const description = productDescriptionInput.value.trim();
    const price = productPriceInput.value.trim();
    const stock = productStockInput.value.trim();
    const imageData = productImageDataInput.value.trim();
    const features = productFeaturesInput.value.split(",").map((item) => item.trim()).filter(Boolean);
    const specs = productSpecsInput.value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [labelPart, ...valueParts] = line.split(":");
      const label = (labelPart || "").trim();
      const value = valueParts.join(":").trim();
      return { label, value };
    }).filter((item) => item.label && item.value);
    const trustPoints = productTrustPointsInput.value.split("\n").map((item) => item.trim()).filter(Boolean);
    const badges = getSelectedBadges();
    if (!name || !categoryId || !subcategoryId) {
      setNotice(productNotice, "Name, category, and sub-category are required.", "error");
      return;
    }
    if (id) {
      const target = data.products.find((item) => item.id === id);
      Object.assign(target, { name, slug, categoryId, subcategoryId, description, price, stock, imageData, features, specs, trustPoints, badges, featuredOnHome: !!target.featuredOnHome });
      setNotice(productNotice, "Product updated.");
    } else {
      data.products.push({ id: uid("prd"), name, slug, categoryId, subcategoryId, description, price, stock, imageData, features, specs, trustPoints, badges, featuredOnHome: false });
      setNotice(productNotice, "Product added.");
    }
    await saveData(data);
    productForm.reset();
    productIdInput.value = "";
    productImageDataInput.value = "";
    setProductPreview("");
    productSpecsInput.value = "";
    productTrustPointsInput.value = "";
    setSelectedBadges([]);
    redrawAll();
  });
  cancelEditBtn.addEventListener("click", () => {
    productForm.reset();
    productIdInput.value = "";
    productImageDataInput.value = "";
    setProductPreview("");
    productSpecsInput.value = "";
    productTrustPointsInput.value = "";
    setSelectedBadges([]);
  });
  redrawAll();
}
function drawSimpleBarChart(canvas, entries = [], color = "#1c4e80") {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  const values = entries.map(([, value]) => Number(value) || 0);
  const max = Math.max(1, ...values);
  const chartH = h - 48;
  const barW = Math.max(28, (w - 30) / Math.max(1, entries.length) - 12);
  entries.forEach(([label, value], i) => {
    const x = 20 + i * (barW + 12);
    const v = Number(value) || 0;
    const bh = (v / max) * (chartH - 18);
    const y = chartH - bh + 12;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW, bh);
    ctx.fillStyle = "#1f2933";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(String(v), x, y - 4);
    ctx.save();
    ctx.translate(x, h - 8);
    ctx.rotate(-0.18);
    ctx.fillText(label.slice(0, 14), 0, 0);
    ctx.restore();
  });
}
function drawSimpleLineChart(canvas, entries = [], color = "#16324f") {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  const vals = entries.map(([, value]) => Number(value) || 0);
  const max = Math.max(1, ...vals);
  const xGap = entries.length > 1 ? (w - 60) / (entries.length - 1) : 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  entries.forEach(([, value], i) => {
    const x = 30 + i * xGap;
    const y = h - 35 - ((Number(value) || 0) / max) * (h - 70);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = color;
  entries.forEach(([label, value], i) => {
    const x = 30 + i * xGap;
    const y = h - 35 - ((Number(value) || 0) / max) * (h - 70);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2933";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(label.slice(0, 14), x - 10, h - 12);
    ctx.fillText(String(value), x - 6, y - 8);
    ctx.fillStyle = color;
  });
}
async function bootstrapAnalyticsPage() {
  const root = document.getElementById("admin-analytics-page");
  if (!root) return;
  const isLoggedIn = await getAdminSession();
  if (!isLoggedIn) {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = "admin-login.html";
    return;
  }
  const data = await loadData();
  applyThemeSettings(data.settings || {});
  const brand = data.settings?.brandName || "TOP SEAL";
  document.title = `${brand} Analytics Dashboard`;
  const titleEl = document.getElementById("analytics-page-title");
  if (titleEl) titleEl.textContent = `${brand} Analytics Dashboard`;
  const rangeSelect = document.getElementById("analytics-range");
  const startInput = document.getElementById("analytics-start");
  const endInput = document.getElementById("analytics-end");
  const applyBtn = document.getElementById("analytics-apply");
  const exportCsvBtn = document.getElementById("analytics-export-csv");
  const exportPdfBtn = document.getElementById("analytics-export-pdf");
  const kpi = document.getElementById("analytics-kpi-grid");
  const topSearches = document.getElementById("analytics-top-searches");
  const trafficPie = document.getElementById("traffic-pie");
  const trafficLegend = document.getElementById("traffic-legend");
  const heatmapEl = document.getElementById("lead-heatmap");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function getRangeBounds() {
    const now = new Date();
    const range = rangeSelect?.value || "30d";
    let startMs = 0;
    let endMs = now.getTime();
    if (range === "7d") {
      startMs = endMs - (7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startMs = endMs - (30 * 24 * 60 * 60 * 1000);
    } else {
      const customStart = startInput?.value ? new Date(startInput.value).getTime() : 0;
      const customEnd = endInput?.value ? new Date(endInput.value).getTime() + (24 * 60 * 60 * 1000) - 1 : endMs;
      startMs = Number.isFinite(customStart) ? customStart : 0;
      endMs = Number.isFinite(customEnd) ? customEnd : endMs;
    }
    return { startMs, endMs };
  }
  function buildFilteredStats() {
    const analytics = getStoreAnalyticsSnapshot();
    const events = Array.isArray(analytics.eventLog) ? analytics.eventLog : [];
    const { startMs, endMs } = getRangeBounds();
    const scoped = events.filter((event) => Number(event.ts) >= startMs && Number(event.ts) <= endMs);
    const pageViewMap = {};
    const productMap = {};
    const searchMap = {};
    let wa = 0;
    let leads = 0;
    scoped.forEach((event) => {
      if (event.type === "page_view") {
        const key = event.page || "unknown";
        pageViewMap[key] = (pageViewMap[key] || 0) + 1;
      }
      if (event.type === "product_view") {
        const key = event.slug || "unknown";
        productMap[key] = (productMap[key] || 0) + 1;
      }
      if (event.type === "search") {
        const key = (event.term || "").toLowerCase();
        if (key) searchMap[key] = (searchMap[key] || 0) + 1;
      }
      if (event.type === "whatsapp_click") wa += 1;
      if (event.type === "lead_capture") leads += 1;
    });
    const pageViews = Object.entries(pageViewMap).sort((a, b) => b[1] - a[1]);
    const productViews = Object.entries(productMap).sort((a, b) => b[1] - a[1]);
    const searches = Object.entries(searchMap).sort((a, b) => b[1] - a[1]);
    if (!scoped.length) {
      return {
        scoped,
        pageViews: Object.entries(analytics.pageViews || {}).sort((a, b) => b[1] - a[1]),
        productViews: Object.entries(analytics.productViews || {}).sort((a, b) => b[1] - a[1]),
        searches: Object.entries(analytics.topSearches || {}).sort((a, b) => b[1] - a[1]),
        wa: Number(analytics.whatsappClicks || 0),
        leads: Number(analytics.leadCaptures || 0)
      };
    }
    return { scoped, pageViews, productViews, searches, wa, leads };
  }
  function renderHeatmap(events) {
    if (!heatmapEl) return;
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    events.forEach((event) => {
      if (event.type !== "lead_capture") return;
      const dt = new Date(Number(event.ts));
      if (Number.isNaN(dt.getTime())) return;
      grid[dt.getDay()][dt.getHours()] += 1;
    });
    const max = Math.max(1, ...grid.flat());
    let html = '<div class="heatmap-cell head">Day/Hour</div>';
    for (let h = 0; h < 24; h += 1) html += `<div class="heatmap-cell head">${h}</div>`;
    for (let d = 0; d < 7; d += 1) {
      html += `<div class="heatmap-cell head">${dayNames[d]}</div>`;
      for (let h = 0; h < 24; h += 1) {
        const count = grid[d][h];
        const alpha = count ? (0.12 + (count / max) * 0.88).toFixed(2) : 0.06;
        html += `<div class="heatmap-cell" style="background: color-mix(in srgb, var(--primary) ${Math.round(alpha * 100)}%, #ffffff);" title="${dayNames[d]} ${h}:00 — ${count} lead(s)">${count || ""}</div>`;
      }
    }
    heatmapEl.innerHTML = html;
  }
  function render() {
    const stats = buildFilteredStats();
    const pageViews = stats.pageViews;
    const productViews = stats.productViews.slice(0, 7);
    const searchEntries = stats.searches.slice(0, 8);
    const totalViews = pageViews.reduce((sum, [, n]) => sum + Number(n || 0), 0);
    const actionRate = totalViews ? (((stats.wa + stats.leads) / totalViews) * 100).toFixed(1) : "0.0";
    kpi.innerHTML = [
      ["Page Views", totalViews],
      ["WhatsApp Clicks", stats.wa],
      ["Leads", stats.leads],
      ["Action Rate", `${actionRate}%`]
    ].map(([label, value]) => `<article class="analytics-kpi"><div class="label">${label}</div><div class="value">${value}</div></article>`).join("");
    topSearches.innerHTML = searchEntries.length
      ? searchEntries.map(([term, count]) => `<div class="analytics-row"><div><strong>${term}</strong><div class="bar"><span style="width:${Math.max(8, Math.min(100, (count / (searchEntries[0][1] || 1)) * 100))}%"></span></div></div><span>${count}</span></div>`).join("")
      : '<p class="small muted">No search analytics yet in selected range.</p>';
    const direct = stats.wa + stats.leads;
    const browseOnly = Math.max(0, totalViews - direct);
    const pieTotal = Math.max(1, direct + browseOnly);
    const directPct = Math.round((direct / pieTotal) * 100);
    trafficPie.style.background = `conic-gradient(var(--primary) 0 ${directPct}%, color-mix(in srgb, var(--secondary), #ffffff 30%) ${directPct}% 100%)`;
    trafficLegend.innerHTML = `<p><strong>Action traffic:</strong> ${direct}</p><p><strong>Browse-only traffic:</strong> ${browseOnly}</p><p class="small muted">Filtered by selected date range.</p>`;
    drawSimpleBarChart(document.getElementById("page-views-chart"), pageViews.slice(0, 8), data.settings?.primaryColor || "#1c4e80");
    drawSimpleLineChart(document.getElementById("product-views-chart"), productViews, data.settings?.secondaryColor || "#16324f");
    renderHeatmap(stats.scoped);
    exportCsvBtn.onclick = () => {
      const rows = [["metric", "value"], ["page_views", totalViews], ["whatsapp_clicks", stats.wa], ["leads", stats.leads], ["action_rate_percent", actionRate]];
      rows.push([],["top_search_term","count"]);
      searchEntries.forEach(([term, count]) => rows.push([term, count]));
      rows.push([],["top_product","views"]);
      productViews.forEach(([slug, count]) => rows.push([slug, count]));
      const csv = rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-report-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };
    exportPdfBtn.onclick = () => window.print();
  }
  applyBtn?.addEventListener("click", render);
  rangeSelect?.addEventListener("change", () => {
    const isCustom = rangeSelect.value === "custom";
    startInput.disabled = !isCustom;
    endInput.disabled = !isCustom;
  });
  if (rangeSelect) {
    rangeSelect.value = "30d";
    rangeSelect.dispatchEvent(new Event("change"));
  }
  render();
}
bootstrapLoginPage();
bootstrapDashboardPage();
bootstrapAnalyticsPage();
