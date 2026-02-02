import './style.css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
// Lenis import might differ depending on version, using default simple import or global fallback
// Assuming @studio-freight/lenis or lenis is installed as 'lenis' or '@studio-freight/lenis'
import Lenis from '@studio-freight/lenis'

gsap.registerPlugin(ScrollTrigger);

// === SMOOTH SCROLL ===
const lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
} as any);

function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// === CUSTOM CURSOR ===
const cursorDot = document.querySelector('.cursor-dot') as HTMLElement;
const cursorCircle = document.querySelector('.cursor-circle') as HTMLElement;
const hoverElements = document.querySelectorAll('a, button, .service-header, .project-card');

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot follows immediately
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
});

// Circle follows with lerp
function animateCursor() {
    const dt = 1.0 - Math.pow(1.0 - 0.15, 1); // Lerp factor

    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;

    cursorCircle.style.left = `${cursorX}px`;
    cursorCircle.style.top = `${cursorY}px`;

    requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover effects
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursorCircle.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursorCircle.classList.remove('hovered'));
});

// === CANVAS BACKGROUND ===
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;

if (canvas) {
    const ctx = canvas.getContext('2d')!;

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = 50; // Minimalist count

    class Particle {
        x: number;
        y: number;
        size: number;
        speedX: number;
        speedY: number;
        opacity: number;

        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse interaction
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) {
                this.x -= dx * 0.01;
                this.y -= dy * 0.01;
            }

            // Wrap around screen
            if (this.x > width) this.x = 0;
            else if (this.x < 0) this.x = width;
            if (this.y > height) this.y = 0;
            else if (this.y < 0) this.y = height;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Grid lines
    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        const gridSize = 100;

        // Parallax grid offset based on mouse
        const offsetX = (mouseX / width - 0.5) * 20;
        const offsetY = (mouseY / height - 0.5) * 20;

        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x + offsetX, 0);
            ctx.lineTo(x + offsetX, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + offsetY);
            ctx.lineTo(width, y + offsetY);
            ctx.stroke();
        }
    }

    function initParticles() {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animateCanvas() {
        ctx.clearRect(0, 0, width, height);

        drawGrid();

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animateCanvas);
    }

    initParticles();
    animateCanvas();

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });
}

// === GSAP ANIMATIONS ===

// Loading Animation
const loader = document.querySelector('.loader') as HTMLElement;

window.addEventListener('load', () => {
    if (loader) {
        gsap.to(loader, {
            opacity: 0,
            duration: 1,
            delay: 0.5,
            onComplete: () => {
                loader.style.display = 'none';
                startHeroAnimations();
            }
        });
    } else {
        // If no loader, just start hero animations immediately (or check if hero exists)
        startHeroAnimations();
    }
});

function startHeroAnimations() {
    const tl = gsap.timeline();

    tl.to('.reveal-text', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out',
        onComplete: () => {
            // Start typewriter after reveal animations
            startTypewriter();
        }
    })
        .to('.profile-frame', {
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: 'back.out(1.7)'
        }, '-=0.8');
}

// Typewriter Animation for DEVELOPER - Looping
function startTypewriter() {
    const typewriterEl = document.querySelector('.typewriter') as HTMLElement;
    if (!typewriterEl) return;

    const text = typewriterEl.dataset.text || 'DEVELOPER';
    let currentIndex = 0;
    let isDeleting = false;

    function type() {
        if (!isDeleting) {
            // Typing
            if (currentIndex < text.length) {
                typewriterEl.textContent = text.substring(0, currentIndex + 1);
                currentIndex++;
                setTimeout(type, 100);
            } else {
                // Finished typing, wait then start deleting
                typewriterEl.classList.add('finished');
                setTimeout(() => {
                    isDeleting = true;
                    typewriterEl.classList.remove('finished');
                    type();
                }, 2000); // Wait 2 seconds before deleting
            }
        } else {
            // Deleting
            if (currentIndex > 0) {
                typewriterEl.textContent = text.substring(0, currentIndex - 1);
                currentIndex--;
                setTimeout(type, 50); // Delete faster
            } else {
                // Finished deleting, wait then start typing again
                isDeleting = false;
                setTimeout(type, 500); // Wait 0.5 seconds before typing again
            }
        }
    }

    type();
}

// Scroll Reveals
gsap.utils.toArray('.section-title, .about-text, .service-item, .project-card').forEach((el: any) => {
    gsap.from(el, {
        scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });
});

// Parallax for Profile Image
gsap.to('.profile-frame', {
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    },
    y: 200,
    rotation: -5
});

// Contact Form 3D Tilt
const contactWrapper = document.querySelector('.contact-wrapper') as HTMLElement;
document.addEventListener('mousemove', (e) => {
    if (!contactWrapper) return;
    const rect = contactWrapper.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
        const x = (e.clientX - window.innerWidth / 2) / 50;
        gsap.to('.big-text', {
            x: x,
            duration: 1
        });
    }
});

// Contact Form Submission (Mock)
const contactForm = document.getElementById('contactForm') as HTMLFormElement;
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button');
        const originalText = btn?.innerText || 'Send';

        if (btn) btn.innerText = 'Sending...';

        // Simulate API call
        setTimeout(() => {
            if (btn) {
                btn.innerText = 'Sent! 🚀';
                btn.style.background = '#00ff88';
                btn.style.color = '#000';
            }
            alert('Thanks for reaching out! This is a demo form, but in a real version, this would fly to my inbox.');
            contactForm.reset();

            setTimeout(() => {
                if (btn) {
                    btn.innerText = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                }
            }, 3000);
        }, 1500);
    });
}

// Mobile Menu
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
const navLinkItems = document.querySelectorAll('.nav-link');

menuBtn?.addEventListener('click', () => {
    navLinks?.classList.toggle('active');
    menuBtn.classList.toggle('active');
});

// Close menu when clicking a link
navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
        navLinks?.classList.remove('active');
        menuBtn?.classList.remove('active');
    });
});

// Profile Slideshow logic removed (switched to single hero image)

// Vibe Widget Audio Logic
const vibeWidget = document.querySelector('.vibe-widget');
const audioPlayer = document.getElementById('audio-player') as HTMLAudioElement;

if (vibeWidget && audioPlayer) {
    vibeWidget.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play().then(() => {
                vibeWidget.classList.add('playing');
                const label = vibeWidget.querySelector('.vibe-label');
                if (label) label.textContent = 'Now Playing';
            }).catch(e => {
                alert("Please add a 'music.mp3' file to the public folder to play music!");
                console.error("Audio playback failed:", e);
            });
        } else {
            audioPlayer.pause();
            vibeWidget.classList.remove('playing');
            const label = vibeWidget.querySelector('.vibe-label');
            if (label) label.textContent = 'Paused';
        }
    });

    // Attempt auto-play with max volume
    audioPlayer.volume = 1.0;
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            vibeWidget.classList.add('playing');
        }).catch(error => {
            // Auto-play was prevented
            console.log("Auto-play prevented");
        });
    }
}

// === MAGNETIC BUTTONS ===
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-outline, .nav-link, .vibe-widget, .whatsapp-widget') as NodeListOf<HTMLElement>;

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)'
            });
        });
    });
}
initMagneticButtons();

// === GLITCH EFFECT ===
function initGlitch() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    // Split text logic if needed, or just wrap specific words
    // For now, let's target the "CREATIVE" and "DESIGNER" spans
    const glitchTargets = document.querySelectorAll('.hero-title .reveal-text:not(.typewriter)');

    glitchTargets.forEach(target => {
        // Prevent double init
        if (target.querySelector('.glitch-wrapper')) return;

        const text = target.textContent?.trim();
        if (text) {
            target.innerHTML = `<span class="glitch-wrapper"><span class="glitch-text" data-text="${text}">${text}</span></span>`;
        }
    });

    // Also target Lab Page title if exists
    const labTitle = document.querySelector('.lab-title');
    if (labTitle) {
        if (labTitle.querySelector('.glitch-wrapper')) return;

        const text = labTitle.textContent?.trim();
        if (text) {
            labTitle.innerHTML = `<span class="glitch-wrapper"><span class="glitch-text" data-text="${text}">${text}</span></span>`;
        }
    }
}
// Init glitch after a slight delay to allow reveal animation to finish mostly
setTimeout(initGlitch, 2000);

// === PAGE TRANSITIONS ===
function initPageTransitions() {
    // 1. Inject Overlay
    let overlay = document.querySelector('.page-transition-overlay') as HTMLElement;
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('page-transition-overlay');
        document.body.appendChild(overlay);
    }

    // 2. Play Enter Animation (Reveal)
    // ScaleY 1 -> 0 (origin bottom) or just remove active class
    gsap.set(overlay, { scaleY: 1, transformOrigin: 'bottom' });
    gsap.to(overlay, {
        scaleY: 0,
        duration: 0.8,
        ease: 'power4.inOut',
        delay: 0.2
    });

    // 3. Intercept Links
    const links = document.querySelectorAll('a:not([target="_blank"]):not([href^="#"])');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href) return;

            e.preventDefault();

            // Play Exit Animation (Cover)
            gsap.set(overlay, { transformOrigin: 'top' });
            gsap.to(overlay, {
                scaleY: 1,
                duration: 0.6,
                ease: 'power4.inOut',
                onComplete: () => {
                    window.location.href = href;
                }
            });
        });
    });
}

// Initialize transitions on load
window.addEventListener('DOMContentLoaded', initPageTransitions);
// Also call if already loaded (vite hmr fix)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initPageTransitions();
}
