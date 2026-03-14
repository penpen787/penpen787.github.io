/* ═══════════════════════════════════════════════
   ARCADE RESUME — GAME LOGIC
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // --- DOM refs ---
  const scrollArea      = document.getElementById('scroll-area');
  const worldStrip      = document.getElementById('world-strip');
  const character       = document.getElementById('character');
  const charSprite      = document.getElementById('char-sprite');
  const introScene      = document.getElementById('intro-scene');
  const outroScene      = document.getElementById('outro-scene');
  const dialogContainer = document.getElementById('dialog-container');
  const dialogTextEl    = document.getElementById('dialog-text');

  // --- Constants ---
  const DROP_DISTANCE       = 600;   // px of scroll for intro → land
  const OUTRO_FADE_DISTANCE = 500;   // px after world ends to fully fade in outro
  const WALK_FRAME_MS       = 150;   // ms between standing/walking frame swap
  const IDLE_TIMEOUT_MS     = 200;   // ms of no scroll before character stops
  const TYPE_SPEED_MS       = 25;    // ms per character in typewriter

  // Sprite paths
  const SPRITE_STANDING = 'assets/character_standing.png';
  const SPRITE_WALKING  = 'assets/character_right.png';

  // Stage dialogues
  const dialogues = [
    "Took apart a hard drive from my father's PC and found a totally sweet round mirror inside! RIP family data. Little did I know, this was my first hardware hack.",
    "Majored in Architecture, but got sidetracked by Coding 101. Got suspiciously good at printing * star trees in C. Clearly, destiny had other plans.",
    "Architecture promised a fat paycheck, but I chose a Computer Science minor instead. Decided to follow my heart... and embrace the bugs.",
    "Managed the core system at an insurance company. Learned exactly how terrifying it is when millions depend on your code not crashing.",
    "Leveled up and joined Naver! Handled a lovely internet service for 4 years. Turns out, scaling systems is just as hard as it sounds.",
    "Loved my working holiday so much, I crossed the ocean to join Amazon Canada! Code works the same in English, but the coffee is different.",
    "6+ years at Amazon Canada/US, and now facing the final boss: AI Engineering. From ruining hard drives to wrangling neural networks... quest accepted!"
  ];

  // --- State ---
  let currentStage   = -1;
  let lastScrollY    = 0;
  let walkInterval   = null;
  let idleTimeout    = null;
  let walkFrame      = false;   // false = standing, true = walking
  let typeInterval   = null;
  let facingLeft     = false;

  // ─────────────────────────────────────────────
  // Page height calculation
  // ─────────────────────────────────────────────
  function recalcPageHeight() {
    const worldWidth    = worldStrip.scrollWidth;
    const viewportWidth = window.innerWidth;
    const maxScrollX    = Math.max(0, worldWidth - viewportWidth);
    const total         = DROP_DISTANCE + maxScrollX + OUTRO_FADE_DISTANCE + window.innerHeight;
    scrollArea.style.height = `${total}px`;
  }

  // Recalculate on resize and after images load
  window.addEventListener('resize', recalcPageHeight);
  window.addEventListener('load', recalcPageHeight);
  recalcPageHeight();
  setTimeout(recalcPageHeight, 800);
  setTimeout(recalcPageHeight, 2000);

  // ─────────────────────────────────────────────
  // Walking animation (frame swap)
  // ─────────────────────────────────────────────
  function startWalking() {
    if (walkInterval) return; // already running
    walkInterval = setInterval(() => {
      walkFrame = !walkFrame;
      charSprite.src = walkFrame ? SPRITE_WALKING : SPRITE_STANDING;
    }, WALK_FRAME_MS);
  }

  function stopWalking() {
    if (walkInterval) {
      clearInterval(walkInterval);
      walkInterval = null;
    }
    walkFrame = false;
    charSprite.src = SPRITE_STANDING;
  }

  // ─────────────────────────────────────────────
  // Typewriter effect
  // ─────────────────────────────────────────────
  function typeText(text) {
    if (typeInterval) clearInterval(typeInterval);
    dialogTextEl.textContent = '';
    let i = 0;
    typeInterval = setInterval(() => {
      if (i < text.length) {
        dialogTextEl.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeInterval);
        typeInterval = null;
      }
    }, TYPE_SPEED_MS);
  }

  // ─────────────────────────────────────────────
  // Main scroll handler
  // ─────────────────────────────────────────────
  window.addEventListener('scroll', () => {
    const scrollY       = window.scrollY;
    const worldWidth    = worldStrip.scrollWidth;
    const viewportWidth = window.innerWidth;
    const maxScrollX    = Math.max(0, worldWidth - viewportWidth);

    // ── Phase 1: Intro / Sky Drop ──────────────
    if (scrollY <= DROP_DISTANCE) {
      const progress = scrollY / DROP_DISTANCE; // 0 → 1

      // Fade out intro overlay (fades in first 40% of drop)
      const introOpacity = 1 - (progress / 0.4);
      if (introOpacity > 0) {
        introScene.classList.remove('hidden');
        introScene.style.opacity = Math.max(0, Math.min(1, introOpacity));
      } else {
        introScene.classList.add('hidden');
      }

      // Fade IN character as drop begins (Fix 4)
      character.style.opacity = Math.min(1, progress * 3);

      // Character drops from center (80vh) to just above dialog box (22vh) (Fix 2)
      const charBottom = 80 - (progress * 58);
      character.style.bottom = `${charBottom}vh`;

      // World strip slides up from below
      worldStrip.style.transform = `translateY(${(1 - progress) * 100}vh) translateX(0px)`;

      // Hide dialog and outro during intro
      dialogContainer.classList.remove('visible');
      outroScene.classList.add('hidden');
      outroScene.style.pointerEvents = 'none'; // Ensure links aren't clickable (Fix 7)
      currentStage = -1;

      // Standing during drop
      stopWalking();
      character.classList.remove('face-left');
      facingLeft = false;

      lastScrollY = scrollY;
      return;
    }

    // ── Phase 2 & 3: Side-scrolling + Outro ────
    introScene.classList.add('hidden');
    character.style.bottom = '22vh'; // Ground level above dialog (Fix 2)
    character.style.opacity = '1';

    const xScroll  = scrollY - DROP_DISTANCE;
    const currentX = Math.min(xScroll, maxScrollX);

    // Move the world strip horizontally
    worldStrip.style.transform = `translateY(0) translateX(${-currentX}px)`;

    // Determine scroll direction
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    // Face direction
    if (delta > 0 && facingLeft) {
      character.classList.remove('face-left');
      facingLeft = false;
    } else if (delta < 0 && !facingLeft) {
      character.classList.add('face-left');
      facingLeft = true;
    }

    // Walking animation control
    if (Math.abs(delta) > 0 && xScroll <= maxScrollX) {
      startWalking();
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(stopWalking, IDLE_TIMEOUT_MS);
    }

    // ── Phase 3: Outro ─────────────────────────
    if (xScroll > maxScrollX) {
      const outroProgress = Math.min(1, (xScroll - maxScrollX) / OUTRO_FADE_DISTANCE);
      outroScene.classList.remove('hidden');
      outroScene.style.display = 'flex';
      outroScene.style.opacity = outroProgress;
      outroScene.style.pointerEvents = 'auto'; // Re-enable clicks
      
      // Hide character so it doesn't bleed through black background (Fix 5)
      character.style.opacity = 1 - (outroProgress * 2);

      if (outroProgress > 0.15) {
        dialogContainer.classList.remove('visible');
        stopWalking();
      }
      return;
    }

    // Hide outro completely while in world (Fix 7)
    outroScene.classList.add('hidden');
    outroScene.style.opacity = 0;
    outroScene.style.pointerEvents = 'none';

    // ── Stage detection ────────────────────────
    // Use actual DOM offsets instead of fixed math since we added lead-in connector (Fix 3)
    const stagesAll = document.querySelectorAll('.stage');
    const xCenter = currentX + (viewportWidth / 2);
    let newStage = 0;
    
    for (let i = 0; i < stagesAll.length; i++) {
        const stageLeft = stagesAll[i].offsetLeft;
        const stageRight = stageLeft + stagesAll[i].offsetWidth;
        // If center of screen is past the left edge of this stage block
        if (xCenter >= stageLeft - (viewportWidth * 0.3)) {
            newStage = i;
        }
    }
    
    newStage = Math.max(0, Math.min(6, newStage));

    if (newStage !== currentStage) {
      currentStage = newStage;
      dialogContainer.classList.add('visible');
      typeText(dialogues[currentStage]);
    }
  });

  // ─────────────────────────────────────────────
  // Preload sprites to avoid flicker
  // ─────────────────────────────────────────────
  const preload1 = new Image();
  preload1.src = SPRITE_STANDING;
  const preload2 = new Image();
  preload2.src = SPRITE_WALKING;

});
