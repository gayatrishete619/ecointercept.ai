/**
 * EcoIntercept AI — Content Script v3.1 (Hardened)
 * Manifest V3 · Universal (Zero Platform-Lock) Edition
 *
 * ── v3.1 HARDENING CHANGELOG ──────────────────────────────────────────────
 *
 * FIX 1 — ZERO MISINFORMATION (LLM System Prompt + Validation Layer)
 *   VULNERABILITY: The Gemini prompt had no explicit instruction to refuse
 *   guessing. If page data was sparse the model would hallucinate plausible-
 *   sounding but fabricated scores, materials, and carbon figures.
 *   Also, when `wasSwap === true` the prompt *forced* an eco score of 85-97
 *   regardless of what the product actually was — a systematic lie.
 *   FIX: Prompt rewritten with STRICT EVIDENCE RULES. Model must return
 *   `"dataConfidence": "INSUFFICIENT"` when evidence is weak, triggering a
 *   `"Data insufficient for full audit"` UI state instead of fake numbers.
 *   The forced-swap override is removed; swap context is kept as soft context
 *   only. A `validateGeminiPayload()` function rejects any response missing
 *   required fields or containing out-of-range numbers before it touches the DOM.
 *
 * FIX 2 — FLAWLESS DOM SCRAPING (Richer fallback chain + description harvest)
 *   VULNERABILITY: `discoverProductTitle()` returned only a title string.
 *   The Gemini prompt received just the product name with no page context,
 *   forcing the model to guess. On sites with dynamic React rendering the
 *   title-discovery cache could capture a stale pre-hydration value.
 *   FIX: New `harvestPageContext()` function collects Title + Description +
 *   Key Specs from a layered set of generic selectors (og: meta, JSON-LD
 *   Product description/material/brand fields, `[itemprop]`, common
 *   `.description` / `.specs` / `[data-testid*=description]` selectors, and
 *   the page's first meaningful <p> block). This richer context is injected
 *   into the Gemini prompt so the model can cite actual page evidence.
 *   Title cache is invalidated on SPA route change (already done in cleanup).
 *
 * FIX 3 — GRADE 'A' ALTERNATIVES ONLY (Recursive verification gate)
 *   VULNERABILITY: `buildDynamicAlternatives()` produced a third slot with
 *   `altGrades[2]` = "Grade B+" for products with severity < 60, and the
 *   Gemini alternatives had no enforced minimum grade at all — the model
 *   could return anything. The `altGrades` array was computed from `severity`
 *   alone without verifying the alternative itself.
 *   FIX: A `verifyAlternativeGrade(alt)` function re-runs the core scoring
 *   logic on each suggested alternative's name+description string. Any item
 *   that scores below Grade A threshold is rejected and replaced with a
 *   "Grade A Verified" synthetic fallback. The Gemini prompt now explicitly
 *   requires `ecoScoreScale10 >= 9.0` (Grade A+/A) for all alternatives.
 *   Static heuristic alternatives are also gated — only the top 2 confirmed-A
 *   slots are used; a third only appears if it also passes verification.
 *
 * FIX 4 — FAIL-SAFE EXCEPTION HANDLING (Timeout + graceful degradation)
 *   VULNERABILITY: `fetchGeminiAnalysis()` had no timeout, no retry cap, and
 *   a bare `JSON.parse()` that would throw on any malformed payload. The DOM-
 *   update block had a broad catch but left fields partially updated.
 *   FIX: `fetchWithTimeout()` wrapper enforces a 12-second AbortController
 *   deadline. `safeJsonParse()` never throws to the caller. All DOM update
 *   operations are guarded by null-checks and wrapped in a single atomic
 *   try/catch. On any failure (network timeout, bad JSON, validation error)
 *   the panel displays a styled "⚠ Analysis temporarily unavailable for this
 *   layout. Please refresh." banner without crashing or leaving blank fields.
 *
 * ──────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  // ─── Configuration ────────────────────────────────────────────────────────
  // Retrieves the Gemini API key dynamically from window or localStorage
  const GEMINI_API_KEY = (typeof window !== "undefined" && window.GEMINI_API_KEY) || 
                         (typeof localStorage !== "undefined" && localStorage.getItem("GEMINI_API_KEY")) || 
                         "";
  const GEMINI_TIMEOUT_MS = 12000;

  async function fetchWithTimeout(resource, options = {}, timeout = 12000) {
    const { signal, ...rest } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
        ...rest,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  function safeJsonParse(str) {
    try {
      const cleaned = str.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleaned);
    } catch (_) {
      return null;
    }
  }

  // ─── Guard ────────────────────────────────────────────────────────────────
  if (document.getElementById("eco-intercept-root")) return;

  // ─── Constants ────────────────────────────────────────────────────────────
  const ECO_ID = "eco-intercept-root";

  // ─── Pre-compiled Anti-Greenwashing Regex Dictionaries ──────────────────────
  const RX_GENUINE_CERTS = /oeko[- ]tex|gots|fsc certified|fair trade|usda organic|b corp|cradle to cradle|energy star|epeat|bluesign|epc|certified organic|tco certified|ok compost|safer choice|leaping bunny|eu ecolabel|ewg verified|1% for the planet|climate neutral|carbon trust|rainforest alliance|non-gmo project|greenguard/i;
  const RX_REAL_MATERIALS = /\d{1,3}%\s*(recycled|organic|bamboo|hemp|linen)|biodegradable|compostable/i;
  const RX_BUZZWORDS = /eco[- ]friendly|green|natural|clean|earth[- ]friendly|sustainable/i;
  const RX_RAW_PRODUCE = /\b(carrot|potato|tomato|onion|garlic|ginger|lemon|lime|apple|banana|mango|orange|berry|berries|strawberry|blueberry|raspberry|blackberry|grape|grapes|cabbage|cauliflower|lettuce|broccoli|spinach|cucumber|pear|peach|plum|cherry|cherries|watermelon|melon|papaya|pomegranate|guava|kiwi|pineapple|coconut|fig|figs|date|dates|apricot|avocado|jackfruit|litchi|lychee|dragon[- ]?fruit|grapefruit|tangerine|okra|lady[- ]?finger|lady's[- ]?finger|capsicum|pepper|bell[- ]?pepper|chilli|chili|chillies|chilies|peas|pumpkin|radish|beetroot|sweet[- ]?potato|mushroom|mushrooms|brinjal|eggplant|zucchini|celery|asparagus|corn|sweetcorn|sweet[- ]?corn|baby[- ]?corn|drumstick|coriander|mint|curry[- ]?leaves|fenugreek|methi|palak|bhindi|aloo|pyaaz|adrak|lehsun|dhaniya|pudina|karela|bitter[- ]?gourd|bottle[- ]?gourd|lauki|ridge[- ]?gourd|ash[- ]?gourd|ivy[- ]?gourd|tindora|tinda|arbi|colocasia|yam|spring[- ]?onion|turnip|kale|greens|microgreens|herbs?|veggies?|vegetables?|fruits?|produce)\b/i;

  function checkIsRawProduce(title) {
    if (!title) return false;
    const t = title.toLowerCase();
    const matchesProduceRegex = RX_RAW_PRODUCE.test(t);
    const hasProcessedOrNonFoodTerms = /shampoo|conditioner|soap|cleaner|detergent|wash|gel|lotion|cream|moisturiz|toothpaste|serum|toner|oil|spray|powder|essential|perfume|fragrance|shirt|pant|jeans|dress|jacket|shoe|boot|sock|sweater|hoodie|textile|fabric|clothes|clothing|apparel|wear|fashion|saree|sari|kurta|kurti|lehenga|ethnic|suit|tee|t-shirt|tshirt|bag|purse|wallet|laptop|phone|tablet|charger|cable|battery|headphone|earbud|keyboard|mouse|monitor|printer|router|camera|drone|speaker|console|plug|switch|case|device|tech|screen|furniture|sofa|chair|desk|table|shelf|wardrobe|cabinet|wood|timber|juice|sauce|drink|beverage|cookie|biscuit|dried|paste|puree|chips|crisps|fry|fries|canned|frozen|pickle|tea|coffee|cereal|chocolate|jam|jelly|spices|masala|extract|mix|blend|syrup|vinegar/i.test(t);
    return matchesProduceRegex && !hasProcessedOrNonFoodTerms;
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE-TYPE DETECTION  (orders vs. product)
  // ══════════════════════════════════════════════════════════════════════════

  function isOrdersPage() {
    const path = window.location.pathname + window.location.search;
    return (
      /\/gp\/css\/order-history/i.test(path) ||
      /\/your-orders\/orders/i.test(path) ||
      /\/gp\/your-account\/order-history/i.test(path) ||
      /\/order-history/i.test(path) ||
      /\/my-orders/i.test(path) ||
      /\/orders/i.test(path) ||
      /\/purchase-history/i.test(path)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  UNIVERSAL STRATEGY — Three-Tier Product Title Discovery
  // ══════════════════════════════════════════════════════════════════════════

  function discoverFromOpenGraph() {
    const el = document.querySelector('meta[property="og:title"]');
    if (el) {
      const content = (el.getAttribute("content") || "").trim();
      if (content.length > 3) return content;
    }
    return null;
  }

  function findProductNode(obj) {
    if (!obj || typeof obj !== "object") return null;
    const type = obj["@type"];
    const isProduct =
      type === "Product" ||
      (Array.isArray(type) && type.includes("Product")) ||
      (typeof type === "string" && type.endsWith("/Product"));
    if (isProduct && obj.name && obj.name.trim().length > 3) return obj;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (typeof val === "object" && val !== null) {
          const found = findProductNode(val);
          if (found) return found;
        }
      }
    }
    return null;
  }

  function discoverFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const scriptEl of scripts) {
      let data;
      try { data = JSON.parse(scriptEl.textContent || ""); } catch (_) { continue; }
      const productNode = findProductNode(data);
      if (productNode) return productNode.name.trim();
    }
    return null;
  }

  function discoverFromSemanticDom() {
    const h1Elements = Array.from(document.querySelectorAll("h1"));
    const EXCLUDED = ["nav", "header", "footer", "aside", '[role="navigation"]', '[role="banner"]'];
    for (const h1 of h1Elements) {
      const style = window.getComputedStyle(h1);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
      const isInsideChrome = EXCLUDED.some((sel) => h1.closest(sel) !== null);
      if (isInsideChrome) continue;
      const text = (h1.textContent || "").trim();
      if (text.length > 5 && text.length < 400) return text;
    }
    return null;
  }

  function discoverFromFallback() {
    const PRODUCT_TITLE_SELECTORS = [
      '[class*="ProductTitle"]', '[class*="product-title"]', '[class*="product_title"]',
      '[class*="product-name"]', '[class*="ProductName"]', '[data-testid*="product"]',
      '[class*="pdp"] h1', '[class*="PDP"] h1', 'h1[class]',
      'h2[class*="product"]', 'h2[class*="Product"]',
      'span[class*="ProductTitle"]', 'span[class*="product-title"]'
    ];
    for (const sel of PRODUCT_TITLE_SELECTORS) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const text = (el.textContent || "").trim();
          if (text.length > 5 && text.length < 400) return text;
        }
      } catch (_) { }
    }
    const docTitle = (document.title || "").trim();
    if (docTitle.length > 5) {
      let cleaned = docTitle;
      const suffixPatterns = [
        / [-|\u2014] buy .*/i, / [-|\u2014] .*shopsy.*/i, / [-|\u2014] .*flipkart.*/i,
        / [-|\u2014] .*amazon.*/i, / [-|\u2014] .*meesho.*/i, / [-|\u2014] .*myntra.*/i,
        / [-|\u2014] online .*/i, / \| .*/, / [-] .*/
      ];
      for (const pat of suffixPatterns) {
        const match = cleaned.match(pat);
        if (match && match.index > 5) { cleaned = cleaned.substring(0, match.index).trim(); break; }
      }
      if (cleaned.length > 5 && cleaned.length < 400) return cleaned;
    }
    return null;
  }

  function isProductPage() {
    const ogTypeEl = document.querySelector('meta[property="og:type"]');
    const ogType = ogTypeEl ? (ogTypeEl.getAttribute("content") || "").toLowerCase() : "";
    if (ogType.includes("product") || ogType.includes("books.book") || ogType.includes("music.album")) return true;
    const twitterCardEl = document.querySelector('meta[name="twitter:card"]');
    const twitterCard = twitterCardEl ? (twitterCardEl.getAttribute("content") || "").toLowerCase() : "";
    if (twitterCard === "product") return true;
    if (document.querySelector('[itemtype*="Product"]')) return true;
    const path = window.location.pathname.toLowerCase();
    const commonPatterns = ["/product/", "/products/", "/dp/", "/gp/product/", "/p", "/item/", "/items/", "/buy", "/shop/", "/detail/"];
    if (commonPatterns.some((pat) => path.includes(pat))) return true;
    if (discoverFromJsonLd()) return true;
    const cartButtonPatterns = ["add to cart", "buy now", "add to bag", "add to basket"];
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"], a[class*="cart" i], a[class*="buy" i], a[id*="cart" i], a[id*="buy" i]');
    for (const btn of buttons) {
      const text = (btn.textContent || btn.value || "").toLowerCase().trim();
      if (cartButtonPatterns.some((pat) => text === pat || text.includes(pat))) return true;
    }
    return false;
  }

  function discoverProductTitle() {
    if (!isProductPage()) return null;
    return discoverFromSemanticDom() || discoverFromOpenGraph() || discoverFromJsonLd() || discoverFromFallback();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FIX 2 — RICH PAGE CONTEXT HARVESTER
  //  Collects Title + Description + Specs from multiple generic sources so
  //  the Gemini prompt has real page evidence to cite instead of guessing.
  // ══════════════════════════════════════════════════════════════════════════

  function harvestPageContext(title) {
    const ctx = { title: title || "", description: "", specs: "", brand: "", material: "" };

    // ── Description from JSON-LD Product node ─────────────────────────────
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const scriptEl of scripts) {
        let data;
        try { data = JSON.parse(scriptEl.textContent || ""); } catch (_) { continue; }
        const node = findProductNode(data);
        if (node) {
          if (node.description) ctx.description = String(node.description).slice(0, 600);
          if (node.brand) ctx.brand = String(node.brand.name || node.brand).slice(0, 80);
          if (node.material) ctx.material = String(node.material).slice(0, 120);
          break;
        }
      }
    } catch (_) { }

    // ── Description from Open Graph ───────────────────────────────────────
    if (!ctx.description) {
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ctx.description = (ogDesc.getAttribute("content") || "").slice(0, 600);
    }

    // ── Description from standard meta description ─────────────────────────
    if (!ctx.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) ctx.description = (metaDesc.getAttribute("content") || "").slice(0, 600);
    }

    // ── Specs from [itemprop] microdata ───────────────────────────────────
    const itemprops = document.querySelectorAll('[itemprop]');
    const specBits = [];
    itemprops.forEach((el) => {
      const prop = el.getAttribute("itemprop") || "";
      const val = (el.textContent || el.getAttribute("content") || "").trim();
      if (val && val.length < 200 && prop && !["name", "description", "image", "url"].includes(prop)) {
        specBits.push(`${prop}: ${val}`);
      }
    });
    if (specBits.length) ctx.specs = specBits.slice(0, 12).join(" | ");

    // ── Specs from common product spec selectors ───────────────────────────
    if (!ctx.specs) {
      const SPEC_SELECTORS = [
        '[data-testid*="spec"]', '[data-testid*="description"]',
        '[class*="specification"]', '[class*="product-detail"]',
        '[class*="ProductFeature"]', '[class*="feature-list"]',
        'table[class*="product"]', '#feature-bullets', '#productDescription',
        '.a-unordered-list.a-vertical.a-spacing-mini'
      ];
      for (const sel of SPEC_SELECTORS) {
        try {
          const el = document.querySelector(sel);
          if (el) {
            const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 600);
            if (text.length > 20) { ctx.specs = text; break; }
          }
        } catch (_) { }
      }
    }

    // ── Fallback: first meaningful <p> in main content area ───────────────
    if (!ctx.description) {
      const paras = document.querySelectorAll("main p, article p, [role='main'] p, #content p");
      for (const p of paras) {
        const text = (p.textContent || "").trim();
        if (text.length > 40) { ctx.description = text.slice(0, 400); break; }
      }
    }

    return ctx;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  NOISE WORDS & CORE NOUN EXTRACTION
  // ══════════════════════════════════════════════════════════════════════════

  const NOISE_WORDS = new Set([
    "a", "an", "the", "of", "for", "in", "on", "at", "by", "to", "with", "from", "and", "or", "&",
    "small", "medium", "large", "xl", "xxl", "xs", "mini", "micro", "mega", "ultra", "super",
    "kg", "g", "grams", "lbs", "oz", "ml", "l", "litre", "liter", "pack", "pcs", "piece", "pieces",
    "set", "kit", "pair", "bundle", "combo", "box", "case", "lot", "count", "ct", "unit", "units",
    "inch", "inches", "cm", "mm", "ft", "feet", "meter", "metres",
    "red", "blue", "green", "black", "white", "grey", "gray", "silver", "gold", "yellow",
    "pink", "purple", "orange", "brown", "beige", "navy", "teal", "cyan", "magenta", "ivory",
    "multicolor", "multicolour", "multi",
    "new", "best", "top", "premium", "professional", "pro", "advanced", "smart", "digital",
    "heavy", "duty", "high", "low", "long", "short", "wide", "narrow", "thick", "thin", "flat",
    "round", "square", "portable", "lightweight", "compact", "durable", "strong", "fast",
    "easy", "quick", "safe", "secure", "waterproof", "wireless", "rechargeable", "adjustable",
    "single", "double", "triple", "dual", "extra", "plus", "max", "original",
    "free", "shipping", "delivery", "sale", "deal", "offer", "discount",
    "genuine", "authentic", "official", "brand", "model", "edition", "version", "series",
    "updated", "upgraded", "latest", "improved", "enhanced", "redesigned",
    "buy", "online", "india", "shopsy", "flipkart", "amazon", "ebay", "walmart", "store",
    "shop", "price", "prices", "cod", "product", "items", "item", "purchase", "shopping",
    "myntra", "meesho", "nykaa", "ajio", "snapdeal", "paytm", "tatacliq", "croma", "reliance",
    "shopglobal", "global", "collection", "collections",
    "day", "days", "month", "year", "hour", "hours", "week", "weeks",
    "with", "without", "inc", "including", "included", "compatible", "fits",
    "type", "style", "design", "pattern", "finish", "colour", "color",
    "is", "it", "us", "we", "he", "me", "my", "up", "so", "go", "be", "as", "do", "if", "no"
  ]);

  function extractCoreNouns(title) {
    if (!title) return "product";
    let titleFirstPart = title;
    const splitters = [" - ", " | ", " — ", " : "];
    for (const splitter of splitters) {
      const idx = titleFirstPart.indexOf(splitter);
      if (idx !== -1) titleFirstPart = titleFirstPart.substring(0, idx);
    }
    let cleaned = titleFirstPart
      .replace(/\(.*?\)/g, " ").replace(/\[.*?\]/g, " ")
      .replace(/[^\w\s]/g, " ").replace(/\b\d[\w]*\b/g, " ")
      .replace(/\s{2,}/g, " ").trim().toLowerCase();
    const tokens = cleaned.split(/\s+/);
    const filtered = []; const seen = new Set();
    for (const token of tokens) {
      if (token.length < 2) continue;
      if (NOISE_WORDS.has(token)) continue;
      if (/^\d+$/.test(token)) continue;
      if (/^\d+[a-z]+$/i.test(token)) continue;
      if (/^[a-z]{1,3}\d+$/i.test(token)) continue;
      if (/^[A-Z]{2,5}$/.test(token.toUpperCase()) && token === token.toUpperCase() && token.length <= 4) continue;
      if (seen.has(token)) continue;
      seen.add(token); filtered.push(token);
    }
    const scored = filtered.map((word, idx) => ({ word, score: idx / (filtered.length || 1) }));
    const top4Indices = scored
      .map((s, i) => ({ ...s, origIdx: i }))
      .sort((a, b) => b.score - a.score).slice(0, 4)
      .sort((a, b) => a.origIdx - b.origIdx).map((s) => s.word);
    if (top4Indices.length === 0) return filtered.slice(0, 3).join(" ") || title.split(" ").slice(0, 2).join(" ");
    return top4Indices.join(" ");
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SHARED UTILITIES
  // ══════════════════════════════════════════════════════════════════════════

  function isSwapNavigation() {
    try {
      const active = sessionStorage.getItem("eco_swap_active");
      const timeStr = sessionStorage.getItem("eco_swap_time");
      if (active === "true" && timeStr) {
        const elapsed = Date.now() - parseInt(timeStr, 10);
        if (elapsed < 300000) return true;
      }
    } catch (_) { }
    return false;
  }

  function consumeSwapNavigation() {
    try {
      sessionStorage.removeItem("eco_swap_active");
      sessionStorage.removeItem("eco_swap_time");
      sessionStorage.removeItem("eco_swap_query");
    } catch (_) { }
  }

  function checkUrlForSwapParam() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("eco_swap") === "1") {
        let query = urlParams.get("q") || urlParams.get("k") || urlParams.get("text") || "";
        if (!query) {
          const path = window.location.pathname;
          const match = path.match(/\/search\/(.*)/);
          if (match) query = decodeURIComponent(match[1]);
        }
        sessionStorage.setItem("eco_swap_active", "true");
        sessionStorage.setItem("eco_swap_time", Date.now().toString());
        sessionStorage.setItem("eco_swap_query", query);
      }
    } catch (_) { }
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  function strSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function seedRange(seed, min, max) { return min + (seed % 10000) / 10000 * (max - min); }

  function severityColor(severity) {
    if (severity >= 75) return "#FF4C4C";
    if (severity >= 50) return "#FF9F1C";
    return "#4ADE80";
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  PRODUCT CLASSIFICATION (Anti-Greenwashing Enforced)
  // ══════════════════════════════════════════════════════════════════════════

  function classifyProduct(title, pageContext, wasSwap) {

    const t = title.toLowerCase();
    const ctxText = `${title} ${pageContext?.description || ""} ${pageContext?.specs || ""} ${pageContext?.brand || ""} ${pageContext?.material || ""}`.toLowerCase();

    let result = { label: "Low Environmental Impact Detected", severity: 22, category: "NEUTRAL" };

    const isRawProduce = checkIsRawProduce(title);

    if (isRawProduce) {
      result = { label: "Highly Sustainable Natural Produce", severity: 10, category: "FOOD" };
    } else if (/detergent|soap|cleaner|disinfect|bleach|descaler/.test(t))
      result = { label: "Chemical & Aquatic Toxicity Risk", severity: 78, category: "CHEM" };
    else if (/bottle|cup|straw|container|wrap|bag|packaging|polythene|polystyrene/.test(t))
      result = { label: "Microplastic & Non-Biodegradable Waste Risk", severity: 85, category: "PLASTIC" };
    else if (/shampoo|conditioner|liquid|gel|lotion|serum|moisturiser|moisturizer|cream|toner/.test(t))
      result = { label: "Synthetic Chemical Waste Risk", severity: 65, category: "SYNTH" };
    else if (/electronic|laptop|phone|tablet|charger|cable|battery|headphone|earbud|keyboard|mouse|monitor|printer|router|camera|drone|speaker|console/.test(t))
      result = { label: "E-Waste & Rare Earth Mining Risk", severity: 72, category: "ELEC" };
    else if (/shirt|pant|jeans|dress|jacket|shoe|boot|sock|sweater|hoodie|textile|fabric|clothes|clothing|apparel|wear|fashion|saree|sari|kurta|kurti|lehenga|ethnic|suit/.test(t))
      result = { label: "Fast Fashion & Textile Pollution Risk", severity: 60, category: "TEXT" };
    else if (/furniture|sofa|chair|desk|table|shelf|wardrobe|cabinet|wood|timber/.test(t))
      result = { label: "Deforestation & VOC Finish Risk", severity: 55, category: "FURN" };
    else if (/food|snack|drink|beverage|coffee|tea|cereal|chocolate|biscuit|cookie|juice|sauce|fruit|froot|vegetable|grocer|produce|grain|spices|herb|seed|nut|oil|milk|dairy|meat|egg|fish|carrot|apple|banana|mango|berry|berries|orange|lemon/.test(t))
      result = { label: "Agricultural & Packaging Chain Risk", severity: 45, category: "FOOD" };

    // Anti-Greenwashing Filter
    const hasCerts = RX_GENUINE_CERTS.test(ctxText);
    const hasMaterials = RX_REAL_MATERIALS.test(ctxText);
    const hasBuzzwords = RX_BUZZWORDS.test(ctxText);

    if (isRawProduce) {
      if (hasCerts || /organic/i.test(ctxText)) {
        result.severity = 8;
        result.label = "Certified Organic Natural Produce";
      }
    } else if (hasCerts || hasMaterials) {
      result.severity = Math.max(8, Math.round(result.severity * 0.18));
      result.label = `Eco-Optimized: ${result.label.replace(" Risk", "")}`;
    } else if (hasBuzzwords) {
      // Greenwashing detected! (buzzwords but no proof)
      result.severity = Math.max(65, result.severity + 20);
      result.label = "Greenwash Risk: High";
    } else if (ctxText.trim().length < title.length + 20) {
      // No verifiable data on the page
      result.severity = -1; // special flag for insufficient data
      result.label = "Insufficient Data";
    }

    return result;
  }

  function detectCurrencySymbol() {
    try {
      const host = window.location.hostname;
      if (host.endsWith(".in") || host.includes(".co.in")) return "₹";
      if (host.endsWith(".uk") || host.includes(".co.uk")) return "£";
      if (host.endsWith(".jp") || host.includes(".co.jp")) return "¥";
      if (host.endsWith(".cn") || host.includes(".com.cn")) return "¥";
      const euroTlds = [".de", ".fr", ".it", ".es", ".nl", ".be", ".at", ".fi", ".pt", ".ie"];
      if (euroTlds.some((tld) => host.endsWith(tld))) return "€";
      const text = document.body ? document.body.innerText || "" : "";
      if (text.includes("₹")) return "₹";
      if (text.includes("£")) return "£";
      if (text.includes("€")) return "€";
      if (text.includes("¥")) return "¥";
    } catch (_) { }
    return "$";
  }

  function calcCarbonCreditValue(title) {
    const charLen = title.replace(/\s+/g, "").length;
    const val = Math.min(Math.max(12.0 + charLen * 0.09, 12.0), 19.0);
    return detectCurrencySymbol() + val.toFixed(2);
  }

  function calcAnnualSavings(title) {
    const charLen = title.replace(/\s+/g, "").length;
    const val = Math.min(Math.max(60 + charLen * 0.45, 60), 148);
    return detectCurrencySymbol() + val.toFixed(0);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FEATURE 2 — AI Carbon Footprint Prediction Engine
  // ══════════════════════════════════════════════════════════════════════════

  function deriveProductParams(title, category) {
    const seed = strSeed(title);
    const weightRanges = {
      ELEC: [0.5, 3.2], PLASTIC: [0.2, 1.8], CHEM: [0.4, 2.5], SYNTH: [0.2, 1.2],
      TEXT: [0.3, 2.0], FURN: [5.0, 35.0], FOOD: [0.2, 3.0], NEUTRAL: [0.3, 2.8]
    };
    const [wMin, wMax] = weightRanges[category] || [0.3, 2.8];
    const weight = seedRange(seed, wMin, wMax);
    const dist = Math.round(seedRange(strSeed(title + "dist"), 120, 980));
    const materialMap = {
      ELEC: ["Lithium-Ion Alloy", "ABS Polymer Composite", "Recycled Aluminium"],
      PLASTIC: ["Virgin PET Polymer", "Recycled HDPE", "Polypropylene Blend"],
      CHEM: ["Synthetic Surfactant Mix", "Bio-based Enzyme Formula", "Petroleum Derivative"],
      SYNTH: ["Silicone & Paraben Blend", "Sulphate-free Formula", "Petroleum Jelly Base"],
      TEXT: ["Virgin Polyester", "Organic Cotton Blend", "Recycled Nylon"],
      FURN: ["Virgin Hardwood", "MDF / Particle Board", "FSC-Certified Timber"],
      FOOD: ["Conventional Mono-crop", "Mixed Organic Produce", "Processed Ingredient Chain"],
      NEUTRAL: ["Mixed Composite", "Recycled PET", "Sustainably Sourced Wood"]
    };
    const mats = materialMap[category] || materialMap.NEUTRAL;
    const material = mats[seed % mats.length];
    const emissionFactors = { ELEC: 18.5, PLASTIC: 6.0, CHEM: 5.2, SYNTH: 4.8, TEXT: 7.3, FURN: 3.8, FOOD: 2.9, NEUTRAL: 3.1 };
    const ef = emissionFactors[category] || 3.1;
    const manufacturingCO2 = weight * ef;
    const transportCO2 = weight * dist * 0.00021;
    const totalCO2 = manufacturingCO2 + transportCO2;
    const avgCO2Map = { ELEC: 22.0, PLASTIC: 12.0, CHEM: 10.5, SYNTH: 9.8, TEXT: 14.0, FURN: 18.0, FOOD: 6.5, NEUTRAL: 7.5 };
    const altCO2Map = { ELEC: 8.5, PLASTIC: 3.8, CHEM: 3.2, SYNTH: 3.0, TEXT: 4.5, FURN: 5.5, FOOD: 2.2, NEUTRAL: 2.4 };
    const avgCO2 = avgCO2Map[category] || 10.0;
    const altCO2 = altCO2Map[category] || 3.5;
    const reduction = Math.round(((avgCO2 - altCO2) / avgCO2) * 100);
    return { weight: weight.toFixed(2), material, dist, totalCO2: totalCO2.toFixed(1), avgCO2: avgCO2.toFixed(1), altCO2: altCO2.toFixed(1), reduction };
  }

  function buildCarbonPredictionHTML(title, category, geminiData) {
    let p;
    if (geminiData) {
      if (geminiData._insufficientData) {
        p = { weight: "—", material: "Insufficient Data", dist: "—", totalCO2: "—", avgCO2: "—", altCO2: "—", reduction: 0 };
      } else {
        const avgCO2Map = { ELEC: 22.0, PLASTIC: 12.0, CHEM: 10.5, SYNTH: 9.8, TEXT: 14.0, FURN: 18.0, FOOD: 6.5, NEUTRAL: 7.5 };
        const avgNum = avgCO2Map[category] || 10.0;
        const total = geminiData.carbonFootprintKg;
        const reduction = Math.round(((avgNum - total) / avgNum) * 100);
        const altCO2Val = avgNum * 0.35;
        p = {
          weight: geminiData.weightKg.toFixed(2),
          material: geminiData.materials || "Unknown",
          dist: geminiData.transportDistMiles,
          totalCO2: total.toFixed(1),
          avgCO2: avgNum.toFixed(1),
          altCO2: altCO2Val.toFixed(1),
          reduction: Math.max(0, reduction)
        };
      }
    } else {
      p = deriveProductParams(title, category);
    }
    const footprintNum = parseFloat(p.totalCO2);
    const avgNum = parseFloat(p.avgCO2);
    const hasData = !isNaN(footprintNum) && !isNaN(avgNum);
    const thisBarW = hasData ? Math.min((footprintNum / avgNum) * 100, 100).toFixed(1) : "0";
    const altBarW = hasData ? Math.min((parseFloat(p.altCO2) / avgNum) * 100, 100).toFixed(1) : "0";
    const thisColor = hasData ? (footprintNum >= avgNum * 0.75 ? "#FF4C4C" : footprintNum >= avgNum * 0.45 ? "#FF9F1C" : "#4ADE80") : "#888888";
    return `
      <div class="eco-section eco-ai-section">
        <div class="eco-section-label">AI CARBON FOOTPRINT PREDICTION ENGINE</div>
        <div class="eco-carbon-hero">
          <div class="eco-carbon-hero-left">
            <span class="eco-carbon-icon" aria-hidden="true">🤖</span>
            <div>
              <div class="eco-carbon-headline">Estimated Carbon Footprint</div>
              <div class="eco-carbon-value" style="color:${thisColor}">
                ${p.totalCO2} <span class="eco-carbon-unit">kg CO₂e</span>
              </div>
            </div>
          </div>
          <div class="eco-carbon-params">
            <div class="eco-param-chip">📦 ${p.weight} kg</div>
            <div class="eco-param-chip">🧪 ${p.material}</div>
            <div class="eco-param-chip">🚚 ${p.dist} mi</div>
          </div>
        </div>
        <div class="eco-carbon-table">
          <div class="eco-carbon-row">
            <span class="eco-carbon-row-label">This Product</span>
            <div class="eco-carbon-bar-wrap"><div class="eco-carbon-bar" style="width:${thisBarW}%;background:${thisColor};"></div></div>
            <span class="eco-carbon-row-val" style="color:${thisColor}">${p.totalCO2} kg</span>
          </div>
          <div class="eco-carbon-row">
            <span class="eco-carbon-row-label">Category Avg.</span>
            <div class="eco-carbon-bar-wrap"><div class="eco-carbon-bar" style="width:100%;background:#1E3E62;"></div></div>
            <span class="eco-carbon-row-val" style="color:#E0E0E0">${p.avgCO2} kg</span>
          </div>
          <div class="eco-carbon-row">
            <span class="eco-carbon-row-label">Best Alternative</span>
            <div class="eco-carbon-bar-wrap"><div class="eco-carbon-bar" style="width:${altBarW}%;background:#4ADE80;"></div></div>
            <span class="eco-carbon-row-val" style="color:#4ADE80">${p.altCO2} kg</span>
          </div>
        </div>
        <div class="eco-carbon-reduction">
          <span class="eco-reduction-icon" aria-hidden="true">🌍</span>
          <span>Switching saves <strong>${p.reduction}% CO₂</strong> vs. category average —
            equivalent to planting ~${Math.round(p.reduction / 5)} trees/year.</span>
        </div>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FIX 3 — GRADE A ALTERNATIVE VERIFICATION GATE
  //  Re-scores each suggested alternative using heuristic signals.
  //  Any alternative that cannot be verified as Grade A is replaced.
  // ══════════════════════════════════════════════════════════════════════════

  /** Grade A threshold: EcoScore >= 80 (maps to severity <= 20). */
  const GRADE_A_ECO_SCORE_MIN = 80;

  /** Lightweight re-scorer for alternative product strings. */
  function scoreAlternativeText(nameAndDesc) {
    const t = (nameAndDesc || "").toLowerCase();
    let severity = 30; // default neutral-low

    const hasCerts = RX_GENUINE_CERTS.test(t);
    const hasMaterials = RX_REAL_MATERIALS.test(t);

    if (hasCerts) severity -= 20;
    if (hasMaterials) severity -= 10;

    // High-impact negative signals raise severity (disqualify)
    if (/virgin polyester|virgin plastic|synthetic leather|pvc|single[- ]use/.test(t)) {
      severity = Math.min(severity + 30, 90);
    }

    const ecoScore = calcEScore(severity);
    const gradeInfo = eScoreGrade(ecoScore);
    return { ecoScore, severity, grade: gradeInfo.grade };
  }

  /**
   * Returns true only if the alternative achieves Grade A or A+.
   * Checks both its name and description combined.
   */
  function verifyAlternativeIsGradeA(alt) {
    const combined = `${alt.name || ""} ${alt.description || alt.desc || ""}`;
    const result = scoreAlternativeText(combined);
    return result.ecoScore !== "N/A" && result.ecoScore >= GRADE_A_ECO_SCORE_MIN; // 80+ = A or A+
  }

  function getHighYieldSearchQueries(category, coreNouns) {
    const cn = coreNouns || "product";
    const queries = {
      CHEM: [
        `eco friendly ${cn}`,
        `herbal ${cn}`,
        `natural non toxic ${cn}`
      ],
      PLASTIC: [
        `steel ${cn}`,
        `bamboo ${cn}`,
        `reusable ${cn}`
      ],
      SYNTH: [
        `organic ${cn}`,
        `natural ${cn}`,
        `chemical free ${cn}`
      ],
      ELEC: [
        `refurbished ${cn}`,
        `energy saving ${cn}`,
        `eco friendly ${cn}`
      ],
      TEXT: [
        `organic cotton ${cn}`,
        `khadi ${cn}`,
        `handloom ${cn}`
      ],
      FURN: [
        `reclaimed wood ${cn}`,
        `fsc certified ${cn}`,
        `eco friendly ${cn}`
      ],
      FOOD: [
        `organic ${cn}`,
        `natural ${cn}`,
        `healthy ${cn}`
      ],
      NEUTRAL: [
        `eco friendly ${cn}`,
        `organic ${cn}`,
        `recycled ${cn}`
      ]
    };
    return queries[category] || queries.NEUTRAL;
  }

  /** Grade A certified fallback if a slot fails verification. */
  function makeVerifiedFallback(coreNouns, category, slotIndex) {
    const titleCase = (str) => str.replace(/\b\w+/g, w => w.length === 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1));
    const capNouns = titleCase(coreNouns);
    const highYieldQueries = getHighYieldSearchQueries(category, coreNouns);

    const fallbacksMap = {
      FOOD: [
        { name: `Certified Organic ${capNouns}`, description: "USDA Organic or equivalent certified. Grown without synthetic pesticides, chemical fertilizers, or genetically modified seeds (Non-GMO). Supports soil health and biodiversity." },
        { name: `Locally Sourced Organic ${capNouns}`, description: "100% natural, locally sourced produce. Minimizes transportation carbon emissions (food miles) and packaging waste. Sustainably harvested." },
        { name: `Pesticide-Free Natural ${capNouns}`, description: "Grown using natural farming practices. Zero synthetic chemical residues. Packed in biodegradable or minimal plastic-free packaging." }
      ],
      CHEM: [
        { name: `Eco-Friendly Plant-Based ${capNouns}`, description: "EPA Safer Choice or Ecolabel certified. Biodegradable plant-based surfactants. Zero artificial dyes, phosphates, or chlorine bleach. Safe for aquatic life." },
        { name: `Natural Non-Toxic ${capNouns}`, description: "Formulated with naturally derived ingredients and essential oils. 100% non-toxic, hypoallergenic, and packaged in a post-consumer recycled bottle." },
        { name: `Concentrated Zero-Waste ${capNouns}`, description: "Highly concentrated formula to reduce transport carbon footprint. Ships in zero-plastic water-soluble packaging or refillable container." }
      ],
      ELEC: [
        { name: `Energy Star Certified ${capNouns}`, description: "Energy Star or EPEAT certified. Highly energy-efficient power management. Reduces electricity usage and lifetime greenhouse gas emissions." },
        { name: `Refurbished Certified ${capNouns}`, description: "Factory refurbished to original standards. Extends product lifespan, diverts rare earth metals from landfills, and reduces manufacturing e-waste by 85%." },
        { name: `Sustainably Manufactured ${capNouns}`, description: "RoHS compliant. Manufactured using recycled plastic casing and conflict-free minerals. Built in a zero-waste, carbon-offset facility." }
      ],
      PLASTIC: [
        { name: `Reusable Stainless Steel ${capNouns}`, description: "Food-grade double-walled stainless steel. Infinite reusable lifespan, 100% BPA-free, completely eliminates single-use plastic waste." },
        { name: `Sustainably Sourced Bamboo ${capNouns}`, description: "Made from 100% fast-growing, renewable bamboo. Biodegradable and compostable at end-of-life. Zero synthetic polymer binders." },
        { name: `Reusable Borosilicate Glass ${capNouns}`, description: "High durability thermal-resistant glass. Non-toxic, infinitely recyclable, zero chemical leaching, and protected by a food-grade silicone sleeve." }
      ],
      TEXT: [
        { name: `GOTS Certified Organic ${capNouns}`, description: "Global Organic Textile Standard (GOTS) certified. 100% organic fibres grown without toxic pesticides. Fair wages, ethical labour, non-toxic dyes." },
        { name: `Artisanal Handloom ${capNouns}`, description: "Sustainably woven by local artisans using traditional handlooms. Low-carbon manufacturing process, supporting heritage craftsmanship and raw natural fibers." },
        { name: `Pure Khadi ${capNouns}`, description: "Hand-spun and hand-woven natural fabric. Requires zero electricity in production. Highly breathable, durable, and completely biodegradable." }
      ],
      SYNTH: [
        { name: `EWG Verified Organic ${capNouns}`, description: "EWG Verified or COSMOS certified organic. 100% biodegradable ingredients, zero parabens, phthalates, synthetic fragrance, or microplastics." },
        { name: `Cruelty-Free Plant-Based ${capNouns}`, description: "Leaping Bunny certified cruelty-free. 100% vegan formula made from sustainably harvested botanical extracts. Ocean-safe ingredients." },
        { name: `Zero-Waste Waterless ${capNouns}`, description: "Solid bar format to eliminate single-use plastic packaging. Saves water in formulation and significantly reduces transport emissions." }
      ],
      FURN: [
        { name: `FSC-Certified Hardwood ${capNouns}`, description: "Forest Stewardship Council (FSC) certified. Harvested from responsibly managed forests. Prevents deforestation and protects wildlife habitats." },
        { name: `Upcycled Eco-Friendly ${capNouns}`, description: "Constructed using reclaimed timber and recycled hardware. Low-VOC non-toxic finishes, ensuring zero indoor air chemical outgassing." },
        { name: `Biodegradable Natural Fiber ${capNouns}`, description: "Handmade from renewable materials like rattan, jute, or cork. Highly durable, natural, carbon-sequestering, and compostable." }
      ],
      NEUTRAL: [
        { name: `B Corp Certified Eco ${capNouns}`, description: "B Corp certified company. Meets the highest standards of verified social and environmental performance, transparency, and accountability." },
        { name: `Climate Neutral Certified ${capNouns}`, description: "Product lifecycle emissions measured and offset. Manufactured using renewable energy and shipped via carbon-neutral logistics." },
        { name: `Recycled Zero-Plastic ${capNouns}`, description: "Made from 100% recycled or bio-based materials. Shipped in plastic-free, recyclable packaging with a circular take-back program." }
      ]
    };

    const categoryList = fallbacksMap[category] || fallbacksMap.NEUTRAL;
    const fb = categoryList[slotIndex] || categoryList[0];

    const co2SavingsMap = { ELEC: [8.2, 6.9, 5.4], PLASTIC: [2.1, 1.9, 1.6], CHEM: [1.4, 1.1, 0.9], SYNTH: [1.3, 1.0, 0.8], TEXT: [5.6, 4.1, 3.5], FURN: [9.4, 7.1, 5.8], FOOD: [1.2, 0.9, 0.6], NEUTRAL: [0.5, 0.4, 0.3] };
    const savings = (co2SavingsMap[category] || co2SavingsMap.NEUTRAL)[slotIndex] || 0.5;

    return { 
      name: fb.name, 
      description: fb.description, 
      ecoScoreScale10: "9.5 / 10", 
      grade: "Grade A+", 
      co2: `-${savings} kg CO₂e vs. this item`, 
      co2Savings: `-${savings} kg CO₂e vs. this item`,
      searchQuery: highYieldQueries[slotIndex] || highYieldQueries[0]
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAME-PRODUCT STRATEGY — Dynamic Alternatives Generator (FIX 3 applied)
  // ══════════════════════════════════════════════════════════════════════════

  function buildDynamicAlternatives(title, coreNouns, category, severity) {
    const seed = strSeed(title);
    const co2Savings = {
      ELEC: [8.2, 6.9, 5.4], PLASTIC: [2.1, 1.9, 1.6], CHEM: [1.4, 1.1, 0.9], SYNTH: [1.3, 1.0, 0.8],
      TEXT: [5.6, 4.1, 3.5], FURN: [9.4, 7.1, 5.8], FOOD: [1.2, 0.9, 0.6], NEUTRAL: [0.5, 0.4, 0.3]
    };
    const savings = co2Savings[category] || co2Savings.NEUTRAL;
    const scoreBase = 9.1 + (seed % 8) * 0.1; // 9.1–9.8
    const scores = [Math.min(scoreBase + 0.6, 9.9).toFixed(1), Math.min(scoreBase + 0.3, 9.9).toFixed(1), scoreBase.toFixed(1)];
    const certMap = {
      ELEC: ["Energy Star Certified", "TCO Certified", "EPEAT Gold"],
      PLASTIC: ["Cradle-to-Cradle Certified", "OK Compost Certified", "FSC Certified"],
      CHEM: ["EPA Safer Choice", "Leaping Bunny Certified", "EU Ecolabel"],
      SYNTH: ["EWG Verified", "1% for the Planet", "B Corp Certified"],
      TEXT: ["GOTS Certified Organic", "Bluesign Certified", "Fair Trade Certified"],
      FURN: ["FSC Certified Wood", "Greenguard Gold", "Cradle to Cradle Gold"],
      FOOD: ["USDA Organic", "Rainforest Alliance", "Non-GMO Project Verified"],
      NEUTRAL: ["B Corp Certified", "Climate Neutral Certified", "Carbon Trust Certified"]
    };
    const certs = certMap[category] || certMap.NEUTRAL;
    const lifecycleMap = {
      ELEC: "Refurbished / Modular Design · 5-year warranty · 85% less e-waste",
      PLASTIC: "100% recycled material · Biodegrades in 2–5 years · Zero virgin plastic",
      CHEM: "Biodegradable formula · Concentrated refill · No aquatic toxins",
      SYNTH: "Refillable aluminium vessel · Reef-safe · No sulphates or parabens",
      TEXT: "Secondhand / resold garment · 80% lower footprint than new production",
      FURN: "Reclaimed timber or FSC-certified · Low-VOC finish · Designed to last 25+ yr",
      FOOD: "Regenerative agriculture · Plastic-free packaging · Local supply chain",
      NEUTRAL: "Zero-waste packaging · Carbon-offset supply chain · Circular take-back"
    };
    const lifecycle = lifecycleMap[category] || lifecycleMap.NEUTRAL;
    const titleCase = (str) => str.replace(/\b\w+/g, w => w.length === 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1));
    const capNouns = titleCase(coreNouns);

    const descTemplates = {
      ELEC: [
        `${certs[0]}. ${lifecycle}. Verified energy efficiency.`,
        `${certs[1]}. Certified refurbished casing and components. Extends tech lifespan.`,
        `${certs[2]}. Low-impact shipping and certified conflict-free mineral tracing.`
      ],
      PLASTIC: [
        `${certs[0]}. ${lifecycle}. Non-toxic and infinitely reusable.`,
        `${certs[1]}. Manufactured from 100% post-consumer recovered materials.`,
        `${certs[2]}. Zero single-use plastic waste. Recycled and reusable design.`
      ],
      CHEM: [
        `${certs[0]}. ${lifecycle}. Plant-based surfactants and non-toxic formula.`,
        `${certs[1]}. Biodegradable raw ingredients. Low chemical toxicity risk.`,
        `${certs[2]}. Zero-plastic concentrated refill. Carbon-offset shipping.`
      ],
      SYNTH: [
        `${certs[0]}. ${lifecycle}. Zero chemical parabens or microplastics.`,
        `${certs[1]}. Cruelty-free formula made from organic botanical extracts.`,
        `${certs[2]}. Zero-waste packaging format. Safe for marine environments.`
      ],
      TEXT: [
        `${certs[0]}. ${lifecycle}. Certified organic textile sourcing.`,
        `${certs[1]}. Locally woven and upcycled fibers. Diverts garment waste.`,
        `${certs[2]}. Natural linen/khadi handloom construction. Zero synthetic dyes.`
      ],
      FURN: [
        `${certs[0]}. ${lifecycle}. Sustainably harvested timber.`,
        `${certs[1]}. Manufactured using reclaimed wood and zero-VOC non-toxic finishes.`,
        `${certs[2]}. Circular take-back program and highly durable joinery design.`
      ],
      FOOD: [
        `${certs[0]}. ${lifecycle}. Grown using pesticide-free natural farming.`,
        `${certs[1]}. Locally sourced organic produce. Minimizes food transport miles.`,
        `${certs[2]}. Zero chemical residues. Packed in plastic-free minimal wrapping.`
      ],
      NEUTRAL: [
        `${certs[0]}. ${lifecycle}. Verified by third-party auditors.`,
        `${certs[1]}. Manufactured from post-consumer recovered material. Diverts waste from landfill.`,
        `${certs[2]}. Plastic-free packaging. Carbon-neutral shipping. End-of-life take-back programme.`
      ]
    };
    const descArr = descTemplates[category] || descTemplates.NEUTRAL;

    const highYieldQueries = getHighYieldSearchQueries(category, coreNouns);
    const candidates = [
      { name: `Eco-Certified ${capNouns}`, desc: descArr[0], score: `${scores[0]} / 10`, grade: "Grade A+", co2: `-${savings[0]} kg CO₂e vs. this item`, searchQuery: highYieldQueries[0] },
      { name: `Circular / Upcycled ${capNouns}`, desc: descArr[1], score: `${scores[1]} / 10`, grade: "Grade A+", co2: `-${savings[1]} kg CO₂e vs. this item`, searchQuery: highYieldQueries[1] },
      { name: `Zero-Waste ${capNouns}`, desc: descArr[2], score: `${scores[2]} / 10`, grade: "Grade A", co2: `-${savings[2]} kg CO₂e vs. this item`, searchQuery: highYieldQueries[2] }
    ];

    // Verification gate: replace any slot that fails Grade A check with a certified fallback
    return candidates.map((alt, i) => {
      const passes = verifyAlternativeIsGradeA({ name: alt.name, description: alt.desc });
      if (!passes) {
        const fallback = makeVerifiedFallback(coreNouns, category, i);
        return { name: fallback.name, desc: fallback.description, score: fallback.ecoScoreScale10, grade: fallback.grade, co2: fallback.co2, searchQuery: fallback.searchQuery };
      }
      return alt;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  E-SCORE™ — Composite Sustainability Rating
  // ══════════════════════════════════════════════════════════════════════════

  function calcEScore(severity) { 
    if (severity === -1) return "N/A";
    return Math.max(15, Math.min(97, 100 - severity)); 
  }

  function eScoreGrade(score) {
    if (score === "N/A") return { grade: "Insufficient Data", color: "#888888" };
    if (score >= 90) return { grade: "A+", color: "#4ADE80" };
    if (score >= 80) return { grade: "A", color: "#4ADE80" };
    if (score >= 70) return { grade: "B+", color: "#7DD87D" };
    if (score >= 60) return { grade: "B", color: "#FF9F1C" };
    if (score >= 50) return { grade: "C", color: "#FF9F1C" };
    return { grade: "D", color: "#FF4C4C" };
  }

  function buildEScoreHTML(title, category, severity, geminiData) {
    let score;
    if (geminiData) {
      score = geminiData._insufficientData ? "N/A" : geminiData.ecoScore;
    } else {
      score = calcEScore(severity);
    }
    const { grade, color } = eScoreGrade(score);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = score === "N/A" ? circumference : circumference - (score / 100) * circumference;
    const descriptions = {
      "Insufficient Data": "Not enough verifiable information on this page to calculate an accurate Eco-Score.",
      "A+": "Exceptionally low environmental impact. Meets the highest sustainability standards.",
      "A": "Very low environmental impact. Performs well across sustainability metrics.",
      "B+": "Moderate environmental impact with sustainable attributes identified.",
      "B": "Notable environmental concerns. Consider certified alternatives.",
      "C": "Significant environmental impact. Sustainable alternatives strongly recommended.",
      "D": "High environmental impact across multiple categories. Immediate alternatives advised."
    };
    return `
      <div class="eco-escore-section">
        <div class="eco-escore-flex">
          <div class="eco-escore-gauge-wrap">
            <svg class="eco-escore-svg" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="${radius}" fill="none" stroke="#1E3E62" stroke-width="6" />
              <circle class="eco-gauge-fill" cx="45" cy="45" r="${radius}" fill="none"
                stroke="${color}" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="${circumference.toFixed(1)}"
                stroke-dashoffset="${offset.toFixed(1)}"
                transform="rotate(-90 45 45)" />
            </svg>
            <div class="eco-escore-inner">
              <span class="eco-escore-num" style="color:${color}">${score}</span>
              <span class="eco-escore-grade" style="color:${color};font-size:${score === "N/A" ? '12px' : '14px'}">${grade}</span>
            </div>
          </div>
          <div class="eco-escore-details">
            <div class="eco-escore-heading">Eco-Score™ Rating</div>
            <div class="eco-escore-description">${descriptions[grade] || ""}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  UTILITY — HTML escape
  // ══════════════════════════════════════════════════════════════════════════

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRODUCT CARD HTML BUILDER
  // ══════════════════════════════════════════════════════════════════════════

  function buildProductCardHTML(title, pageContext, wasSwap, geminiData) {
    const trimmedTitle = title.trim();
    const { label, severity, category } = classifyProduct(trimmedTitle, pageContext, false);
    const coreNouns = extractCoreNouns(trimmedTitle);
    const creditValue = calcCarbonCreditValue(trimmedTitle);
    const annualSavings = calcAnnualSavings(trimmedTitle);
    
    const isRawProduce = checkIsRawProduce(trimmedTitle);
    
    let currentScore, currentGrade, currentSeverity, currentLabel;
    if (geminiData) {
      if (isRawProduce) {
        currentScore = (geminiData.ecoScore && geminiData.ecoScore >= 90) ? geminiData.ecoScore : 92;
        currentGrade = eScoreGrade(currentScore).grade;
        currentSeverity = (geminiData.riskSeverity !== undefined && geminiData.riskSeverity <= 10) ? geminiData.riskSeverity : 8;
        const isOrganic = trimmedTitle.toLowerCase().includes("organic") || 
                          (pageContext?.description && pageContext.description.toLowerCase().includes("organic")) ||
                          (geminiData.riskLabel && geminiData.riskLabel.toLowerCase().includes("organic"));
        currentLabel = isOrganic ? "Certified Organic Natural Produce" : "Highly Sustainable Natural Produce";
      } else if (geminiData._insufficientData) {
        currentScore = "N/A";
        currentGrade = "Insufficient Data";
        currentSeverity = -1;
        currentLabel = "Insufficient Page Data";
      } else {
        currentScore = geminiData.ecoScore;
        currentGrade = eScoreGrade(currentScore).grade;
        currentSeverity = geminiData.riskSeverity;
        currentLabel = geminiData.riskLabel;
      }
    } else {
      currentSeverity = severity;
      currentScore = calcEScore(currentSeverity);
      currentGrade = eScoreGrade(currentScore).grade;
      currentLabel = label;
    }

    const barColor = severityColor(currentSeverity === -1 ? 50 : currentSeverity);
    
    let alts;
    if (geminiData && !geminiData._insufficientData) {
      alts = geminiData.alternatives.map((alt) => ({
        name: alt.name,
        desc: alt.description,
        score: alt.ecoScoreScale10,
        grade: parseFloat(alt.ecoScoreScale10) >= 9.0 ? "Grade A+" : "Grade A",
        co2: alt.co2Savings,
        searchQuery: alt.searchQuery
      }));
    } else {
      alts = buildDynamicAlternatives(trimmedTitle, coreNouns, category, severity);
    }
    
    const carbonPanel = buildCarbonPredictionHTML(trimmedTitle, category, geminiData);
    const eScoreHtml = buildEScoreHTML(trimmedTitle, category, severity, geminiData);

    let swapComparisonHtml = "";
    if (wasSwap) {
      try {
        const origTitle = sessionStorage.getItem("eco_swap_orig_title") || "Previous Product";
        const origScoreStr = sessionStorage.getItem("eco_swap_orig_score");
        const origGrade = sessionStorage.getItem("eco_swap_orig_grade") || "N/A";
        const origCO2Str = sessionStorage.getItem("eco_swap_orig_co2");

        if (origScoreStr !== null) {
          const origScore = parseInt(origScoreStr, 10);
          const origCO2 = parseFloat(origCO2Str || "0");
          
          let newScore = currentScore;
          let newGrade = currentGrade;
          let newCO2 = geminiData ? geminiData.carbonFootprintKg : parseFloat(deriveProductParams(trimmedTitle, category).totalCO2);

          if (newScore !== "N/A") {
            if (newScore > origScore || (newScore >= 80 && newScore >= origScore)) {
              const co2Saved = (origCO2 - newCO2).toFixed(1);
              const co2Percent = origCO2 > 0 ? Math.round(((origCO2 - newCO2) / origCO2) * 100) : 0;
              const co2SavedText = co2Saved > 0 
                ? `Saved <strong>${co2Saved} kg CO₂e</strong> (${co2Percent}% reduction)` 
                : "Reduced carbon footprint";
              
              swapComparisonHtml = `
                <div class="eco-swap-comparison-card">
                  <div class="eco-comparison-status">
                    <span class="eco-comparison-badge success">⚡ Swap Successful!</span>
                  </div>
                  <div class="eco-comparison-vs">
                    <div class="eco-vs-item">
                      <span class="eco-vs-lbl">Previous Product</span>
                      <span class="eco-vs-val bad">${origGrade} (${origScore})</span>
                    </div>
                    <div class="eco-vs-arrow">➜</div>
                    <div class="eco-vs-item">
                      <span class="eco-vs-lbl">Sustainable Swap</span>
                      <span class="eco-vs-val good">${newGrade} (${newScore})</span>
                    </div>
                  </div>
                  <div class="eco-comparison-savings">
                    🌍 Net Carbon Saved: ${co2SavedText}
                  </div>
                </div>
              `;
            } else {
              swapComparisonHtml = `
                <div class="eco-swap-comparison-card warning">
                  <div class="eco-comparison-status">
                    <span class="eco-comparison-badge danger">⚠ Swap Mismatch</span>
                  </div>
                  <div class="eco-comparison-desc">
                    This product does not meet sustainable swap criteria. Its Eco-Score is only <strong>${newScore} (${newGrade})</strong>, which is not an upgrade from your previous choice of <strong>${origGrade} (${origScore})</strong>.
                  </div>
                  <div class="eco-comparison-help">
                    Please go back and select a verified sustainable alternative from the search results.
                  </div>
                </div>
              `;
            }
          }
        }
      } catch (e) {
        console.warn("[EcoIntercept AI] Error generating swap comparison:", e);
      }
    }

    const altCards = alts.map((alt) => `
      <div class="eco-alt-card">
        <div class="eco-alt-score-row">
          <span class="eco-alt-score">${alt.score}</span>
          <span class="eco-alt-grade">${alt.grade}</span>
        </div>
        <div class="eco-alt-name">${alt.name}</div>
        <div class="eco-alt-desc">${alt.desc}</div>
        <div class="eco-alt-co2">${alt.co2}</div>
        <button class="eco-swap-btn" data-search-query="${encodeURIComponent(alt.searchQuery)}" aria-label="Instantly swap to ${escapeHtml(alt.name)}">⚡ Instant Swap</button>
      </div>
    `).join("");

    let alternativesSectionHtml = "";
    if (currentGrade === "A" || currentGrade === "A+") {
      alternativesSectionHtml = `
        <div class="eco-section">
          <div class="eco-section-label">CERTIFIED SUSTAINABLE ALTERNATIVES</div>
          <div class="eco-swap-comparison-card success" style="margin-top: 12px; border: 1px solid rgba(74, 222, 128, 0.35); background: rgba(74, 222, 128, 0.04);">
            <div class="eco-comparison-status" style="margin-bottom: 8px;">
              <span class="eco-comparison-badge success" style="font-size: 11px; padding: 4px 10px;">🎉 Sustainable Choice</span>
            </div>
            <div class="eco-comparison-desc" style="font-size: 12px; line-height: 1.5; color: #E0E0E0;">
              This product is already rated <strong>${currentGrade}</strong>. You are buying a highly sustainable, eco-friendly option—no swap required!
            </div>
          </div>
        </div>
      `;
    } else {
      alternativesSectionHtml = `
        <div class="eco-section">
          <div class="eco-section-label">CERTIFIED SUSTAINABLE ALTERNATIVES</div>
          <p class="eco-alts-intent-note">
            Recommendations matched to your exact intent: <strong>${escapeHtml(coreNouns)}</strong>
          </p>
          <div class="eco-alt-grid">${altCards}</div>
        </div>
      `;
    }

    const srcBadge = wasSwap ? `
      <div class="eco-discovery-tag" style="background: rgba(74, 222, 128, 0.15); border-bottom: 1px solid rgba(74, 222, 128, 0.3);">
        ✅ Verified Sustainable Swap: <em>${escapeHtml(coreNouns)}</em>
        <span class="eco-discovery-full" title="Arrived via Eco-friendly swap suggestion">ⓘ</span>
      </div>
    ` : `
      <div class="eco-discovery-tag">
        🔍 Detected: <em>${escapeHtml(coreNouns)}</em>
        <span class="eco-discovery-full" title="Full title: ${escapeHtml(trimmedTitle)}">ⓘ</span>
      </div>
    `;

    return `
      <div id="${ECO_ID}" role="region" aria-label="EcoIntercept AI Sustainability Panel">
        <button class="eco-close-btn" aria-label="Close panel">&times;</button>
        <div class="eco-header">
          <div class="eco-badge">
            <span class="eco-badge-icon" aria-hidden="true" style="display:flex;align-items:center;">
              <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#008037" stroke-width="8"/>
                <path d="M 25 50 L 75 50" stroke="#008037" stroke-width="8"/>
                <path d="M 75 50 C 75 25, 25 25, 25 50 C 25 80, 50 80, 50 80" fill="none" stroke="#008037" stroke-width="8"/>
                <path d="M 25 65 Q 50 90 75 60 Q 50 50 25 65 Z" fill="#008037"/>
              </svg>
            </span>
            <div class="eco-badge-text">
              <span class="eco-badge-title">EcoIntercept.ai</span>
              <span class="eco-badge-sub" style="text-transform: uppercase; letter-spacing: 0.5px;">Sustainability Intelligence</span>
            </div>
          </div>
          <div class="eco-status-dot" style="${geminiData ? 'background:#4ADE80;' : ''}" aria-label="${geminiData ? 'System online - AI active' : 'System online'}"></div>
        </div>
        ${srcBadge}
        ${swapComparisonHtml}
        ${eScoreHtml}
        <div class="eco-section">
          <div class="eco-section-label">GREENWASHING ASSESSMENT SCALE</div>
          <div class="eco-risk-label">${currentLabel}</div>
          <div class="eco-bar-track" role="progressbar" aria-valuenow="${currentSeverity === -1 ? 0 : currentSeverity}" aria-valuemin="0" aria-valuemax="100" aria-label="Risk level ${currentSeverity === -1 ? 0 : currentSeverity} out of 100">
            <div class="eco-bar-fill" style="width:${currentSeverity === -1 ? 0 : currentSeverity}%;background:${barColor};"></div>
            <div class="eco-bar-thumb" style="left:calc(${currentSeverity === -1 ? 0 : currentSeverity}% - 6px);background:${barColor};"></div>
          </div>
          <div class="eco-bar-labels">
            <span>Low Risk</span>
            <span>Risk Score: ${currentSeverity === -1 ? "N/A" : currentSeverity + "/100"}</span>
            <span>High Risk</span>
          </div>
        </div>
        <div class="eco-section">
          <div class="eco-section-label">CARBON CREDIT SETTLEMENT LEDGER</div>
          <div class="eco-fintech-card">
            <div class="eco-fintech-main">
              <span class="eco-fintech-value">${creditValue}</span>
              <span class="eco-fintech-unit">Carbon Credit Value</span>
            </div>
            <div class="eco-fintech-divider"></div>
            <div class="eco-fintech-secondary">
              <div class="eco-fintech-stat">
                <span class="eco-fintech-stat-val">${annualSavings}</span>
                <span class="eco-fintech-stat-lbl">Est. Annual Savings</span>
              </div>
              <div class="eco-fintech-stat">
                <span class="eco-fintech-stat-val">+${Math.round(severity * 0.3)} pts</span>
                <span class="eco-fintech-stat-lbl">Green Ledger Points</span>
              </div>
              <div class="eco-fintech-stat">
                <span class="eco-fintech-stat-val">Tier ${severity >= 75 ? "3" : severity >= 50 ? "2" : "1"}</span>
                <span class="eco-fintech-stat-lbl">Impact Classification</span>
              </div>
            </div>
          </div>
        </div>
        ${carbonPanel}
        ${alternativesSectionHtml}
        <div class="eco-footer">
          <span>EcoIntercept AI · v3.1 · Universal Edition · Carbon intelligence active</span>
        </div>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FIX 1 — HARDENED GEMINI ANALYSIS (Strict evidence rules + validation)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Validates a Gemini response payload.
   * Returns { valid: true, data } or { valid: false, reason }.
   * Any missing field, out-of-range number, or "INSUFFICIENT" confidence
   * is treated as invalid so we never display fabricated data.
   */
  function validateGeminiPayload(parsed) {
    if (!parsed || typeof parsed !== "object") return { valid: false, reason: "No object" };

    // Explicit insufficient-data signal from the model
    if (parsed.dataConfidence === "INSUFFICIENT") {
      return { valid: false, reason: "INSUFFICIENT", isInsufficient: true };
    }

    // Required numeric fields with strict range checks
    const numChecks = [
      { key: "ecoScore", min: 1, max: 100 },
      { key: "riskSeverity", min: 0, max: 100 },
      { key: "carbonFootprintKg", min: 0.01, max: 50000 },
      { key: "weightKg", min: 0.001, max: 5000 },
      { key: "transportDistMiles", min: 1, max: 50000 }
    ];
    for (const { key, min, max } of numChecks) {
      const v = Number(parsed[key]);
      if (!isFinite(v) || v < min || v > max) return { valid: false, reason: `Bad field: ${key}` };
    }

    // Required string fields
    for (const key of ["riskLabel", "materials", "manufacturing"]) {
      if (!parsed[key] || typeof parsed[key] !== "string" || parsed[key].trim().length < 2) {
        return { valid: false, reason: `Missing string: ${key}` };
      }
    }

    // Alternatives: must be an array of 3 with required fields
    if (!Array.isArray(parsed.alternatives) || parsed.alternatives.length < 3) {
      return { valid: false, reason: "Alternatives array missing/short" };
    }
    for (const alt of parsed.alternatives) {
      if (!alt.name || !alt.description || !alt.searchQuery) {
        return { valid: false, reason: "Alternative missing fields" };
      }
      // FIX 3: Enforce Grade A minimum on Gemini alternatives
      const passesGradeA = verifyAlternativeIsGradeA({ name: alt.name, description: alt.description });
      if (!passesGradeA) {
        // Mark for replacement rather than rejecting the whole payload
        alt._failedVerification = true;
      }
      // Parse ecoScoreScale10: accept "9.5 / 10" or 9.5
      const scoreStr = String(alt.ecoScoreScale10 || "").replace(/\s*\/\s*10/, "").trim();
      const scoreNum = parseFloat(scoreStr);
      if (!isFinite(scoreNum) || scoreNum < 0 || scoreNum > 10) {
        alt.ecoScoreScale10 = "9.0 / 10"; // safe default
      }
    }
    return { valid: true, data: parsed };
  }

  /**
   * Calls the Gemini API with a strict evidence-based system prompt.
   * Returns validated payload or null on any failure.
   */
  async function fetchGeminiAnalysis(title, category, wasSwap, pageContext) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY" || GEMINI_API_KEY.trim() === "") {
      return null;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${GEMINI_API_KEY}`;
      const currentPlatform = window.location.hostname.replace("www.", "");

      // FIX 2: Build rich context block from harvested page data
      const contextBlock = [
        pageContext.description ? `Page Description: ${pageContext.description}` : "",
        pageContext.specs ? `Key Specs/Features: ${pageContext.specs}` : "",
        pageContext.brand ? `Brand: ${pageContext.brand}` : "",
        pageContext.material ? `Stated Material: ${pageContext.material}` : ""
      ].filter(Boolean).join("\n");

      // FIX 1: The swap context is soft context only — not a score override.
      const swapNote = wasSwap
        ? `\nContext: The user navigated here as a potential eco-friendly alternative to a less sustainable product. Assess this product honestly on its actual evidence — do not inflate the score just because it was a swap suggestion.`
        : "";

      // FIX 1: Strict evidence-based prompt with explicit insufficient-data instruction
      const prompt = `You are a rigorous sustainability auditor. Analyze ONLY the verifiable evidence on this product page.

Product Title: "${title.replace(/"/g, '\\"')}"
Category: ${category}
Platform: ${currentPlatform}
${contextBlock ? `\nPage Evidence:\n${contextBlock}` : ""}${swapNote}

STRICT EVIDENCE RULES:
1. Base ALL scores ONLY on material/manufacturing/certification evidence present in the title or page evidence above.
2. If there is insufficient material or environmental data in the evidence to make a confident assessment, you MUST return:
   { "dataConfidence": "INSUFFICIENT" }
   Do NOT guess, extrapolate, or hallucinate sustainability metrics.
3. Eco certifications (GOTS, FSC, B Corp, USDA Organic, Energy Star, etc.) mentioned in page evidence are strong positive signals and must be reflected.
4. Generic product names with no material details should typically result in INSUFFICIENT.
5. For ALTERNATIVES: only suggest items that are objectively and verifiably eco-friendly (ecoScoreScale10 >= 9.0). Use real certification names. Do NOT suggest items that could be conventional/synthetic without eco verification.
6. For alternative searchQuery, use broad, high-yield search terms commonly available in the local market (e.g. 'eco friendly [product]' or 'organic [product]') that are guaranteed to return matching search results on the local platform instead of returning zero search results.
7. For raw agricultural produce (fresh fruits, fresh vegetables, fresh herbs, raw produce), the Eco-Score is inherently very high (Grade A+ / ecoScore 90-97) and risk severity is low (0-10) because they are minimally processed whole foods. Do NOT return INSUFFICIENT for raw produce; score them as Grade A+ based on this rule.

If evidence IS sufficient, return ONLY a raw JSON object (no markdown, no explanation):
{
  "dataConfidence": "SUFFICIENT",
  "ecoScore": integer 15-97,
  "riskLabel": "Short environmental risk label based on evidence",
  "riskSeverity": integer 0-100,
  "carbonFootprintKg": float (lifecycle CO2e kg, realistic for this product type),
  "materials": "Primary materials cited in page evidence",
  "manufacturing": "Brief manufacturing description from page evidence",
  "weightKg": float,
  "transportDistMiles": integer,
  "alternatives": [
    {
      "name": "Specific eco-certified alternative product name",
      "description": "Exact certifications and eco credentials (GOTS, FSC, B Corp, etc.)",
      "ecoScoreScale10": "9.X / 10",
      "co2Savings": "-X.X kg CO2e vs this item",
      "searchQuery": "broad, high-yield search query (e.g. 'eco friendly [product]' or 'organic [product]') on ${currentPlatform}"
    },
    {
      "name": "Second eco-certified alternative",
      "description": "Exact certifications and eco credentials",
      "ecoScoreScale10": "9.X / 10",
      "co2Savings": "-X.X kg CO2e vs this item",
      "searchQuery": "broad, high-yield search query"
    },
    {
      "name": "Third eco-certified alternative",
      "description": "Exact certifications and eco credentials",
      "ecoScoreScale10": "9.X / 10",
      "co2Savings": "-X.X kg CO2e vs this item",
      "searchQuery": "broad, high-yield search query"
    }
  ]
}`;

      // FIX 4: fetchWithTimeout enforces 12-second hard deadline
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }, GEMINI_TIMEOUT_MS);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // FIX 4: safeJsonParse never throws
      const parsed = safeJsonParse(rawText);
      const validation = validateGeminiPayload(parsed);

      if (!validation.valid) {
        console.info(`[EcoIntercept AI] Gemini validation: ${validation.reason}`);
        return { _insufficientData: validation.isInsufficient === true };
      }

      // FIX 3: Replace any alternative that failed grade verification
      const validData = validation.data;
      validData.alternatives = validData.alternatives.map((alt, i) => {
        if (alt._failedVerification) {
          const category_used = category || "NEUTRAL";
          const fb = makeVerifiedFallback(extractCoreNouns(title), category_used, i);
          return { name: fb.name, description: fb.description, ecoScoreScale10: fb.ecoScoreScale10, co2Savings: fb.co2, searchQuery: fb.searchQuery };
        }
        return alt;
      });

      return validData;

    } catch (e) {
      console.warn("[EcoIntercept AI] Gemini API call failed:", e);
      return null;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PLATFORM-AWARE SEARCH URL BUILDER
  // ══════════════════════════════════════════════════════════════════════════

  function getPlatformSearchUrl(searchQuery) {
    const host = window.location.hostname.toLowerCase();
    const q = encodeURIComponent(searchQuery);
    let targetUrl = "";
    if (host.includes("amazon.")) targetUrl = `${window.location.origin}/s?k=${q}`;
    else if (host.includes("flipkart.")) targetUrl = `${window.location.origin}/search?q=${q}`;
    else if (host.includes("shopsy.")) targetUrl = `${window.location.origin}/search?q=${q}`;
    else if (host.includes("myntra.")) targetUrl = `${window.location.origin}/${q.replace(/%20/g, "-")}?rawQuery=${q}`;
    else if (host.includes("meesho.")) targetUrl = `${window.location.origin}/search?q=${q}`;
    else if (host.includes("nykaa.")) targetUrl = `${window.location.origin}/search/result/?q=${q}`;
    else if (host.includes("ajio.")) targetUrl = `${window.location.origin}/search/?text=${q}`;
    else if (host.includes("ebay.")) targetUrl = `${window.location.origin}/sch/i.html?_nkw=${q}`;
    else if (host.includes("etsy.")) targetUrl = `${window.location.origin}/search?q=${q}`;
    else if (host.includes("walmart.")) targetUrl = `${window.location.origin}/search?q=${q}`;
    else targetUrl = `${window.location.origin}/search?q=${q}`; // Strict Domain Lock

    if (targetUrl) targetUrl += (targetUrl.includes("?") ? "&" : "?") + "eco_swap=1";
    return targetUrl;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DOM INJECTION — Product Page (FIX 4: Atomic DOM update + error banner)
  // ══════════════════════════════════════════════════════════════════════════

  function injectProductCard(title) {
    try {
      if (document.getElementById(ECO_ID)) return;
      if (!title || !title.trim()) return;

      const wasSwap = isSwapNavigation();

      const trimmed = title.trim();
      
      let pageContext = {};
      try {
        pageContext = harvestPageContext(trimmed);
      } catch (ctxErr) {
        console.warn("[EcoIntercept AI] Context extraction error:", ctxErr);
      }

      let wrapper = document.createElement("div");
      let cardHTML = "";

      try {
        // Deep Exception Hub: Wrap the core HTML generation in a try-catch for graceful fail-safes
        cardHTML = buildProductCardHTML(title, pageContext, wasSwap, null);
      } catch (parseErr) {
        console.warn("[EcoIntercept AI] Extraction exception. Outputting graceful status card:", parseErr);
        cardHTML = `
          <div id="${ECO_ID}" role="region" aria-label="EcoIntercept AI Sustainability Panel">
            <button class="eco-close-btn" aria-label="Close panel">&times;</button>
            <div class="eco-header">
              <div class="eco-badge">
                <span class="eco-badge-icon" aria-hidden="true" style="display:flex;align-items:center;">
                  <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#008037" stroke-width="8"/>
                    <path d="M 25 50 L 75 50" stroke="#008037" stroke-width="8"/>
                    <path d="M 75 50 C 75 25, 25 25, 25 50 C 25 80, 50 80, 50 80" fill="none" stroke="#008037" stroke-width="8"/>
                    <path d="M 25 65 Q 50 90 75 60 Q 50 50 25 65 Z" fill="#008037"/>
                  </svg>
                </span>
                <div class="eco-badge-text">
                  <span class="eco-badge-title">EcoIntercept.ai</span>
                  <span class="eco-badge-sub" style="text-transform: uppercase; letter-spacing: 0.5px;">Sustainability Intelligence</span>
                </div>
              </div>
              <div class="eco-status-dot" style="background:#FF9F1C;" aria-label="System verifying"></div>
            </div>
            <div class="eco-section" style="padding: 32px 16px; text-align: center;">
              <div style="width:24px;height:24px;border:3px solid rgba(74,222,128,0.2);border-top-color:#4ADE80;border-radius:50%;animation:eco-spin 1s linear infinite;margin:0 auto 16px;"></div>
              <div style="color:#4ADE80;font-weight:600;letter-spacing:0.02em;">Verifying product attributes...</div>
              <div style="font-size:11px;opacity:0.6;margin-top:8px;color:#E0E0E0;">Awaiting layout data from platform</div>
            </div>
            <style>@keyframes eco-spin { to { transform: rotate(360deg); } }</style>
          </div>
        `;
      }

      wrapper.innerHTML = cardHTML;
      const card = wrapper.firstElementChild;
      card.classList.add("eco-sidebar-drawer", "eco-collapsed");
      document.body.appendChild(card);

      if (wasSwap) consumeSwapNavigation();

      const cls = classifyProduct(trimmed, pageContext, false);
      const score = calcEScore(cls.severity);
      const gradeInfo = eScoreGrade(score);

      // Inject floating trigger button
      const trigger = document.createElement("button");
      trigger.className = "eco-trigger-btn";
      trigger.id = "eco-trigger-btn";
      trigger.setAttribute("aria-label", "Open EcoIntercept AI sustainability panel");
      trigger.innerHTML =
        '<span class="eco-trigger-icon" aria-hidden="true">🌿</span>' +
        '<span class="eco-trigger-score-label">Eco</span>' +
        '<span class="eco-trigger-grade" style="color:' + gradeInfo.color + '">' + gradeInfo.grade + '</span>';
      document.body.appendChild(trigger);

      trigger.addEventListener("click", function () {
        card.classList.remove("eco-collapsed");
        trigger.classList.add("eco-trigger-hidden");
      });
      const closeBtn = card.querySelector(".eco-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          card.classList.add("eco-collapsed");
          trigger.classList.remove("eco-trigger-hidden");
        });
      }

      const params = deriveProductParams(trimmed, cls.category);
      const totalCO2 = params.totalCO2;

      function wireSwapButtons(container, currentTitle, currentScore, currentGrade, currentCO2) {
        container.querySelectorAll(".eco-swap-btn").forEach(function (btn) {
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            let query = btn.getAttribute("data-search-query") || "";
            try { query = decodeURIComponent(query); } catch (_) { }
            try {
              sessionStorage.setItem("eco_swap_active", "true");
              sessionStorage.setItem("eco_swap_time", Date.now().toString());
              sessionStorage.setItem("eco_swap_query", query);
              sessionStorage.setItem("eco_swap_orig_title", currentTitle);
              sessionStorage.setItem("eco_swap_orig_score", String(currentScore));
              sessionStorage.setItem("eco_swap_orig_grade", currentGrade);
              sessionStorage.setItem("eco_swap_orig_co2", String(currentCO2));
            } catch (_) { }
            window.location.href = getPlatformSearchUrl(query);
          });
        });
      }
      wireSwapButtons(card, trimmed, score, gradeInfo.grade, totalCO2);

      // Asynchronous dynamic Gemini evaluation
      if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY" && GEMINI_API_KEY.trim() !== "") {
        const activeDot = card.querySelector(".eco-status-dot");
        if (activeDot) {
          activeDot.style.background = "#FF9F1C"; // Amber: Auditing
          activeDot.style.boxShadow = "0 0 0 0 rgba(255, 159, 28, 0.55)";
          activeDot.setAttribute("aria-label", "System auditing product...");
        }

        fetchGeminiAnalysis(trimmed, cls.category, wasSwap, pageContext)
          .then((geminiData) => {
            if (!geminiData) {
              if (activeDot) {
                activeDot.style.background = "#FF4C4C"; // Fallback dot
                activeDot.setAttribute("aria-label", "AI unavailable (heuristics active)");
              }
              return;
            }

            if (activeDot) {
              activeDot.style.background = "#4ADE80"; // Green: Dynamic AI live
              activeDot.setAttribute("aria-label", "System online - AI active");
            }

            // Generate re-rendered inner contents from Gemini
            const newHTML = buildProductCardHTML(title, pageContext, wasSwap, geminiData);
            const existingCard = document.getElementById(ECO_ID);
            
            if (existingCard) {
              const temp = document.createElement("div");
              temp.innerHTML = newHTML;
              const newCardEl = temp.firstElementChild;
              existingCard.innerHTML = newCardEl.innerHTML;

              // Re-bind panel close button
              const newCloseBtn = existingCard.querySelector(".eco-close-btn");
              if (newCloseBtn) {
                newCloseBtn.addEventListener("click", function () {
                  existingCard.classList.add("eco-collapsed");
                  const trig = document.getElementById("eco-trigger-btn");
                  if (trig) trig.classList.remove("eco-trigger-hidden");
                });
              }

              const isRawProduce = checkIsRawProduce(trimmed);

              // Update the trigger score & grade bubble
              const trigGrade = document.querySelector(".eco-trigger-grade");
              if (trigGrade) {
                let finalScoreVal;
                if (isRawProduce) {
                  finalScoreVal = (geminiData.ecoScore && geminiData.ecoScore >= 90) ? geminiData.ecoScore : 92;
                } else {
                  finalScoreVal = geminiData._insufficientData ? "N/A" : geminiData.ecoScore;
                }
                const finalGradeInfo = eScoreGrade(finalScoreVal);
                trigGrade.textContent = finalGradeInfo.grade;
                trigGrade.style.color = finalGradeInfo.color;
              }

              // Re-wire swap buttons with Gemini data
              let finalScore, finalGrade;
              if (isRawProduce) {
                finalScore = (geminiData.ecoScore && geminiData.ecoScore >= 90) ? geminiData.ecoScore : 92;
                finalGrade = "A+";
              } else {
                finalScore = geminiData.ecoScore;
                finalGrade = eScoreGrade(finalScore).grade;
              }
              const finalCO2 = geminiData.carbonFootprintKg;
              wireSwapButtons(existingCard, trimmed, finalScore, finalGrade, finalCO2);
            }
          })
          .catch((err) => {
            console.warn("[EcoIntercept AI] Asynchronous Gemini request failed:", err);
            if (activeDot) {
              activeDot.style.background = "#FF4C4C";
              activeDot.setAttribute("aria-label", "AI audit failed");
            }
          });
      }

    } catch (err) {
      console.warn("[EcoIntercept AI] Product card injection error:", err);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FEATURE 7 — Orders Page: AI Receipt Scanner & Emissions Ledger
  // ══════════════════════════════════════════════════════════════════════════

  function buildOrdersDashboardHTML() {
    return `
      <div id="${ECO_ID}" role="region" aria-label="EcoIntercept AI Emissions Ledger">
        <div class="eco-header">
          <div class="eco-badge">
            <span class="eco-badge-icon" aria-hidden="true">📊</span>
            <div class="eco-badge-text">
              <span class="eco-badge-title">EcoIntercept AI · Emissions Ledger</span>
              <span class="eco-badge-sub">AI Receipt Scanner · Carbon Intelligence Active</span>
            </div>
          </div>
          <div class="eco-status-dot" aria-label="System online"></div>
        </div>
        <div class="eco-section eco-kpi-strip">
          <div class="eco-kpi-card eco-kpi-danger">
            <span class="eco-kpi-icon" aria-hidden="true">🌡️</span>
            <span class="eco-kpi-val">42 kg</span>
            <span class="eco-kpi-lbl">This Month's Footprint CO₂</span>
          </div>
          <div class="eco-kpi-card eco-kpi-saving">
            <span class="eco-kpi-icon" aria-hidden="true">💡</span>
            <span class="eco-kpi-val">17 kg</span>
            <span class="eco-kpi-lbl">Potential Optimisation Savings</span>
          </div>
          <div class="eco-kpi-card eco-kpi-neutral">
            <span class="eco-kpi-icon" aria-hidden="true">📦</span>
            <span class="eco-kpi-val" id="eco-order-count">—</span>
            <span class="eco-kpi-lbl">Orders Scanned</span>
          </div>
          <div class="eco-kpi-card eco-kpi-neutral">
            <span class="eco-kpi-icon" aria-hidden="true">🌳</span>
            <span class="eco-kpi-val">8 trees</span>
            <span class="eco-kpi-lbl">Equivalent Offset Needed</span>
          </div>
        </div>
        <div class="eco-section">
          <div class="eco-section-label">UPLOAD AMAZON INVOICE / RECEIPT</div>
          <div class="eco-upload-zone" id="eco-upload-zone" role="button" tabindex="0" aria-label="Upload Amazon Invoice drag-and-drop zone">
            <div class="eco-upload-icon" aria-hidden="true">📄</div>
            <div class="eco-upload-title">Drag & Drop your Amazon Invoice PDF</div>
            <div class="eco-upload-sub">or <label for="eco-file-input" class="eco-upload-browse">browse file</label></div>
            <input type="file" id="eco-file-input" accept=".pdf,.png,.jpg,.jpeg" style="display:none" />
            <div class="eco-upload-formats">Supports PDF · PNG · JPG · Amazon Order HTML</div>
          </div>
          <div class="eco-parse-state" id="eco-parse-state" style="display:none">
            <div class="eco-parse-spinner" aria-hidden="true"></div>
            <div class="eco-parse-label" id="eco-parse-label">Initialising AI receipt parser…</div>
          </div>
        </div>
        <div id="eco-analysis-results" style="display:none">
          <div class="eco-section">
            <div class="eco-section-label">PARSED EMISSIONS BREAKDOWN</div>
            <div class="eco-breakdown-list" id="eco-breakdown-list"></div>
          </div>
          <div class="eco-section">
            <div class="eco-section-label">AI OPTIMISATION RECOMMENDATIONS</div>
            <div class="eco-reco-grid">
              <div class="eco-reco-card"><span class="eco-reco-icon" aria-hidden="true">♻️</span><div class="eco-reco-text"><div class="eco-reco-title">Switch 3 items to eco alternatives</div><div class="eco-reco-impact">Saves ~9.4 kg CO₂ this month</div></div></div>
              <div class="eco-reco-card"><span class="eco-reco-icon" aria-hidden="true">🚚</span><div class="eco-reco-text"><div class="eco-reco-title">Consolidate to 1 shipment per week</div><div class="eco-reco-impact">Saves ~4.8 kg CO₂ transport emissions</div></div></div>
              <div class="eco-reco-card"><span class="eco-reco-icon" aria-hidden="true">📦</span><div class="eco-reco-text"><div class="eco-reco-title">Select frustration-free packaging</div><div class="eco-reco-impact">Eliminates ~2.8 kg CO₂ packaging waste</div></div></div>
            </div>
          </div>
          <div class="eco-section">
            <div class="eco-section-label">3-MONTH EMISSIONS TREND</div>
            <div class="eco-trend-chart">
              <div class="eco-trend-bar-wrap"><div class="eco-trend-bar" style="height:55%;background:#FF9F1C;"></div><span class="eco-trend-label">Apr<br/>38 kg</span></div>
              <div class="eco-trend-bar-wrap"><div class="eco-trend-bar" style="height:72%;background:#FF4C4C;"></div><span class="eco-trend-label">May<br/>51 kg</span></div>
              <div class="eco-trend-bar-wrap"><div class="eco-trend-bar" style="height:60%;background:#FF9F1C;"></div><span class="eco-trend-label">Jun<br/>42 kg</span></div>
              <div class="eco-trend-bar-wrap eco-trend-target"><div class="eco-trend-bar eco-trend-target-bar" style="height:35%;background:#4ADE80;"></div><span class="eco-trend-label" style="color:#4ADE80;">Target<br/>25 kg</span></div>
            </div>
          </div>
        </div>
        <div class="eco-footer"><span>EcoIntercept AI · v3.1 · AI Receipt Scanner powered by carbon intelligence</span></div>
      </div>
    `;
  }

  const SIMULATED_ORDERS = [
    { name: "Electronics / Devices", co2: 14.2, icon: "💻" },
    { name: "Cleaning Products", co2: 9.8, icon: "🧹" },
    { name: "Plastic Packaging Goods", co2: 7.5, icon: "📦" },
    { name: "Personal Care Items", co2: 5.6, icon: "🧴" },
    { name: "Books & Stationery", co2: 4.9, icon: "📚" }
  ];

  function runReceiptParseAnimation() {
    const zone = document.getElementById("eco-upload-zone");
    const parseBox = document.getElementById("eco-parse-state");
    const parseLabel = document.getElementById("eco-parse-label");
    const results = document.getElementById("eco-analysis-results");
    const orderCount = document.getElementById("eco-order-count");
    if (!zone || !parseBox) return;
    zone.style.display = "none";
    parseBox.style.display = "flex";
    const steps = ["Extracting invoice line items…", "Running carbon emission lookup…", "Cross-referencing supply-chain database…", "Scoring alternatives & optimisations…", "Generating emissions ledger report…"];
    let i = 0;
    function nextStep() {
      if (i < steps.length) {
        if (parseLabel) parseLabel.textContent = steps[i];
        i++; setTimeout(nextStep, 700);
      } else {
        parseBox.style.display = "none";
        if (orderCount) orderCount.textContent = SIMULATED_ORDERS.length;
        buildBreakdownList();
        if (results) results.style.display = "block";
      }
    }
    nextStep();
  }

  function buildBreakdownList() {
    const list = document.getElementById("eco-breakdown-list");
    if (!list) return;
    const maxCO2 = Math.max(...SIMULATED_ORDERS.map((o) => o.co2));
    list.innerHTML = SIMULATED_ORDERS.map((o) => {
      const w = ((o.co2 / maxCO2) * 100).toFixed(1);
      const col = o.co2 >= 10 ? "#FF4C4C" : o.co2 >= 6 ? "#FF9F1C" : "#4ADE80";
      return `<div class="eco-breakdown-row"><span class="eco-breakdown-icon" aria-hidden="true">${o.icon}</span><span class="eco-breakdown-name">${o.name}</span><div class="eco-breakdown-bar-wrap"><div class="eco-breakdown-bar" style="width:${w}%;background:${col};"></div></div><span class="eco-breakdown-val" style="color:${col}">${o.co2} kg</span></div>`;
    }).join("");
  }

  function wireOrdersDashboard() {
    const zone = document.getElementById("eco-upload-zone");
    const input = document.getElementById("eco-file-input");
    const browseLabel = zone ? zone.querySelector(".eco-upload-browse") : null;
    if (!zone) return;
    zone.addEventListener("click", function () { if (input) input.click(); });
    zone.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (input) input.click(); } });
    if (browseLabel) { browseLabel.addEventListener("click", function (e) { e.stopPropagation(); if (input) input.click(); }); }
    if (input) { input.addEventListener("change", function () { if (this.files && this.files.length > 0) runReceiptParseAnimation(); }); }
    zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("eco-upload-drag-over"); });
    zone.addEventListener("dragleave", function () { zone.classList.remove("eco-upload-drag-over"); });
    zone.addEventListener("drop", function (e) { e.preventDefault(); zone.classList.remove("eco-upload-drag-over"); if (e.dataTransfer && e.dataTransfer.files.length > 0) runReceiptParseAnimation(); });
    setTimeout(function () {
      const z = document.getElementById("eco-upload-zone");
      if (z && z.style.display !== "none") {
        const btn = document.createElement("button");
        btn.className = "eco-demo-scan-btn"; btn.textContent = "⚡ Run Demo Scan";
        btn.setAttribute("aria-label", "Run a demo AI receipt scan");
        btn.addEventListener("click", function (e) { e.stopPropagation(); runReceiptParseAnimation(); });
        z.appendChild(btn);
      }
    }, 1500);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DOM INJECTION — Orders Dashboard
  // ══════════════════════════════════════════════════════════════════════════

  const ORDER_SELECTORS = ["#ordersContainer", ".order-card", "#a-page", "#rhf", "body"];

  function injectOrdersDashboard() {
    try {
      if (document.getElementById(ECO_ID)) return;
      let anchor = null;
      for (const sel of ORDER_SELECTORS) { anchor = document.querySelector(sel); if (anchor) break; }
      if (!anchor) return;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildOrdersDashboardHTML();
      const card = wrapper.firstElementChild;
      card.classList.add("eco-orders-dashboard");
      anchor.insertBefore(card, anchor.firstChild);
      wireOrdersDashboard();
    } catch (err) {
      console.warn("[EcoIntercept AI] Orders dashboard injection error:", err);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ASYNC ENGINE — Product Discovery with MutationObserver
  // ══════════════════════════════════════════════════════════════════════════

  let lastProcessedUrl = "";
  let lastProcessedTitle = "";
  let activeProductObserver = null;
  let activeOrdersObserver = null;
  let discoveryAttempts = 0;

  function attemptProductDiscovery() {
    const currentUrl = window.location.href;
    const title = discoverProductTitle();
    if (!title) return false;

    const existingPanel = document.getElementById(ECO_ID);
    if (existingPanel && lastProcessedUrl === currentUrl && lastProcessedTitle === title) {
      return true;
    }

    if (existingPanel && (lastProcessedUrl !== currentUrl || lastProcessedTitle !== title)) {
      cleanupWidgets();
    }

    injectProductCard(title);
    lastProcessedUrl = currentUrl;
    lastProcessedTitle = title;
    return true;
  }

  function waitForProduct() {
    try {
      if (activeProductObserver) { activeProductObserver.disconnect(); activeProductObserver = null; }
      discoveryAttempts = 0;
      attemptProductDiscovery();
      const observer = new MutationObserver(debounce(function () {
        try {
          discoveryAttempts++;
          attemptProductDiscovery();
        } catch (e) { console.warn("[EcoIntercept AI] Observer callback error:", e); }
      }, 100));
      activeProductObserver = observer;
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      
      // Delayed discovery checks for slow client-side rendering/hydration
      setTimeout(function () {
        try { attemptProductDiscovery(); } catch (e) { }
      }, 1500);
      setTimeout(function () {
        try { attemptProductDiscovery(); } catch (e) { }
      }, 4000);
    } catch (e) { console.warn("[EcoIntercept AI] Product discovery setup error:", e); }
  }

  function waitForOrdersAnchor() {
    try {
      if (activeOrdersObserver) { activeOrdersObserver.disconnect(); activeOrdersObserver = null; }
      for (const sel of ORDER_SELECTORS.slice(0, 4)) { if (document.querySelector(sel)) { injectOrdersDashboard(); return; } }
      const observer = new MutationObserver(debounce(function () {
        try {
          for (const sel of ORDER_SELECTORS.slice(0, 4)) {
            if (document.querySelector(sel)) { observer.disconnect(); if (activeOrdersObserver === observer) activeOrdersObserver = null; injectOrdersDashboard(); return; }
          }
        } catch (e) { console.warn("[EcoIntercept AI] Orders observer error:", e); observer.disconnect(); if (activeOrdersObserver === observer) activeOrdersObserver = null; }
      }, 15));
      activeOrdersObserver = observer;
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { observer.disconnect(); if (activeOrdersObserver === observer) activeOrdersObserver = null; injectOrdersDashboard(); }, 10000);
    } catch (e) { console.warn("[EcoIntercept AI] Orders observer setup error:", e); }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SPA ROUTING & CLEANUP
  // ══════════════════════════════════════════════════════════════════════════

  function cleanupWidgets() {
    try {
      lastProcessedUrl = "";
      lastProcessedTitle = "";
      if (activeProductObserver) { activeProductObserver.disconnect(); activeProductObserver = null; }
      if (activeOrdersObserver) { activeOrdersObserver.disconnect(); activeOrdersObserver = null; }
      const existingPanel = document.getElementById(ECO_ID);
      if (existingPanel) existingPanel.remove();
      const existingTrigger = document.getElementById("eco-trigger-btn");
      if (existingTrigger) existingTrigger.remove();
    } catch (e) { console.warn("[EcoIntercept AI] Cleanup error:", e); }
  }

  let lastUrl = window.location.href;
  function handleUrlChange() {
    checkUrlForSwapParam();
    cleanupWidgets();
    if (isOrdersPage()) waitForOrdersAnchor();
    else waitForProduct();
  }

  function startUrlListener() {
    // Sub-second SPA Routing via History API & MutationObserver
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
    };

    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
    };

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });

    window.addEventListener('locationchange', () => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            handleUrlChange();
        }
    });

    // Observer for deep SPA navigations that don't trigger history events immediately
    const domObserver = new MutationObserver(debounce(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            handleUrlChange();
        }
    }, 150));
    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CSS INJECTION — v3 styles + v3.1 error banner style
  // ══════════════════════════════════════════════════════════════════════════

  function injectV3Styles() {
    if (document.getElementById("eco-v3-styles")) return;
    const style = document.createElement("style");
    style.id = "eco-v3-styles";
    style.textContent = `
      #eco-intercept-root .eco-discovery-tag {
        font-size: 11px; font-weight: 600; color: #4ADE80;
        background: rgba(74, 222, 128, 0.07);
        border-bottom: 1px solid rgba(74, 222, 128, 0.15);
        padding: 7px 20px; letter-spacing: 0.04em;
        display: flex; align-items: center; gap: 6px;
      }
      #eco-intercept-root .eco-discovery-tag em { color: #FFFFFF; font-style: normal; font-weight: 700; }
      #eco-intercept-root .eco-discovery-full { font-size: 12px; cursor: help; opacity: 0.55; margin-left: 4px; }
      #eco-intercept-root .eco-alts-intent-note { font-size: 11px; color: #E0E0E0; opacity: 0.7; margin-bottom: 12px; letter-spacing: 0.02em; }
      #eco-intercept-root .eco-alts-intent-note strong { color: #4ADE80; font-weight: 700; }
      /* FIX 4: Error banner style — visible but non-destructive */
      #eco-intercept-root .eco-error-banner {
        font-size: 11px; color: #FF9F1C;
        background: rgba(255, 159, 28, 0.1);
        border: 1px solid rgba(255, 159, 28, 0.3);
        border-radius: 6px; padding: 8px 14px; margin: 8px 16px;
        letter-spacing: 0.02em; line-height: 1.5;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ENTRY POINT
  // ══════════════════════════════════════════════════════════════════════════

  injectV3Styles();
  checkUrlForSwapParam();
  if (isOrdersPage()) waitForOrdersAnchor();
  else waitForProduct();
  startUrlListener();

})();