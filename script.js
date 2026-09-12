const TOPS_IMAGES = {
  "Gray Turtleneck": "PNG/2026_FW-01.png",
  "Charcoal Turtleneck": "PNG/2026_FW-02.png",
  "Gray Boxy Crewneck": "PNG/2026_FW-09.png",
  "Ivory Striped Collar Knit": "PNG/2026_FW-10.png",
  "Black Knit (Button Cuff)": "PNG/2026_FW-11.png",
  "Navy Turtleneck": "PNG/2026_FW-14.png",
  "Gray Cardigan": "PNG/2026_FW-15.png",
  "Black Short-Sleeve Turtleneck": "PNG/2026_FW-16.png",
  "Black Crewneck Knit": "PNG/2026_FW-17.png",
  "Black Knit (White Button)": "PNG/2026_FW-18.png",
  "Gray Short-Sleeve Turtleneck": "PNG/2026_FW-19.png",
  "Gray Sweatshirt": "PNG/2026_FW-20.png",
};

const BOTTOMS_IMAGES = {
  "Khaki Gray Wide Pants": "PNG/2026_FW-03.png",
  "Ivory Wide Pants": "PNG/2026_FW-04.png",
  "Brown Wide Pants": "PNG/2026_FW-05.png",
  "Black Flare Pants": "PNG/2026_FW-06.png",
  "Beige Wide Pants": "PNG/2026_FW-07.png",
  "Gray-Blue Straight Pants": "PNG/2026_FW-08.png",
  "Blue Denim Wide Pants": "PNG/2026_FW-21.png",
  "Charcoal Flare Pants": "PNG/2026_FW-22.png",
};

const OUTERS_IMAGES = {
  "Blue-Gray Crop Jacket": "PNG/2026_FW-23.png",
  "Brown Crop Jacket": "PNG/2026_FW-24.png",
  "Charcoal Hoodie": "PNG/2026_FW-25.png",
};

const SHOES_IMAGES = {
  "Black Sneakers (Burgundy Stripe)": "PNG/2026_FW-26.png",
  "Black Sneakers (Brown Stripe)": "PNG/2026_FW-27.png",
  "Gray Sneakers": "PNG/2026_FW-28.png",
  "Black Flats": "PNG/2026_FW-30.png",
};

const NONE_LABEL = "None";

const TOP_NAMES = Object.keys(TOPS_IMAGES);
const BOTTOM_NAMES = Object.keys(BOTTOMS_IMAGES);
const OUTER_NAMES = [NONE_LABEL, ...Object.keys(OUTERS_IMAGES)];
const SHOE_NAMES = [NONE_LABEL, ...Object.keys(SHOES_IMAGES)];

// One entry per layer shown in the canvas. Each has its own name list,
// image map and the state key that stores the current index.
const CATEGORIES = [
  { key: "top", label: "Top", names: TOP_NAMES, images: TOPS_IMAGES, stateKey: "topIdx" },
  {
    key: "bottom",
    label: "Bottom",
    names: BOTTOM_NAMES,
    images: BOTTOMS_IMAGES,
    stateKey: "bottomIdx",
  },
  { key: "outer", label: "Outer", names: OUTER_NAMES, images: OUTERS_IMAGES, stateKey: "outerIdx" },
  { key: "shoe", label: "Shoes", names: SHOE_NAMES, images: SHOES_IMAGES, stateKey: "shoeIdx" },
];

function getImg(map, name) {
  return name === NONE_LABEL ? null : map[name];
}

// Saved outfits persist in localStorage so a refresh doesn't wipe them.
const STORAGE_KEY = "closet.savedOutfits";

function isValidOutfit(o) {
  return (
    o &&
    typeof o.key === "string" &&
    TOP_NAMES.includes(o.top) &&
    BOTTOM_NAMES.includes(o.bottom) &&
    OUTER_NAMES.includes(o.outer) &&
    SHOE_NAMES.includes(o.shoe)
  );
}

function loadSavedOutfits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // drop anything that doesn't match the current item lists, in case
    // the wardrobe changed since this was saved
    return Array.isArray(parsed) ? parsed.filter(isValidOutfit) : [];
  } catch (err) {
    // storage can be unavailable (private browsing, disabled, corrupt
    // JSON, etc.) — fall back to an empty list instead of breaking the app
    return [];
  }
}

function persistSavedOutfits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved));
  } catch (err) {
    // ignore: nothing useful we can do if storage is unavailable/full
  }
}

const state = {
  topIdx: 0,
  bottomIdx: 0,
  outerIdx: 0,
  shoeIdx: 1,
  active: "top", // which category the canvas swipe currently controls
  saved: loadSavedOutfits(),
};

// direction of the most recent swipe/arrow action, used to pick a
// slide-in animation for the canvas; reset after each render.
let lastSwipeDir = 0;

// which tab was active going into the current render, used to animate
// the sliding tab indicator from its old spot to its new one.
let lastActiveKey = "top";

function el(tag, className, attrs) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) {
    for (const k in attrs) {
      if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
  }
  return node;
}

function cycle(names, idx, dir) {
  return (idx + dir + names.length) % names.length;
}

function activeCategory() {
  return CATEGORIES.find((c) => c.key === state.active);
}

function cycleActive(dir) {
  const cat = activeCategory();
  state[cat.stateKey] = cycle(cat.names, state[cat.stateKey], dir);
  lastSwipeDir = dir;
  render();
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const topName = TOP_NAMES[state.topIdx];
  const bottomName = BOTTOM_NAMES[state.bottomIdx];
  const outerName = OUTER_NAMES[state.outerIdx];
  const shoeName = SHOE_NAMES[state.shoeIdx];

  const root = el("div", "closet-app");

  // header
  const header = el("div", "closet-header");
  header.appendChild(el("div", "closet-title", { text: "Chae's Closet" }));
  root.appendChild(header);

  // canvas
  const canvas = el("div", "closet-canvas");

  const prevBtn = el("button", "closet-canvas-arrow closet-canvas-arrow-prev", {
    text: "‹",
    "aria-label": "Previous",
  });
  prevBtn.addEventListener("click", () => cycleActive(-1));

  const nextBtn = el("button", "closet-canvas-arrow closet-canvas-arrow-next", {
    text: "›",
    "aria-label": "Next",
  });
  nextBtn.addEventListener("click", () => cycleActive(1));

  const stage = el("div", "closet-canvas-stage");
  if (lastSwipeDir !== 0) {
    stage.classList.add(lastSwipeDir > 0 ? "swipe-next" : "swipe-prev");
    lastSwipeDir = 0;
  }

  const outerImgSrc = getImg(OUTERS_IMAGES, outerName);
  if (outerImgSrc) {
    stage.appendChild(el("img", "closet-canvas-outer-img", { src: outerImgSrc, alt: "outer" }));
  }
  stage.appendChild(el("img", "closet-canvas-top-img", { src: TOPS_IMAGES[topName], alt: "top" }));
  stage.appendChild(
    el("img", "closet-canvas-bottom-img", { src: BOTTOMS_IMAGES[bottomName], alt: "bottom" }),
  );
  const shoeImgSrc = getImg(SHOES_IMAGES, shoeName);
  if (shoeImgSrc) {
    stage.appendChild(el("img", "closet-canvas-shoe-img", { src: shoeImgSrc, alt: "shoe" }));
  }
  attachSwipe(stage);

  canvas.appendChild(prevBtn);
  canvas.appendChild(stage);
  canvas.appendChild(nextBtn);

  const cat = activeCategory();
  const caption = el("div", "closet-canvas-caption");
  caption.appendChild(
    el("div", "closet-canvas-caption-name", { text: cat.names[state[cat.stateKey]] }),
  );
  caption.appendChild(
    el("div", "closet-canvas-caption-meta", {
      text: `${cat.label} · ${state[cat.stateKey] + 1}/${cat.names.length}`,
    }),
  );
  canvas.appendChild(caption);

  root.appendChild(canvas);

  // tabs (choose which layer the canvas swipe controls)
  const tabs = el("div", "closet-tabs");
  const indicator = el("div", "closet-tab-indicator");
  tabs.appendChild(indicator);
  const tabButtons = [];
  CATEGORIES.forEach((c) => {
    const tab = el("button", "closet-tab" + (state.active === c.key ? " is-active" : ""), {
      text: c.label,
    });
    tab.addEventListener("click", () => {
      state.active = c.key;
      render();
    });
    tabButtons.push({ key: c.key, node: tab });
    tabs.appendChild(tab);
  });
  root.appendChild(tabs);

  // actions
  const actions = el("div", "closet-actions");
  const randomBtn = el("button", "closet-btn closet-btn-ghost", { text: "RANDOM" });
  randomBtn.addEventListener("click", randomize);
  const saveBtn = el("button", "closet-btn closet-btn-primary", { text: "SAVE" });
  saveBtn.addEventListener("click", saveOutfit);
  actions.appendChild(randomBtn);
  actions.appendChild(saveBtn);
  root.appendChild(actions);

  // saved
  if (state.saved.length > 0) {
    const section = el("div", "closet-saved-section");
    section.appendChild(el("div", "closet-saved-title", { text: "Saved Outfits" }));
    const grid = el("div", "closet-saved-grid");
    const currentKey = `${state.topIdx}-${state.bottomIdx}-${state.outerIdx}-${state.shoeIdx}`;
    state.saved.forEach((o) => {
      const isLoaded = o.key === currentKey;
      const card = el("div", "closet-saved-card" + (isLoaded ? " is-loaded" : ""), {
        role: "button",
        tabindex: "0",
        "aria-label": `Load ${o.top} · ${o.bottom} outfit`,
      });
      card.addEventListener("click", () => loadOutfit(o));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          loadOutfit(o);
        }
      });

      const deleteBtn = el("button", "closet-saved-delete", {
        type: "button",
        text: "×",
        "aria-label": `Delete ${o.top} · ${o.bottom} outfit`,
      });
      // stop the click from bubbling up to the card, so deleting never
      // also triggers "load this outfit"
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteOutfit(o.key);
      });
      card.appendChild(deleteBtn);

      const icons = el("div", "closet-saved-icons");
      const outerSrc = getImg(OUTERS_IMAGES, o.outer);
      if (outerSrc) icons.appendChild(el("img", "closet-saved-icon", { src: outerSrc, alt: "" }));
      icons.appendChild(el("img", "closet-saved-icon", { src: TOPS_IMAGES[o.top], alt: "" }));
      icons.appendChild(el("img", "closet-saved-icon", { src: BOTTOMS_IMAGES[o.bottom], alt: "" }));
      const shoeSrc = getImg(SHOES_IMAGES, o.shoe);
      if (shoeSrc) icons.appendChild(el("img", "closet-saved-icon", { src: shoeSrc, alt: "" }));
      card.appendChild(icons);
      let labelText = `${o.top} · ${o.bottom}`;
      if (o.outer !== NONE_LABEL) labelText += ` · ${o.outer}`;
      if (o.shoe !== NONE_LABEL) labelText += ` · ${o.shoe}`;
      card.appendChild(el("div", "closet-saved-label", { text: labelText }));
      grid.appendChild(card);
    });
    section.appendChild(grid);
    root.appendChild(section);
  }

  app.appendChild(root);

  // Animate the tab indicator from where it was to where it is now.
  // The whole tree was just rebuilt, so there's no "previous element"
  // to transition from — instead we measure the button that used to be
  // active, snap the indicator there with no transition, force layout,
  // then transition it over to the button that's active now (a manual
  // FLIP). If nothing moved (most renders aren't tab switches) the two
  // positions are the same and this is a harmless no-op.
  const prevTab = tabButtons.find((t) => t.key === lastActiveKey) || tabButtons.find((t) => t.key === state.active);
  const activeTab = tabButtons.find((t) => t.key === state.active);
  if (prevTab && activeTab) {
    indicator.style.transition = "none";
    indicator.style.width = `${prevTab.node.offsetWidth}px`;
    indicator.style.transform = `translateX(${prevTab.node.offsetLeft}px)`;
    // eslint-disable-next-line no-unused-expressions
    indicator.offsetWidth; // force reflow so the "none" transition above actually applies
    indicator.style.transition = "";
    indicator.style.width = `${activeTab.node.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeTab.node.offsetLeft}px)`;
  }
  lastActiveKey = state.active;
}

// Pointer-based swipe (works for touch and mouse) on the canvas stage.
// A horizontal drag past the threshold cycles the active category;
// small movements / taps are ignored so buttons underneath still work.
function attachSwipe(stage) {
  const SWIPE_THRESHOLD = 40;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let horizontal = false;

  stage.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    horizontal = false;
    if (stage.setPointerCapture) {
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignore: pointer capture is a nice-to-have, not required
      }
    }
  });

  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!horizontal && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      horizontal = true;
    }
    if (horizontal) {
      stage.style.transform = `translateX(${dx}px)`;
    }
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    stage.style.transform = "";
    if (!horizontal) return;
    const dx = e.clientX - startX;
    if (dx <= -SWIPE_THRESHOLD) {
      cycleActive(1);
    } else if (dx >= SWIPE_THRESHOLD) {
      cycleActive(-1);
    }
  }

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("pointerleave", (e) => {
    if (dragging && horizontal) endDrag(e);
    dragging = false;
  });
}

function randomize() {
  state.topIdx = Math.floor(Math.random() * TOP_NAMES.length);
  state.bottomIdx = Math.floor(Math.random() * BOTTOM_NAMES.length);
  state.outerIdx = Math.floor(Math.random() * OUTER_NAMES.length);
  state.shoeIdx = 1 + Math.floor(Math.random() * (SHOE_NAMES.length - 1));
  render();
}

// Saves the current outfit, unless an outfit with the same top + bottom
// combo is already saved — in that case we just silently skip saving
// instead of adding a near-duplicate.
function saveOutfit() {
  const outfit = {
    top: TOP_NAMES[state.topIdx],
    bottom: BOTTOM_NAMES[state.bottomIdx],
    outer: OUTER_NAMES[state.outerIdx],
    shoe: SHOE_NAMES[state.shoeIdx],
    key: `${state.topIdx}-${state.bottomIdx}-${state.outerIdx}-${state.shoeIdx}`,
  };
  const isDuplicate = state.saved.some((o) => o.top === outfit.top && o.bottom === outfit.bottom);
  if (isDuplicate) return;
  state.saved = [outfit, ...state.saved].slice(0, 6);
  persistSavedOutfits();
  render();
}

// Loads a previously saved outfit back into the canvas so tapping a
// saved card actually shows it, instead of just sitting there as a list.
function loadOutfit(outfit) {
  state.topIdx = Math.max(0, TOP_NAMES.indexOf(outfit.top));
  state.bottomIdx = Math.max(0, BOTTOM_NAMES.indexOf(outfit.bottom));
  state.outerIdx = Math.max(0, OUTER_NAMES.indexOf(outfit.outer));
  state.shoeIdx = Math.max(0, SHOE_NAMES.indexOf(outfit.shoe));
  render();
  const canvas = document.querySelector(".closet-canvas");
  if (canvas) canvas.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Removes a saved outfit (triggered by its hover delete button).
function deleteOutfit(key) {
  state.saved = state.saved.filter((o) => o.key !== key);
  persistSavedOutfits();
  render();
}

render();
