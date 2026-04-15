console.log("main.js loaded");

function getIntroDelayMsFromClassList(classList) {
  if (classList.contains("hero-intro-delay-1")) return 60;
  if (classList.contains("hero-intro-delay-2")) return 140;
  if (classList.contains("hero-intro-delay-3")) return 240;
  if (classList.contains("hero-intro-delay-4")) return 340;
  if (classList.contains("hero-intro-delay-5")) return 450;
  return 0;
}

function splitHeroTextForAnimation(hero) {
  const animatedTextNodes = hero.querySelectorAll(".hero-anim-text");
  if (animatedTextNodes.length === 0) return;

  animatedTextNodes.forEach((node) => {
    if (node.dataset.heroSplit === "true") return;

    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;

    const words = text.split(" ");
    const baseDelay = getIntroDelayMsFromClassList(node.classList);
    node.style.setProperty("--hero-base-delay", `${baseDelay}ms`);
    node.textContent = "";

    let runningWordDelay = 0;

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "hero-word";
      wordSpan.style.setProperty("--word-delay", `${runningWordDelay}ms`);

      Array.from(word).forEach((char, charIndex) => {
        const letterSpan = document.createElement("span");
        letterSpan.className = "hero-letter";
        letterSpan.style.setProperty("--letter-delay", `${charIndex * 20}ms`);
        letterSpan.textContent = char;
        wordSpan.appendChild(letterSpan);
      });

      node.appendChild(wordSpan);

      if (wordIndex < words.length - 1) {
        node.appendChild(document.createTextNode(" "));
      }

      runningWordDelay += 110;
    });

    node.dataset.heroSplit = "true";
  });
}

function initHeroIntroAnimation() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  splitHeroTextForAnimation(hero);
  hero.classList.add("hero-intro-ready");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hero.classList.add("hero-intro-play");
    });
  });
}

initHeroIntroAnimation();

function initPlaygroundCanvas() {
  const scrollArea = document.getElementById("playground-scroll-area");
  const world = document.querySelector(".playground-world");
  const exploreControl = document.querySelector(".playground-explore-control");
  const pieces = Array.from(document.querySelectorAll(".playground-piece"));

  if (!scrollArea || !world || pieces.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smoothBehavior = prefersReducedMotion.matches ? "auto" : "smooth";

  function centerCanvas(behavior = "auto") {
    const targetLeft = Math.max(0, (world.scrollWidth - scrollArea.clientWidth) * 0.5);
    const targetTop = 0;
    scrollArea.scrollTo({ left: targetLeft, top: targetTop, behavior });
  }

  let isPointerDown = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartLeft = 0;
  let dragStartTop = 0;
  let activePointerId = null;
  let followRafId = null;
  let followTargetX = 0;
  let followTargetY = 0;
  let followCurrentX = 0;
  let followCurrentY = 0;

  function resetFollow() {
    followTargetX = 0;
    followTargetY = 0;
  }

  function updateFollow() {
    followCurrentX += (followTargetX - followCurrentX) * 0.09;
    followCurrentY += (followTargetY - followCurrentY) * 0.09;

    world.style.setProperty("--playground-follow-x", `${followCurrentX.toFixed(2)}px`);
    world.style.setProperty("--playground-follow-y", `${followCurrentY.toFixed(2)}px`);

    const remainingX = Math.abs(followTargetX - followCurrentX);
    const remainingY = Math.abs(followTargetY - followCurrentY);

    if (remainingX < 0.04 && remainingY < 0.04) {
      followRafId = null;
      return;
    }

    followRafId = window.requestAnimationFrame(updateFollow);
  }

  function queueFollowUpdate() {
    if (followRafId !== null) return;
    followRafId = window.requestAnimationFrame(updateFollow);
  }

  function handleFollowPointerMove(event) {
    if (prefersReducedMotion.matches) return;
    if (isPointerDown) return;

    const rect = scrollArea.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width) - 0.5;
    const normalizedY = ((event.clientY - rect.top) / rect.height) - 0.5;

    const maxShift = 12;
    followTargetX = normalizedX * maxShift;
    followTargetY = normalizedY * maxShift;
    queueFollowUpdate();
  }

  scrollArea.addEventListener("pointermove", handleFollowPointerMove);
  scrollArea.addEventListener("pointerleave", () => {
    if (prefersReducedMotion.matches) return;
    resetFollow();
    queueFollowUpdate();
  });

  const handleReducedMotionChange = (event) => {
    if (!event.matches) return;
    followTargetX = 0;
    followTargetY = 0;
    followCurrentX = 0;
    followCurrentY = 0;
    world.style.setProperty("--playground-follow-x", "0px");
    world.style.setProperty("--playground-follow-y", "0px");
  };

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", handleReducedMotionChange);
  } else if (typeof prefersReducedMotion.addListener === "function") {
    prefersReducedMotion.addListener(handleReducedMotionChange);
  }

  scrollArea.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("a, button")) return;

    isPointerDown = true;
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartLeft = scrollArea.scrollLeft;
    dragStartTop = scrollArea.scrollTop;
    scrollArea.setPointerCapture(event.pointerId);
    scrollArea.classList.add("is-dragging");
  });

  scrollArea.addEventListener("pointermove", (event) => {
    if (!isPointerDown || event.pointerId !== activePointerId) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    scrollArea.scrollLeft = dragStartLeft - deltaX;
    scrollArea.scrollTop = dragStartTop - deltaY;
  });

  function endDrag(event) {
    if (!isPointerDown) return;
    if (event && event.pointerId !== activePointerId) return;

    isPointerDown = false;
    activePointerId = null;
    scrollArea.classList.remove("is-dragging");
  }

  scrollArea.addEventListener("pointerup", endDrag);
  scrollArea.addEventListener("pointercancel", endDrag);
  scrollArea.addEventListener("pointerleave", endDrag);

  scrollArea.addEventListener("keydown", (event) => {
    const step = 84;
    let handled = true;

    switch (event.key) {
      case "ArrowRight":
        scrollArea.scrollBy({ left: step, behavior: smoothBehavior });
        break;
      case "ArrowLeft":
        scrollArea.scrollBy({ left: -step, behavior: smoothBehavior });
        break;
      case "ArrowDown":
        scrollArea.scrollBy({ top: step, behavior: smoothBehavior });
        break;
      case "ArrowUp":
        scrollArea.scrollBy({ top: -step, behavior: smoothBehavior });
        break;
      default:
        handled = false;
    }

    if (handled) event.preventDefault();
  });

  if (exploreControl) {
    const targets = pieces.map((piece) => ({
      left: piece.offsetLeft - Math.max(32, (scrollArea.clientWidth - piece.clientWidth) * 0.5),
      top: piece.offsetTop - Math.max(32, (scrollArea.clientHeight - piece.clientHeight) * 0.5)
    }));

    let exploreIndex = 0;
    exploreControl.addEventListener("click", () => {
      if (targets.length === 0) return;
      const target = targets[exploreIndex % targets.length];
      scrollArea.scrollTo({
        left: Math.max(0, target.left),
        top: Math.max(0, target.top),
        behavior: smoothBehavior
      });
      exploreIndex += 1;
    });
  }

  window.addEventListener("load", () => centerCanvas("auto"));
  window.addEventListener("resize", () => centerCanvas("auto"));
  centerCanvas("auto");
}

initPlaygroundCanvas();

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

const caseProgress = document.querySelector(".case-progress");
const navSectionLinks = Array.from(
  document.querySelectorAll('.case-progress-links a[href^="#"]')
);
const fallbackNavSectionLinks = Array.from(
  document.querySelectorAll('.site-nav-links a[href^="#"]')
);
const activeTrackedLinks =
  navSectionLinks.length > 0 ? navSectionLinks : fallbackNavSectionLinks;

const navSections = activeTrackedLinks
  .map((link) => {
    const targetId = link.getAttribute("href");
    if (!targetId || !targetId.startsWith("#")) return null;
    return document.querySelector(targetId);
  })
  .filter(Boolean);

function setActiveNavLink(sectionId) {
  activeTrackedLinks.forEach((link) => {
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
  const activationLine = window.innerHeight * 0.34;

  // On the home page nav, avoid pre-highlighting the first link while
  // users are still in the hero section above the first tracked section.
  if (navSectionLinks.length === 0) {
    let activeSection = null;

    navSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= activationLine) {
        activeSection = section;
      }
    });

    return activeSection ? activeSection.id : "";
  }

  let activeSection = navSections[0];

  navSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= activationLine) {
      activeSection = section;
    }
  });

  return activeSection.id;
}

function syncProgressVisibility() {
  if (!caseProgress) return;
  const overviewSection = document.getElementById("overview");
  if (!overviewSection) {
    caseProgress.classList.add("is-visible");
    return;
  }

  const heroBottom = overviewSection.offsetTop + overviewSection.offsetHeight;
  const shouldShow = window.scrollY >= heroBottom - 140;
  caseProgress.classList.toggle("is-visible", shouldShow);
}

let navRafId = null;
function syncActiveNavOnScroll() {
  if (navRafId !== null) return;
  navRafId = window.requestAnimationFrame(() => {
    const activeId = getCurrentSectionId();
    setActiveNavLink(activeId);
    syncProgressVisibility();
    navRafId = null;
  });
}

if (activeTrackedLinks.length > 0) {
  activeTrackedLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.getAttribute("href");
      if (!target || !target.startsWith("#")) return;
      setActiveNavLink(target.slice(1));
      setTimeout(syncActiveNavOnScroll, 120);
    });
  });

  syncActiveNavOnScroll();
  window.addEventListener("scroll", syncActiveNavOnScroll, { passive: true });
  window.addEventListener("resize", syncActiveNavOnScroll);
  window.addEventListener("load", syncActiveNavOnScroll);
  window.addEventListener("hashchange", syncActiveNavOnScroll);
}

const topNav = document.querySelector(".site-nav");
const isCaseStudyPage = document.body.classList.contains("case-study-page");

if (isCaseStudyPage && topNav) {
  let previousScrollY = window.scrollY;
  let navHidden = false;
  let navScrollRaf = null;

  function setNavHidden(hidden) {
    if (navHidden === hidden) return;
    navHidden = hidden;
    topNav.classList.toggle("is-hidden", hidden);
  }

  function syncCaseStudyNavVisibility() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - previousScrollY;
    const nearTop = currentScrollY < 72;

    if (nearTop) {
      setNavHidden(false);
    } else if (scrollDelta > 4) {
      setNavHidden(true);
    } else if (scrollDelta < -4) {
      setNavHidden(false);
    }

    previousScrollY = currentScrollY;
    navScrollRaf = null;
  }

  function handleCaseStudyScroll() {
    if (navScrollRaf !== null) return;
    navScrollRaf = window.requestAnimationFrame(syncCaseStudyNavVisibility);
  }

  window.addEventListener("scroll", handleCaseStudyScroll, { passive: true });
  window.addEventListener("load", syncCaseStudyNavVisibility);
}
