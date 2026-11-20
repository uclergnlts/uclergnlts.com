// Shared script for the home, Lab and Uses pages. No framework, no heavy libraries:
// the look comes from style.css, this file only adds small behaviours.

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

// Gentle reveal on scroll
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
} else {
    reveals.forEach((el) => el.classList.add('in'));
}

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
