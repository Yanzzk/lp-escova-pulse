/* ═══════════════════════════════════════════════
   ESCOVA PULSE — script.js
   Canvas image sequence + countdown + scroll FX
═══════════════════════════════════════════════ */

// ──────────────────────────────
// 1. CANVAS IMAGE SEQUENCE (Slow-motion hero)
// ──────────────────────────────
(function () {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const TOTAL_FRAMES = 140;
    const FPS = 18; // slow motion feel
    const framePath = (i) => `Gif-Images/Gif_${String(i).padStart(3, '0')}.jpg`;

    let images = [];
    let loaded = 0;
    let currentFrame = 0;
    let direction = 1; // 1 = forward, -1 = backward (ping-pong loop)
    let animating = false;
    let lastTime = 0;
    const interval = 1000 / FPS;

    // Resize canvas to match viewport
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (images[currentFrame] && images[currentFrame].complete) {
            drawFrame(currentFrame);
        }
    }
    window.addEventListener('resize', resize);
    resize();

    // Draw a single frame with cover behavior + slight motion blur
    function drawFrame(index) {
        const img = images[index];
        if (!img || !img.complete || !img.naturalWidth) return;

        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // object-fit: cover math
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        // Motion blur: draw previous frame with low opacity
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, cw, ch);

        ctx.globalAlpha = 1;
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    // Animation loop
    function animate(timestamp) {
        if (!animating) return;
        const delta = timestamp - lastTime;
        if (delta >= interval) {
            lastTime = timestamp - (delta % interval);

            drawFrame(currentFrame);
            currentFrame += direction;

            // Ping-pong at boundaries
            if (currentFrame >= TOTAL_FRAMES - 1) {
                currentFrame = TOTAL_FRAMES - 1;
                direction = -1;
            } else if (currentFrame <= 0) {
                currentFrame = 0;
                direction = 1;
            }
        }
        requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (animating) return;
        animating = true;
        lastTime = performance.now();
        requestAnimationFrame(animate);
    }

    // Preload images in batches for performance
    function preloadBatch(start, end) {
        for (let i = start; i < end && i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = framePath(i);
            img.onload = () => {
                loaded++;
                // Draw first frame immediately
                if (i === 0) {
                    drawFrame(0);
                }
                // Start animation when first 30 frames are ready
                if (loaded >= 30) {
                    startAnimation();
                }
            };
            images[i] = img;
        }
    }

    // Load in progressive batches: first 30, then rest
    preloadBatch(0, 30);
    setTimeout(() => preloadBatch(30, 80), 800);
    setTimeout(() => preloadBatch(80, TOTAL_FRAMES), 1600);
})();


// ──────────────────────────────
// 2. COUNTDOWN TIMER (Session-persistent)
// ──────────────────────────────
(function () {
    const key = 'pulse_deadline';
    let deadline = sessionStorage.getItem(key);
    if (!deadline) {
        deadline = Date.now() + (2 * 60 + 30) * 60 * 1000; // 2h30m
        sessionStorage.setItem(key, deadline);
    }

    const h = document.getElementById('c-hours');
    const m = document.getElementById('c-minutes');
    const s = document.getElementById('c-seconds');
    if (!h) return;

    const pad = (n) => String(n).padStart(2, '0');

    function tick() {
        const diff = Math.max(0, deadline - Date.now());
        const totalSec = Math.floor(diff / 1000);
        h.textContent = pad(Math.floor(totalSec / 3600));
        m.textContent = pad(Math.floor((totalSec % 3600) / 60));
        s.textContent = pad(totalSec % 60);
        if (diff > 0) requestAnimationFrame(tick);
    }
    tick();
})();


// ──────────────────────────────
// 3. SCARCITY COUNTER
// ──────────────────────────────
(function () {
    const count = Math.floor(Math.random() * 5) + 5;
    document.querySelectorAll('#stock-count, #stock-count-2').forEach(el => {
        if (el) el.textContent = count + ' unidades';
    });
})();


// ──────────────────────────────
// 4. SCROLL ANIMATIONS (Intersection Observer)
// ──────────────────────────────
(function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.anim-el').forEach(el => observer.observe(el));
})();


// ──────────────────────────────
// 5. TRUST BAR — Hide on scroll down, show on scroll up
// ──────────────────────────────
(function () {
    const bar = document.getElementById('trustBar');
    if (!bar) return;
    let lastY = 0;

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y > 300 && y > lastY) {
            bar.classList.add('hidden');
        } else {
            bar.classList.remove('hidden');
        }
        lastY = y;
    }, { passive: true });
})();


// ──────────────────────────────
// 6. STICKY CTA — Show after scrolling past hero
// ──────────────────────────────
(function () {
    const sticky = document.getElementById('stickyCta');
    if (!sticky) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight * 0.8) {
            sticky.classList.add('show');
        } else {
            sticky.classList.remove('show');
        }
    }, { passive: true });
})();


// ──────────────────────────────
// 7. SMOOTH SCROLL for all hash links
// ──────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});


// ──────────────────────────────
// 8. HERO ELEMENTS — trigger visible on load
// ──────────────────────────────
window.addEventListener('load', () => {
    document.querySelectorAll('.hero .anim-el').forEach(el => {
        el.classList.add('visible');
    });
});
