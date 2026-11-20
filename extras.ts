// Page transitions, first-visit loader, live Ankara clock, project video previews and party mode.

import { setParty, soundOn } from './sound';

const root = document.documentElement;
const ss = {
    get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
    del: (k: string) => { try { sessionStorage.removeItem(k); } catch { /* ignore */ } },
};

/* ───────── first-visit loader ───────── */
// Resolves when the page may play its entrance animation.
export function runLoader(reduceMotion: boolean): Promise<void> {
    if (!root.classList.contains('pre')) return Promise.resolve();
    ss.set('seen', '1');
    if (reduceMotion) { root.classList.remove('pre'); return Promise.resolve(); }
    const el = document.createElement('div');
    el.className = 'loader';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img src="/logo.png" alt="" width="210" height="79"><b>0</b><span class="loader-bar"><i></i></span><em>Loading the good stuff</em>';
    document.body.appendChild(el);
    root.classList.remove('pre');
    const num = el.querySelector('b')!;
    const bar = el.querySelector<HTMLElement>('.loader-bar i')!;
    return new Promise((resolve) => {
        const t0 = performance.now();
        const dur = 1500;
        const step = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            num.textContent = String(Math.round(e * 100));
            bar.style.transform = `scaleX(${e})`;
            if (p < 1) { requestAnimationFrame(step); return; }
            el.classList.add('done');
            setTimeout(resolve, 250);
            setTimeout(() => el.remove(), 1100);
        };
        requestAnimationFrame(step);
    });
}

/* ───────── page transitions: a lime curtain ───────── */
export function initTransitions(reduceMotion: boolean) {
    const curtain = document.createElement('div');
    curtain.className = 'curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = '<span></span>';
    document.body.appendChild(curtain);

    const label = (path: string) => {
        if (path.startsWith('/lab')) return 'Lab';
        if (path.startsWith('/uses')) return 'Uses';
        if (path.startsWith('/demos')) return 'Experiment';
        return 'Home';
    };

    // Arriving through a transition: curtain starts closed and lifts away
    if (root.classList.contains('tr')) {
        ss.del('tr');
        curtain.querySelector('span')!.textContent = label(location.pathname);
        curtain.classList.add('cover-now');
        root.classList.remove('tr');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            curtain.classList.remove('cover-now');
            curtain.classList.add('leave');
            setTimeout(() => curtain.classList.remove('leave'), 900);
        }));
    }
    window.addEventListener('pageshow', (e) => {
        if ((e as PageTransitionEvent).persisted) curtain.classList.remove('enter', 'cover-now');
    });

    if (reduceMotion) return;
    document.addEventListener('click', (e) => {
        const a = (e.target as Element).closest?.('a');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin) return;
        const samePage = url.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '');
        if (samePage) return;
        e.preventDefault();
        curtain.querySelector('span')!.textContent = label(url.pathname);
        curtain.classList.add('enter');
        ss.set('tr', '1');
        setTimeout(() => { location.href = url.href; }, 650);
    });
}

/* ───────── live clock in the footer ───────── */
export function initClock() {
    const foot = document.querySelector('.foot .wrap');
    if (!foot) return;
    const el = document.createElement('span');
    el.className = 'live';
    foot.appendChild(el);
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
    const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: 'numeric', hourCycle: 'h23' });
    const render = () => {
        const now = new Date();
        const h = Number(hourFmt.format(now));
        const mood = h < 7 ? 'probably asleep' : h < 10 ? 'on first coffee' : h < 19 ? 'building things' : h < 23 ? 'night shift' : 'shipping late';
        el.innerHTML = `<b></b>Ankara · ${fmt.format(now)} · ${mood}`;
    };
    render();
    setInterval(render, 20000);
}

/* ───────── project cards play a short clip on hover ───────── */
const PREVIEWS: Record<string, string> = {
    Farket: '/previews/farket.mp4',
    'ucler.': '/previews/ucler.mp4',
    'Tepkinne Web': '/previews/tepkinne-web.mp4',
};
export function initPreviews(finePointer: boolean, reduceMotion: boolean) {
    document.querySelectorAll<HTMLElement>('.card').forEach((card) => {
        const box = card.querySelector<HTMLElement>('.card-img');
        const title = card.querySelector('h3')?.textContent?.trim() ?? '';
        if (!box || box.classList.contains('no-image')) return;
        const src = PREVIEWS[title];
        if (!src) { box.classList.add('pan'); return; }
        if (!finePointer || reduceMotion) return;
        let video: HTMLVideoElement | null = null;
        card.addEventListener('pointerenter', () => {
            if (!video) {
                video = document.createElement('video');
                video.className = 'card-video';
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.preload = 'auto';
                video.src = src;
                video.setAttribute('aria-hidden', 'true');
                box.appendChild(video);
            }
            video.currentTime = 0;
            video.play().then(() => box.classList.add('playing')).catch(() => { /* ignore */ });
        });
        card.addEventListener('pointerleave', () => {
            box.classList.remove('playing');
            setTimeout(() => video?.pause(), 300);
        });
    });
}

/* ───────── party mode: Konami code, or click the logo five times ───────── */
export function initParty(reduceMotion: boolean) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
    let timer = 0;
    let off = 0;

    const confetti = () => {
        if (reduceMotion) return;
        const c = document.createElement('canvas');
        c.className = 'confetti';
        c.width = innerWidth;
        c.height = innerHeight;
        document.body.appendChild(c);
        const g = c.getContext('2d')!;
        const colors = ['#d9ff00', '#f2efe9', '#ff5ce1', '#4dd2ff', '#e6ff4d'];
        const bits = Array.from({ length: 180 }, () => ({
            x: innerWidth / 2 + (Math.random() - 0.5) * 200,
            y: innerHeight * 0.35,
            vx: (Math.random() - 0.5) * 18,
            vy: -Math.random() * 16 - 4,
            r: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
            w: 6 + Math.random() * 8,
            h: 4 + Math.random() * 6,
            c: colors[(Math.random() * colors.length) | 0],
        }));
        const t0 = performance.now();
        const frame = (now: number) => {
            g.clearRect(0, 0, c.width, c.height);
            bits.forEach((b) => {
                b.vy += 0.38; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
                g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c; g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.restore();
            });
            if (now - t0 < 3500) requestAnimationFrame(frame); else c.remove();
        };
        requestAnimationFrame(frame);
    };

    const stop = () => {
        root.classList.remove('party');
        setParty(false);
        toast.classList.remove('show');
        clearTimeout(off);
    };
    const start = () => {
        if (root.classList.contains('party')) { confetti(); return; }
        root.classList.add('party');
        setParty(true);
        confetti();
        toast.textContent = soundOn() ? 'Party mode on 🎉  Esc to stop' : 'Party mode on 🎉  Turn the sound on for the full thing';
        toast.classList.add('show');
        clearTimeout(timer);
        timer = window.setTimeout(() => toast.classList.remove('show'), 3500);
        clearTimeout(off);
        off = window.setTimeout(stop, 20000);
    };

    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0;
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && root.classList.contains('party')) { stop(); return; }
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
        if (pos === code.length) { pos = 0; start(); }
    });

    let clicks: number[] = [];
    document.querySelectorAll<HTMLAnchorElement>('.top .logo').forEach((logo) => {
        logo.addEventListener('click', (e) => {
            const home = location.pathname === '/' || location.pathname === '/index.html';
            if (!home) return;
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            const now = Date.now();
            clicks = [...clicks.filter((t) => now - t < 2500), now];
            logo.classList.remove('boing');
            void logo.offsetWidth;
            logo.classList.add('boing');
            if (clicks.length >= 5) { clicks = []; start(); }
        });
    });
}
