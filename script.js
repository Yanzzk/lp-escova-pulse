// ──────────────────────────────────────────────
// 1. HERO CANVAS — 140 frames · 60fps · Fluido
// Sem throttle de FPS · Pausa fora da tela
// Cache de escala · Motion blur premium
// ──────────────────────────────────────────────
(function () {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    const TOTAL = 140;
    const SPEED = 0.12;    // Slow-motion: ~7fps de conteúdo = ~19s por direção
    const BLUR  = 0.10;    // Motion blur leve para suavidade máxima
    const PATH  = (i) => `Gif-Images/Gif_${String(i).padStart(3, '0')}.jpg`;

    const images = new Array(TOTAL);
    let loaded    = 0;
    let current   = 0;
    let direction = 1;     // 1 = avança · -1 = retrocede (ping-pong seamless)
    let running   = false;
    let visible   = false;
    let tabActive = true;

    // ── Cache de escala (recalcula só no resize) ──
    let cachedScale = null;
    function invalidateCache() { cachedScale = null; }

    function resize() {
        const container = canvas.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width;
        canvas.height = rect.height;
        invalidateCache();
        if (images[Math.floor(current)]?.complete) draw(current);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // ── Draw com motion blur + cache de escala ──
    function draw(exactFrame) {
        const i1  = Math.floor(exactFrame);
        const i2  = (i1 + 1) % TOTAL;
        const img1 = images[i1];
        const img2 = images[i2];
        if (!img1?.complete || !img1.naturalWidth) return;

        const cw = canvas.width, ch = canvas.height;

        if (!cachedScale || cachedScale.cw !== cw || cachedScale.ch !== ch || cachedScale.iw !== img1.naturalWidth) {
            const iw = img1.naturalWidth, ih = img1.naturalHeight;
            const scale = Math.max(cw / iw, ch / ih);
            cachedScale = {
                cw, ch, iw,
                dw: iw * scale, dh: ih * scale,
                dx: (cw - iw * scale) / 2, dy: (ch - ih * scale) / 2
            };
        }
        const { dw, dh, dx, dy } = cachedScale;

        // Motion blur trace
        ctx.globalAlpha = BLUR;
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, cw, ch);

        // Frame principal
        ctx.globalAlpha = 1;
        ctx.drawImage(img1, dx, dy, dw, dh);

        // Blend suave com o próximo frame
        if (img2?.complete) {
            const fraction = exactFrame - i1;
            if (fraction > 0.02) {
                ctx.globalAlpha = fraction;
                ctx.drawImage(img2, dx, dy, dw, dh);
                ctx.globalAlpha = 1;
            }
        }
    }

    // ── RAF loop — 60fps · ping-pong seamless ──
    function animate() {
        if (!running) return;
        if (visible && tabActive) {
            draw(current);
            current += SPEED * direction;
            // Ping-pong: inverte no final → seamless sem salto
            if (current >= TOTAL - 1) {
                current   = TOTAL - 1;
                direction = -1;
            } else if (current <= 0) {
                current   = 0;
                direction = 1;
            }
        }
        requestAnimationFrame(animate);
    }

    function startLoop() {
        if (running) return;
        running = true;
        requestAnimationFrame(animate);
    }

    // ── Pausa quando canvas sai da viewport (economiza CPU) ──
    const visiObs = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    visiObs.observe(canvas);

    // ── Pausa quando aba perde foco (economiza bateria) ──
    document.addEventListener('visibilitychange', () => {
        tabActive = document.visibilityState === 'visible';
    });

    // ── Carregamento em lote progressivo ──
    function loadBatch(start, end, cb) {
        let done = 0;
        const count = Math.min(end, TOTAL) - start;
        for (let i = start; i < Math.min(end, TOTAL); i++) {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                loaded++;
                done++;
                if (i === 0) { draw(0); visible = true; }
                if (loaded === 30) startLoop();
                if (done === count && cb) cb();
            };
            img.onerror = () => done++;
            img.src = PATH(i);
            images[i] = img;
        }
    }

    loadBatch(0, 30, () => setTimeout(() => loadBatch(30, 80, () => setTimeout(() => loadBatch(80, TOTAL), 200)), 200));
})();



// ──────────────────────────────────────────────
// 2. COUNTDOWN — Persistent per session
// ──────────────────────────────────────────────
(function () {
    const KEY = 'pulse_deadline_v3';
    let deadline = +sessionStorage.getItem(KEY) || 0;
    if (!deadline || deadline < Date.now()) {
        deadline = Date.now() + (2 * 3600 + 47 * 60) * 1000; // 2h 47m
        sessionStorage.setItem(KEY, deadline);
    }

    const elH = document.getElementById('c-hours');
    const elM = document.getElementById('c-minutes');
    const elS = document.getElementById('c-seconds');
    if (!elH) return;

    const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
    function tick() {
        const diff = Math.max(0, deadline - Date.now());
        const s = Math.floor(diff / 1000);
        elH.textContent = pad(Math.floor(s / 3600));
        elM.textContent = pad(Math.floor((s % 3600) / 60));
        elS.textContent = pad(s % 60);
        if (diff > 0) setTimeout(tick, 1000);
    }
    tick();
})();


// ──────────────────────────────────────────────
// 3. SCARCITY — Credible numbers (Hormozi)
// ──────────────────────────────────────────────
(function () {
    // Stock: 11–17 (believable range, not "7")
    const stock = Math.floor(Math.random() * 7) + 11;
    document.querySelectorAll('#stock-count').forEach(el => {
        el.textContent = stock;
    });
    // Buyers today: 19–29
    const buyers = Math.floor(Math.random() * 11) + 19;
    document.querySelectorAll('#today-buyers').forEach(el => {
        el.textContent = buyers + ' pessoas';
    });
})();


// ──────────────────────────────────────────────
// 4. SCROLL ANIMATIONS — IntersectionObserver
// ──────────────────────────────────────────────
(function () {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });

    document.querySelectorAll('.anim-el').forEach(el => io.observe(el));
})();


// ──────────────────────────────────────────────
// 5. HERO ELEMENTS — Trigger on load
// ──────────────────────────────────────────────
window.addEventListener('load', () => {
    document.querySelectorAll('.hero .anim-el').forEach(el => el.classList.add('visible'));
}, { once: true });


// ──────────────────────────────────────────────
// 6. TRUST BAR — Hide on scroll-down, show on up
// ──────────────────────────────────────────────
(function () {
    const bar = document.getElementById('trustBar');
    if (!bar) return;
    let lastY = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        bar.classList.toggle('hidden', y > 200 && y > lastY);
        lastY = y;
    }, { passive: true });
})();


// ──────────────────────────────────────────────
// 7. STICKY CTA — Appear past hero
// ──────────────────────────────────────────────
(function () {
    const cta = document.getElementById('stickyCta');
    if (!cta) return;
    window.addEventListener('scroll', () => {
        cta.classList.toggle('show', window.scrollY > window.innerHeight * 0.75);
    }, { passive: true });
})();


// ──────────────────────────────────────────────
// 8. SMOOTH SCROLL — All hash anchors
// ──────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = 44; // trust bar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});


// ──────────────────────────────────────────────
// 9. LIVE BUYERS — Chip compacto (anti-interrupção)
// Minimalista · 1 linha · canto superior direito
// ──────────────────────────────────────────────
(function () {
    const names  = ['Ana', 'Carla', 'Juliana', 'Fernanda', 'Thaís', 'Raquel', 'Beatriz', 'Larissa', 'Mariana', 'Camila'];
    const cities = ['SP', 'RJ', 'BH', 'Curitiba', 'Fortaleza', 'Brasília', 'Recife', 'Campinas'];

    const chip = document.createElement('div');
    chip.className = 'buyer-toast';
    chip.setAttribute('aria-live', 'polite');
    chip.setAttribute('aria-atomic', 'true');
    chip.style.cssText = `
      position:fixed;top:48px;right:12px;z-index:997;
      background:rgba(22,22,22,0.96);
      border:1px solid rgba(201,169,110,0.22);
      border-radius:100px;
      padding:6px 12px 6px 8px;
      display:inline-flex;align-items:center;gap:6px;
      font-family:'Outfit',sans-serif;font-size:0.68rem;
      color:#C8BEB2;letter-spacing:0.02em;
      box-shadow:0 4px 16px rgba(0,0,0,0.5);
      max-width:210px;white-space:nowrap;overflow:hidden;
      transform:translateY(-72px);
      transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s ease;
      opacity:0;pointer-events:none;
    `;
    document.body.appendChild(chip);

    function randomEl(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function showToast() {
        const name = randomEl(names);
        const city = randomEl(cities);

        chip.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
            <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span><strong style="color:#F8F5F0;font-weight:600;">${name} (${city})</strong> comprou agora</span>
        `;

        // Entrada
        requestAnimationFrame(() => {
            chip.style.transform  = 'translateY(0)';
            chip.style.opacity    = '1';

            // Saída após 2.6 segundos
            setTimeout(() => {
                chip.style.transform = 'translateY(-72px)';
                chip.style.opacity   = '0';
            }, 2600);
        });
    }

    // Primeira aparição após 12s · depois a cada 40–70s aleatório
    setTimeout(() => {
        showToast();
        setInterval(showToast, 40000 + Math.random() * 30000);
    }, 12000);
})();


// ──────────────────────────────────────────────
// 10. IMAGE PROTECTION (Anti-Spy/Anti-Download)
// ──────────────────────────────────────────────
(function () {
    document.addEventListener('contextmenu', function (e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    }, false);

    document.addEventListener('dragstart', function (e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    }, false);
})();

// ──────────────────────────────────────────────
// 11. SECURITY & PERFORMANCE (CTA Debounce)
// ──────────────────────────────────────────────
(function () {
    const ctas = document.querySelectorAll('a.btn, button.btn');
    let isProcessing = false;

    ctas.forEach(cta => {
        cta.addEventListener('click', function (e) {
            if (isProcessing) {
                e.preventDefault();
                return false;
            }
            isProcessing = true;
            setTimeout(() => { isProcessing = false; }, 2000); // 2s debounce
        });
    });

    // Global Sanitization Helper
    window.sanitizeHTML = function (str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };
})();
