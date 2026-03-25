console.log("main.js loaded");

function updateSeattleTime() {
  const clock = document.getElementById("seattle-time");
  if (!clock) return;

  const now = new Date();
  const seattleTime = now.toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  clock.textContent = `Seattle · ${seattleTime}`;
}

updateSeattleTime();
setInterval(updateSeattleTime, 1000);

const hoverTriggers = document.querySelectorAll(".about-hover-trigger");
const hoverRegion = document.querySelector(".about-gallery-column");
const previewImage = document.getElementById("about-hover-preview-image");
const experienceList = document.querySelector(".about-experience-list");
const hoverBoard = document.querySelector(".about-hover-board");
let autoCycleTimer = null;
let isBoardActive = false;

function setHighlightPreview(trigger) {
  if (!previewImage) return;
  if (!trigger) return;

  const imageSrc = trigger.getAttribute("data-preview-image");
  const imageAlt = trigger.getAttribute("data-preview-alt") || "Highlight image";

  if (imageSrc) {
    previewImage.src = imageSrc;
    previewImage.alt = imageAlt;
  }

  hoverTriggers.forEach((item) => item.classList.remove("is-active"));
  trigger.classList.add("is-active");
  if (typeof syncHighlightsHeight === "function") {
    requestAnimationFrame(syncHighlightsHeight);
  }
}

hoverTriggers.forEach((trigger) => {
  const activatePreview = () => setHighlightPreview(trigger);
  trigger.addEventListener("mouseenter", activatePreview);
  trigger.addEventListener("focus", activatePreview);
  trigger.addEventListener("click", activatePreview);
});

function getActiveTriggerIndex() {
  return Array.from(hoverTriggers).findIndex((item) =>
    item.classList.contains("is-active")
  );
}

function cycleNextHighlight() {
  if (hoverTriggers.length < 2 || isBoardActive) return;

  const currentIndex = getActiveTriggerIndex();
  const nextIndex = currentIndex >= 0
    ? (currentIndex + 1) % hoverTriggers.length
    : 0;

  setHighlightPreview(hoverTriggers[nextIndex]);
}

function startAutoCycle() {
  if (autoCycleTimer || hoverTriggers.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  autoCycleTimer = setInterval(cycleNextHighlight, 3000);
}

function stopAutoCycle() {
  if (!autoCycleTimer) return;
  clearInterval(autoCycleTimer);
  autoCycleTimer = null;
}

if (hoverRegion) {
  hoverRegion.addEventListener("mouseenter", () => {
    isBoardActive = true;
  });

  hoverRegion.addEventListener("mouseleave", () => {
    isBoardActive = false;
  });

  hoverRegion.addEventListener("focusin", () => {
    isBoardActive = true;
  });

  hoverRegion.addEventListener("focusout", () => {
    if (!hoverRegion.contains(document.activeElement)) {
      isBoardActive = false;
    }
  });
}

if (hoverTriggers.length > 0) {
  const firstActive = document.querySelector(".about-hover-trigger.is-active");
  if (firstActive) {
    setHighlightPreview(firstActive);
  } else {
    setHighlightPreview(hoverTriggers[0]);
  }
}

startAutoCycle();

function syncHighlightsHeight() {
  if (!experienceList || !hoverBoard) return;

  if (window.innerWidth <= 900) {
    hoverBoard.style.height = "auto";
    return;
  }

  const targetHeight = Math.max(0, Math.round(experienceList.offsetHeight));
  hoverBoard.style.height = `${targetHeight}px`;
}

syncHighlightsHeight();
window.addEventListener("resize", syncHighlightsHeight);
window.addEventListener("load", syncHighlightsHeight);

if (typeof ResizeObserver !== "undefined" && experienceList) {
  const observer = new ResizeObserver(() => syncHighlightsHeight());
  observer.observe(experienceList);
}

const navSectionLinks = Array.from(
  document.querySelectorAll('.site-nav-links a[href^="#"]')
);
const navSections = navSectionLinks
  .map((link) => {
    const targetId = link.getAttribute("href");
    if (!targetId) return null;
    return document.querySelector(targetId);
  })
  .filter(Boolean);

function setActiveNavLink(sectionId) {
  navSectionLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function getCurrentSectionId() {
  if (navSections.length === 0) return "";

  const markerY = window.innerHeight * 0.36;
  let activeSection = null;

  navSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const isInViewBand = rect.top <= markerY && rect.bottom > markerY;

    if (isInViewBand) {
      activeSection = section;
    }
  });

  return activeSection ? activeSection.id : "";
}

let navRafId = null;
function syncActiveNavOnScroll() {
  if (navRafId !== null) return;

  navRafId = window.requestAnimationFrame(() => {
    const activeId = getCurrentSectionId();
    setActiveNavLink(activeId);
    navRafId = null;
  });
}

if (navSectionLinks.length > 0) {
  syncActiveNavOnScroll();
  window.addEventListener("scroll", syncActiveNavOnScroll, { passive: true });
  window.addEventListener("resize", syncActiveNavOnScroll);
  window.addEventListener("load", syncActiveNavOnScroll);
}
