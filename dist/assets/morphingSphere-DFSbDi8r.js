import"./modulepreload-polyfill-B5Qt9EMX.js";import{S as u,P as g,W as z,b as M,C as c,I as b,M as P,B as S,a as C,e as A,A as D,c as _,d as B}from"./three.module-BvLKSbK-.js";const W=document.getElementById("canvas-container"),m=new u,t=new g(75,window.innerWidth/window.innerHeight,.1,1e3);t.position.z=4;const o=new z({antialias:!0,alpha:!0});o.setSize(window.innerWidth,window.innerHeight);o.setPixelRatio(Math.min(window.devicePixelRatio,2));W.appendChild(o.domElement);const d=new M({uniforms:{time:{value:0},morphStrength:{value:.3},colorA:{value:new c("#a855f7")},colorB:{value:new c("#ec4899")},colorC:{value:new c("#3b82f6")}},vertexShader:`
                uniform float time;
                uniform float morphStrength;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vDisplacement;
                
                // Simplex noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }
                
                void main() {
                    vNormal = normal;
                    vPosition = position;
                    
                    // Multi-layer noise for organic morphing
                    float noise1 = snoise(position * 2.0 + time * 0.5) * morphStrength;
                    float noise2 = snoise(position * 4.0 - time * 0.3) * morphStrength * 0.5;
                    float noise3 = snoise(position * 8.0 + time * 0.7) * morphStrength * 0.25;
                    
                    float displacement = noise1 + noise2 + noise3;
                    vDisplacement = displacement;
                    
                    vec3 newPosition = position + normal * displacement;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,fragmentShader:`
                uniform vec3 colorA;
                uniform vec3 colorB;
                uniform vec3 colorC;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vDisplacement;
                
                void main() {
                    // Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
                    
                    // Color based on displacement and fresnel
                    vec3 color = mix(colorA, colorB, vDisplacement * 2.0 + 0.5);
                    color = mix(color, colorC, fresnel);
                    
                    // Add glow
                    float glow = fresnel * 0.5;
                    color += glow;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,wireframe:!1}),I=new b(1.5,64),s=new P(I,d);m.add(s);const w=500,h=new S,n=new Float32Array(w*3);for(let e=0;e<w;e++){const i=e*3,r=3+Math.random()*5,x=Math.random()*Math.PI*2,a=Math.acos(2*Math.random()-1);n[i]=r*Math.sin(a)*Math.cos(x),n[i+1]=r*Math.sin(a)*Math.sin(x),n[i+2]=r*Math.cos(a)}h.setAttribute("position",new C(n,3));const j=new A({size:.02,color:11032055,transparent:!0,opacity:.6,blending:D}),v=new _(h,j);m.add(v);let p=0,y=0,l=.005;document.addEventListener("mousemove",e=>{p=e.clientX/window.innerWidth*2-1,y=e.clientY/window.innerHeight*2-1,d.uniforms.morphStrength.value=.1+Math.abs(p)*.5,l=.002+Math.abs(y)*.01});const E=new B;function f(){requestAnimationFrame(f);const e=E.getElapsedTime();d.uniforms.time.value=e,s.rotation.x+=l,s.rotation.y+=l*1.3,v.rotation.y+=.001,v.rotation.x+=5e-4,o.render(m,t)}f();window.addEventListener("resize",()=>{t.aspect=window.innerWidth/window.innerHeight,t.updateProjectionMatrix(),o.setSize(window.innerWidth,window.innerHeight)});
