// Hero background: flowing lime contour lines drawn by a small WebGL shader.
// The lines bulge around the pointer, breathe with the music and fade over the portrait.

import { soundLevel } from './sound';

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAG = `precision mediump float;
uniform vec2 res;uniform float t;uniform vec2 m;uniform float amp;uniform vec4 fig;uniform float party;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/res;vec2 q=uv*vec2(res.x/res.y,1.)*1.3;
 float tt=t*(.05+party*.12);
 vec2 w=vec2(fbm(q+tt),fbm(q+vec2(5.2,1.3)-tt));
 float field=fbm(q+2.2*w+tt*.6);
 vec2 d=uv-m;d.x*=res.x/res.y;float pull=exp(-dot(d,d)*9.);
 field+=pull*.22+amp*.18*sin(t*2.+q.x*3.);
 float k=5.+amp*4.;float lines=abs(fract(field*k)-.5);
 float aa=fwidth(field*k);
 float l=1.-smoothstep(0.,aa*1.2,lines);
 float pull2=exp(-dot(d,d)*4.);float glow=(.10+.9*pull2)*(.6+amp*.8);
 vec2 fp=(gl_FragCoord.xy-fig.xy)/fig.zw;
 float inFig=step(0.,fp.x)*step(fp.x,1.)*step(0.,fp.y)*step(fp.y,1.);
 float edge=smoothstep(0.,.25,min(min(fp.x,1.-fp.x),min(fp.y,1.-fp.y)));
 float fade=1.-inFig*edge*.85;
 float vign=.45+.55*smoothstep(.15,.75,length((uv-vec2(.3,.55))*vec2(1.,1.4)));
 vec3 lime=vec3(.85,1.,0.);
 vec3 col=mix(lime,vec3(1.,.35,.9),party*(.5+.5*sin(t*3.+uv.x*6.)));
 float a=l*glow*fade*vign*.9;
 gl_FragColor=vec4(col*a,a);
}`;

export function initHeroGL(reduceMotion: boolean) {
    const hero = document.querySelector<HTMLElement>('.hero');
    const fig = hero?.querySelector<HTMLElement>('.fig');
    if (!hero) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-gl';
    canvas.setAttribute('aria-hidden', 'true');
    const host = hero.parentElement ?? hero;
    host.classList.add('has-gl');
    host.prepend(canvas);
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { canvas.remove(); return; }
    // With no GPU the browser draws WebGL on the CPU (SwiftShader, llvmpipe),
    // and this full-screen shader would block the main thread for seconds.
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) { canvas.remove(); host.classList.remove('has-gl'); return; }
    gl.getExtension('OES_standard_derivatives');
    const frag = '#extension GL_OES_standard_derivatives : enable\n' + FRAG;

    const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u('res'), uT = u('t'), uM = u('m'), uAmp = u('amp'), uFig = u('fig'), uParty = u('party');

    const coarse = matchMedia('(pointer: coarse)').matches;
    const frameGap = coarse ? 1000 / 30 : 0; // 30 fps is plenty on touch screens
    let lastDraw = 0;
    let dpr = 1;
    const resize = () => {
        // Phones and tablets render the field at a lower resolution: it is soft
        // contour lines, and a full-res shader every frame costs battery and INP.
        dpr = coarse ? Math.min(window.devicePixelRatio || 1, 2) * 0.5 : Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(host.clientWidth * dpr);
        canvas.height = Math.round(host.clientHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    new ResizeObserver(resize).observe(host);

    let mx = 0.7, my = 0.5, tx = 0.7, ty = 0.5, amp = 0, partyMix = 0;
    host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width;
        ty = 1 - (e.clientY - r.top) / r.height;
    });

    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);

    const t0 = performance.now();
    const draw = () => {
        const t = (performance.now() - t0) / 1000;
        mx += (tx - mx) * 0.06;
        my += (ty - my) * 0.06;
        amp += (soundLevel() * 2.2 - amp) * 0.12;
        partyMix += ((document.documentElement.classList.contains('party') ? 1 : 0) - partyMix) * 0.05;
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uT, reduceMotion ? 8 : t);
        gl.uniform2f(uM, mx, my);
        gl.uniform1f(uAmp, Math.min(amp, 1));
        gl.uniform1f(uParty, partyMix);
        if (fig) {
            const hr = host.getBoundingClientRect();
            const fr = fig.getBoundingClientRect();
            gl.uniform4f(uFig, (fr.left - hr.left) * dpr, (hr.bottom - fr.bottom) * dpr, fr.width * dpr, fr.height * dpr);
        } else gl.uniform4f(uFig, -1, -1, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
        if (visible && !document.hidden && now - lastDraw >= frameGap) { lastDraw = now; draw(); }
        requestAnimationFrame(loop);
    };
    if (reduceMotion) { draw(); window.addEventListener('resize', () => requestAnimationFrame(draw)); }
    else requestAnimationFrame(loop);
    requestAnimationFrame(() => canvas.classList.add('on'));
}
