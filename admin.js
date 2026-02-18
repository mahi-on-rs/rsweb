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
  const homeSlideNotice = document.getElementById("home-slide-notice");
  const homeSlidesList = document.getElementById("home-slides-list");

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
    if (!imageData) {
      el.removeAttribute("src");
      el.classList.add("hidden");
      return;
    }
    el.src = imageData;
    el.classList.remove("hidden");
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
      try {
        finalImage = await uploadImageToStorage(file);
      } catch {
        finalImage = await autoCropImageToSquare(file);
      }
      data.settings.entryPopupImage = finalImage;
      setSimplePreview(entryPopupPreview, finalImage);
      setNotice(settingsNotice, "Entry popup image uploaded. Save settings to publish.");
    } catch (error) {
      setNotice(settingsNotice, error.message, "error");
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
      actionWrap.appendChild(deleteBtn);
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
      const card = document.createElement("div");
      card.className = "slide-item";
      card.innerHTML = `<img class="slide-thumb" src="${slide}" alt="Slide ${idx + 1}" />`;
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
    redrawProductsTable();
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
  broadcastEnabledInput.checked = !!data.settings.broadcastEnabled;
  broadcastFlowInput.checked = data.settings.broadcastFlow !== false;
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
    data.settings.broadcastText = broadcastTextInput.value.trim();
    data.settings.broadcastSpeedSeconds = Math.min(80, Math.max(8, Number(broadcastSpeedInput.value) || 22));
    await saveData(data);
    applyThemeSettings(data.settings);
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
    data.homeSlides.push(slideUrl);
    await saveData(data);
    homeSlideForm.reset();
    redrawHomeSlides();
    setNotice(homeSlideNotice, "Slide added.");
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

bootstrapLoginPage();
bootstrapDashboardPage();
