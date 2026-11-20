// Site soundtrack and interface sounds, all synthesised with Web Audio (no audio files).
// Off by default. The header button turns it on; the choice is remembered for the next page,
// where it resumes on the visitor's first click or key press (browsers need a gesture).

type Voice = { stop: (t: number) => void };

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let uiBus: GainNode;
let analyser: AnalyserNode;
let delayIn: GainNode;
let noiseBuf: AudioBuffer;
let timer = 0;
let on = false;
let step = 0;
let nextTime = 0;
let party = false;
const levels = new Uint8Array(64);

const BPM = 82;
const SIXTEENTH = 60 / BPM / 4;
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// Am9, Fmaj7, Cmaj7, G6, two bars each
const CHORDS = [
    { root: 45, notes: [57, 60, 64, 67, 71] },
    { root: 41, notes: [57, 60, 64, 65, 69] },
    { root: 48, notes: [55, 60, 64, 67, 71] },
    { root: 43, notes: [55, 59, 62, 64, 67] },
];
const SCALE = [69, 72, 74, 76, 79, 81, 84, 86, 88];

const store = {
    get: () => { try { return localStorage.getItem('sound') === 'on'; } catch { return false; } },
    set: (v: boolean) => { try { localStorage.setItem('sound', v ? 'on' : 'off'); } catch { /* private mode */ } },
};

function build() {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master = ctx.createGain();
    master.gain.value = 0;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    master.connect(comp).connect(analyser).connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.9;
    musicBus.connect(master);
    uiBus = ctx.createGain();
    uiBus.gain.value = 1;
    uiBus.connect(comp);

    // dotted-eighth echo for the plucks
    delayIn = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = SIXTEENTH * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2200;
    delayIn.connect(delay).connect(tone).connect(fb).connect(delay);
    tone.connect(musicBus);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function pad(freq: number, t: number, dur: number) {
    if (!ctx) return;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(1100, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(600, t + dur);
    f.Q.value = 0.6;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 1.2);
    g.gain.setValueAtTime(0.045, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0, t + dur + 1.6);
    f.connect(g).connect(musicBus);
    [-7, 6].forEach((cents) => {
        const o = ctx!.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        o.detune.value = cents;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 1.7);
    });
}

function bass(freq: number, t: number, dur: number) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + dur + 0.05);
}

function pluck(freq: number, t: number, vol = 0.07, out: AudioNode = musicBus): Voice {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.9);
    o.connect(g);
    g.connect(out);
    if (out === musicBus) g.connect(delayIn);
    o.start(t);
    o.stop(t + 1);
    return { stop: (s) => o.stop(s) };
}

function kick(t: number, vol = 0.22) {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + 0.4);
}

function hat(t: number, vol = 0.018, len = 0.04) {
    const s = ctx!.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx!.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + len);
    s.connect(f).connect(g).connect(musicBus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + len + 0.01);
}

function crackle(t: number) {
    const s = ctx!.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx!.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2500 + Math.random() * 3000;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.012 * Math.random(), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    s.connect(f).connect(g).connect(musicBus);
    s.start(t, Math.random() * 0.9);
    s.stop(t + 0.02);
}

let lastNote = 3;
function schedule() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.15) {
        const t = nextTime;
        const inBar = step % 16;
        const bar = Math.floor(step / 16);
        const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
        if (step % 32 === 0) chord.notes.forEach((n) => pad(midi(n), t, SIXTEENTH * 32));
        if (inBar === 0 || inBar === 10) bass(midi(chord.root), t, SIXTEENTH * (inBar === 0 ? 9 : 6));
        if (inBar === 0 || inBar === 8 || (party && inBar % 4 === 0)) kick(t, party ? 0.26 : 0.16);
        if (inBar % 4 === 2) hat(t, party ? 0.03 : 0.016);
        if (party && inBar % 2 === 1) hat(t, 0.012, 0.02);
        const density = party ? 0.75 : 0.32;
        if (inBar % 2 === 0 && Math.random() < density) {
            lastNote = Math.max(0, Math.min(SCALE.length - 1, lastNote + Math.round((Math.random() - 0.5) * 4)));
            pluck(midi(SCALE[lastNote]), t + (Math.random() * 0.012), party ? 0.06 : 0.05);
        }
        if (Math.random() < 0.25) crackle(t + Math.random() * SIXTEENTH);
        step++;
        nextTime += SIXTEENTH;
    }
}

function start() {
    if (!ctx) build();
    if (!ctx) return;
    ctx.resume();
    on = true;
    nextTime = ctx.currentTime + 0.08;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2.2);
    clearInterval(timer);
    timer = window.setInterval(schedule, 25);
    schedule();
}

function stop() {
    on = false;
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    const c = ctx;
    setTimeout(() => { if (!on) { clearInterval(timer); c.suspend(); } }, 700);
}

/** 0..1 loudness of the music right now (0 when off) */
export function soundLevel() {
    if (!on || !ctx) return 0;
    analyser.getByteFrequencyData(levels);
    let sum = 0;
    for (let i = 1; i < 24; i++) sum += levels[i];
    return sum / (23 * 255);
}

export function soundOn() { return on; }

/** Faster, busier music plus a fanfare, used by party mode */
export function setParty(v: boolean) {
    party = v;
    if (v && on && ctx) {
        const t = ctx.currentTime + 0.02;
        [69, 73, 76, 81, 85, 88].forEach((n, i) => pluck(midi(n), t + i * 0.07, 0.09, uiBus));
    }
}

/** Tiny tick on hover and a soft pluck on click */
export function uiSound(kind: 'hover' | 'click') {
    if (!on || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    if (kind === 'hover') {
        o.type = 'sine';
        o.frequency.setValueAtTime(1900, t);
        o.frequency.exponentialRampToValueAtTime(1500, t + 0.05);
        g.gain.setValueAtTime(0.025, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
    } else {
        o.type = 'triangle';
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(440, t + 0.09);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);
    }
    o.connect(g).connect(uiBus);
    o.start(t);
    o.stop(t + 0.2);
}

export function initSound() {
    const wrap = document.querySelector('.top .wrap');
    if (!wrap) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sound-btn';
    btn.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound-label">Sound</span>';
    wrap.insertBefore(btn, wrap.querySelector('.menu-btn'));
    const bars = Array.from(btn.querySelectorAll<HTMLElement>('.eq i'));

    const render = () => {
        btn.setAttribute('aria-pressed', String(on));
        btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
        btn.classList.toggle('on', on);
        btn.querySelector('.sound-label')!.textContent = on ? 'Sound on' : 'Sound';
    };
    render();

    btn.addEventListener('click', () => {
        if (on) stop(); else start();
        store.set(on);
        render();
        if (on) uiSound('click');
    });

    // Resume on the first gesture if sound was on on the previous page
    if (store.get()) {
        btn.classList.add('pending');
        const resume = (e: Event) => {
            if ((e.target as Element)?.closest?.('.sound-btn')) return;
            if (store.get() && !on) { start(); render(); }
            btn.classList.remove('pending');
            ['pointerdown', 'keydown'].forEach((n) => window.removeEventListener(n, resume, true));
        };
        ['pointerdown', 'keydown'].forEach((n) => window.addEventListener(n, resume, true));
    }

    // Equaliser bars follow the music
    const bins = [2, 5, 9, 14];
    const tick = () => {
        if (on && ctx) {
            analyser.getByteFrequencyData(levels);
            bars.forEach((b, i) => { b.style.transform = `scaleY(${0.15 + (levels[bins[i]] / 255) * 0.85})`; });
        } else {
            bars.forEach((b) => { b.style.transform = ''; });
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Interface sounds
    let lastHover: Element | null = null;
    document.addEventListener('pointerover', (e) => {
        const el = (e.target as Element).closest?.('a, button');
        if (el && el !== lastHover) uiSound('hover');
        lastHover = el;
    });
    document.addEventListener('click', (e) => {
        if ((e.target as Element).closest?.('a, button:not(.sound-btn)')) uiSound('click');
    });
}
