// Shared script for the home, Lab and Uses pages. No framework, no heavy libraries:
// the look comes from style.css, this file only adds small behaviours.

import { initSound } from './sound';
import { initTransitions, runLoader, initClock, initPreviews, initParty } from './extras';

const root = document.documentElement;
root.classList.remove('no-js');
root.classList.add('js');

// Header: thin line under it once the page scrolls
const header = document.querySelector<HTMLElement>('.top');
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn');
const setMenu = (open: boolean) => {
    document.body.classList.toggle('menu-open', open);
    menuBtn?.setAttribute('aria-expanded', String(open));
    menuBtn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuBtn?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Split headlines into words so each one can rise out of a mask
const splitWords = (el: HTMLElement) => {
    let i = 0;
    const wrap = (node: Node) => {
        const outer = document.createElement('span');
        outer.className = 'w';
        const inner = document.createElement('span');
        inner.className = 'wi';
        inner.style.setProperty('--i', String(i++));
        inner.appendChild(node);
        outer.appendChild(inner);
        return outer;
    };
    Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            (node.textContent ?? '').split(/(\s+)/).forEach((part) => {
                if (!part) return;
                frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
            });
            el.replaceChild(frag, node);
        } else {
            const placeholder = document.createComment('');
            el.replaceChild(placeholder, node);
            el.replaceChild(wrap(node), placeholder);
        }
    });
    el.classList.add('split');
};
const splitTargets = document.querySelectorAll<HTMLElement>('.hero h1, .intro h1, .nf h1, .head h2, .about-text h2, .contact h2');
splitTargets.forEach(splitWords);

// Stagger siblings that reveal together (cards in a row, list items)
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
reveals.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const siblings = Array.from(parent.children).filter((c) => c.classList.contains('reveal'));
    if (siblings.length > 1) el.style.setProperty('--d', `${(siblings.indexOf(el) % 3) * 110}ms`);
});

// Reveal on scroll
const observed = [...Array.from(reveals), ...Array.from(splitTargets).filter((h) => !h.closest('.hero, .intro, .nf'))];
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    observed.forEach((el) => io.observe(el));
} else {
    observed.forEach((el) => el.classList.add('in'));
}

// Hero entrance once the first frame is painted
const start = () => requestAnimationFrame(() => {
    root.classList.add('loaded');
    document.querySelectorAll('.hero h1, .intro h1, .nf h1').forEach((h) => h.classList.add('in'));
});
const fontsReady = document.fonts?.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]) : Promise.resolve();
fontsReady.then(() => runLoader(reduceMotion)).then(start);

initSound();
initTransitions(reduceMotion);
initClock();
initParty(reduceMotion);
// The hero shader is decoration: start it once the page has loaded and the
// main thread is idle, so it never competes with the first paint.
if (document.querySelector('.hero')) {
    const startGL = () => import('./heroGL').then((m) => m.initHeroGL(reduceMotion));
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(startGL, { timeout: 2000 }) : setTimeout(startGL, 300));
    if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
}

// Stats count up
const stats = document.querySelectorAll<HTMLElement>('.stat b');
stats.forEach((b) => {
    const text = b.textContent ?? '';
    const match = text.match(/^(\d+)(.*)$/);
    if (!match) { b.innerHTML = `<span class="inf">${text}</span>`; return; }
    if (reduceMotion) return;
    const target = Number(match[1]);
    const suffix = match[2];
    b.textContent = `0${suffix}`;
    setTimeout(() => {
        const t0 = performance.now();
        const step = (now: number) => {
            const p = Math.min((now - t0) / 1600, 1);
            b.textContent = `${Math.round(target * (1 - Math.pow(1 - p, 4)))}${suffix}`;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, 1000);
});

// Scroll progress bar + marquee that reacts to scroll speed and direction
const bar = document.createElement('div');
bar.className = 'progress';
bar.setAttribute('aria-hidden', 'true');
document.body.appendChild(bar);
const tickerAnim = document.querySelector<HTMLElement>('.ticker-track')?.getAnimations()[0];
let lastY = window.scrollY;
let speed = 1;
let dir = 1;
const heroImg = document.querySelector<HTMLElement>('.hero .fig');
const frame = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (!reduceMotion) {
        const v = y - lastY;
        if (Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1;
        const targetSpeed = dir * (1 + Math.min(Math.abs(v) / 6, 5));
        speed += (targetSpeed - speed) * 0.08;
        if (tickerAnim) tickerAnim.playbackRate = speed;
        if (heroImg && y < window.innerHeight * 1.2) heroImg.style.transform = `translateY(${y * 0.12}px)`;
    }
    lastY = y;
    requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

if (!reduceMotion && finePointer) {
    // Hero glow follows the pointer
    const hero = document.querySelector<HTMLElement>('.hero');
    hero?.addEventListener('pointerenter', () => hero.classList.add('glow'));
    hero?.addEventListener('pointerleave', () => hero.classList.remove('glow'));
    hero?.addEventListener('pointermove', (e) => {
        hero.classList.add('glow');
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--gx', `${e.clientX - r.left}px`);
        hero.style.setProperty('--gy', `${e.clientY - r.top}px`);
    });

    // Cards tilt towards the pointer, with a soft lime spotlight
    document.querySelectorAll<HTMLElement>('.card, .exp, .rules li, .stack-col, .tool, .stat').forEach((el) => {
        el.classList.add('spot');
        const tilt = el.matches('.card, .exp') ? 5 : 3;
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            el.style.setProperty('--mx', `${x * 100}%`);
            el.style.setProperty('--my', `${y * 100}%`);
            el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * tilt}deg) rotateY(${(x - 0.5) * tilt}deg) translateY(-4px)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // Magnetic buttons
    document.querySelectorAll<HTMLElement>('.btn, .card-go, .socials a').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // Cursor: a lime dot plus a ring that grows over links and says "View" on projects
    const ring = document.createElement('div');
    ring.className = 'cursor hidden';
    ring.innerHTML = '<span>View ↗</span>';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot hidden';
    ring.setAttribute('aria-hidden', 'true');
    dot.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot);
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
        ring.classList.remove('hidden'); dot.classList.remove('hidden');
        const t = e.target as Element;
        const onCard = !!t.closest?.('.card:has(.more), .exp');
        ring.classList.toggle('view', onCard);
        ring.classList.toggle('hover', !onCard && !!t.closest?.('a, button, input, textarea, label'));
    });
    document.addEventListener('pointerleave', () => { ring.classList.add('hidden'); dot.classList.add('hidden'); });
    window.addEventListener('pointerdown', () => ring.classList.add('press'));
    window.addEventListener('pointerup', () => ring.classList.remove('press'));
    const follow = () => {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);

    // Whole project card opens its link
    document.querySelectorAll<HTMLElement>('.card').forEach((card) => {
        const link = card.querySelector<HTMLAnchorElement>('a.more');
        if (!link) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if ((e.target as Element).closest('a')) return;
            window.open(link.href, '_blank', 'noopener');
        });
    });
}

// Section labels type themselves in
const glyphs = '01<>/{}_#*';
document.querySelectorAll<HTMLElement>('.head .mono, .about-text > .mono, .contact-left > .mono').forEach((el) => {
    if (reduceMotion) return;
    const final = el.textContent ?? '';
    const io2 = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io2.disconnect();
        let n = 0;
        const run = () => {
            n += 1;
            el.textContent = final.split('').map((ch, k) => (k < n / 2 || ch === ' ' ? ch : glyphs[(k + n) % glyphs.length])).join('');
            if (n / 2 < final.length) setTimeout(run, 22);
            else el.textContent = final;
        };
        run();
    });
    io2.observe(el);
});

// Contact form: no backend, so the message is handed to WhatsApp ready to send.
const WHATSAPP = '905448263533';
const contactForm = document.getElementById('contactForm') as HTMLFormElement | null;
contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const text = [
        `Hi Üçler, I'm ${data.get('name')} (${data.get('email')}).`,
        '',
        String(data.get('message') || ''),
    ].join('\n');
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    const btn = contactForm.querySelector('button');
    if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Opening WhatsApp…';
        setTimeout(() => { btn.textContent = original; }, 3000);
    }
});

// Projects without a screenshot yet get a title card instead of a broken image
document.querySelectorAll<HTMLImageElement>('.card-img img').forEach((img) => {
    const fallback = () => {
        const box = img.parentElement;
        if (!box) return;
        box.classList.add('no-image');
        box.setAttribute('data-title', img.closest('.card')?.querySelector('h3')?.textContent ?? '');
        img.remove();
    };
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener('error', fallback, { once: true });
});

initPreviews(finePointer, reduceMotion);
