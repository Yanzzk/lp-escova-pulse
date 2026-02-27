/* ═══════════════════════════
   ESCOVA PULSE — script.js
═══════════════════════════ */

// ── COUNTDOWN TIMER ─────────────────────────
(function () {
    // Calcula o fim do timer (persistente na sessão)
    const storageKey = 'pulse_deadline';
    let deadline = sessionStorage.getItem(storageKey);
    if (!deadline) {
        // 2h30min a partir do primeiro acesso
        deadline = Date.now() + (2 * 60 + 30) * 60 * 1000;
        sessionStorage.setItem(storageKey, deadline);
    }

    const h = document.getElementById('c-hours');
    const m = document.getElementById('c-minutes');
    const s = document.getElementById('c-seconds');
    if (!h) return;

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
        const diff = Math.max(0, deadline - Date.now());
        const totalSec = Math.floor(diff / 1000);
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        h.textContent = pad(hrs);
        m.textContent = pad(mins);
        s.textContent = pad(secs);
        if (diff > 0) requestAnimationFrame(tick);
    }
    tick();
})();

// ── STOCK SCARCITY (RANDOM 5–9) ─────────────
(function () {
    const count = Math.floor(Math.random() * 5) + 5; // 5 a 9
    document.querySelectorAll('#stock-count, #stock-count-2').forEach(el => {
        if (el) el.textContent = count + ' unidades';
    });
})();

// ── STICKY CTA — mostra após rolar 600px ─────
(function () {
    const stickyCta = document.getElementById('sticky-cta');
    if (!stickyCta) return;
    let shown = false;
    window.addEventListener('scroll', function () {
        if (window.scrollY > 600 && !shown) {
            stickyCta.style.display = 'block';
            shown = true;
        }
    }, { passive: true });
})();

// ── SMOOTH SCROLL para todos os âncoras ──────
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ── ANIMAÇÕES ao entrar na viewport ─────────
(function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(
        '.feature-card, .pain__card, .testimonial-card, .anchor-card, .faq__item'
    ).forEach(el => {
        el.classList.add('anim-fadeup');
        observer.observe(el);
    });
})();
