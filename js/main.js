const hero = document.querySelector(".hero");
const heroInteraction = document.querySelector(".hero-interaction");

if (hero && heroInteraction) {
  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  });

  hero.addEventListener("mouseleave", () => {
    const rect = hero.getBoundingClientRect();
    targetX = rect.width / 2;
    targetY = rect.height / 2;
  });

  function animateHeroGlow() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    heroInteraction.style.setProperty("--x", `${currentX}px`);
    heroInteraction.style.setProperty("--y", `${currentY}px`);

    requestAnimationFrame(animateHeroGlow);
  }

  animateHeroGlow();
}

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