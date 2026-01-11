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
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
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

// === GSAP ANIMATIONS ===

// Loading Animation
const loader = document.querySelector('.loader') as HTMLElement;

window.addEventListener('load', () => {
    gsap.to(loader, {
        opacity: 0,
        duration: 1,
        delay: 0.5,
        onComplete: () => {
            loader.style.display = 'none';
            startHeroAnimations();
        }
    });
});

function startHeroAnimations() {
    const tl = gsap.timeline();

    tl.to('.reveal-text', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out'
    })
        .to('.profile-frame', {
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: 'back.out(1.7)'
        }, '-=0.8');
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

// Mobile Menu
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn?.addEventListener('click', () => {
    navLinks?.classList.toggle('active');
    // Simple toggle logic - in real project would animate
    if (navLinks?.classList.contains('active')) {
        (navLinks as HTMLElement).style.display = 'flex';
        (navLinks as HTMLElement).style.flexDirection = 'column';
        (navLinks as HTMLElement).style.position = 'fixed';
        (navLinks as HTMLElement).style.top = '0';
        (navLinks as HTMLElement).style.left = '0';
        (navLinks as HTMLElement).style.width = '100%';
        (navLinks as HTMLElement).style.height = '100vh';
        (navLinks as HTMLElement).style.background = '#050505';
        (navLinks as HTMLElement).style.justifyContent = 'center';
        (navLinks as HTMLElement).style.alignItems = 'center';
        (navLinks as HTMLElement).style.zIndex = '99';
    } else {
        // Reset styles or reload
        (navLinks as HTMLElement).style.display = '';
    }
});

// Profile Slideshow
const profileSlides = document.querySelectorAll('.profile-img');
let currentSlide = 0;

if (profileSlides.length > 0) {
    setInterval(() => {
        profileSlides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % profileSlides.length;
        profileSlides[currentSlide].classList.add('active');
    }, 3000); // Change every 3 seconds
}
