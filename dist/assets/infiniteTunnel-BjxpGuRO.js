import"./modulepreload-polyfill-B5Qt9EMX.js";import{S as M,F as C,P as z,W as b,B as P,a as S,e as A,A as U,c as E,f as B,b as W,g as F,M as I,d as G}from"./three.module-BvLKSbK-.js";const H=document.getElementById("canvas-container"),L=document.getElementById("speed-value"),l=new M;l.fog=new C(0,.035);const i=new z(75,window.innerWidth/window.innerHeight,.1,1e3);i.position.z=5;const c=new b({antialias:!0});c.setSize(window.innerWidth,window.innerHeight);c.setPixelRatio(Math.min(window.devicePixelRatio,2));H.appendChild(c.domElement);const t=100,p=3,Y=200,k=32;function g(){const e=new B(p,p,t,k,Y,!0);e.scale(-1,1,1);const o=new W({uniforms:{time:{value:0},speed:{value:1}},vertexShader:`
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    uniform float time;
                    
                    void main() {
                        vUv = uv;
                        vPosition = position;
                        
                        // Add wavey distortion
                        vec3 pos = position;
                        float wave = sin(pos.y * 0.5 + time * 2.0) * 0.2;
                        pos.x += wave * cos(pos.y * 2.0);
                        pos.z += wave * sin(pos.y * 2.0);
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,fragmentShader:`
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    uniform float time;
                    uniform float speed;
                    
                    void main() {
                        // Grid pattern
                        float gridX = abs(sin(vUv.x * 32.0 * 3.14159));
                        float gridY = abs(sin((vUv.y * 20.0 + time * speed) * 3.14159));
                        
                        float grid = max(
                            smoothstep(0.9, 1.0, gridX),
                            smoothstep(0.9, 1.0, gridY)
                        );
                        
                        // Color gradient
                        vec3 color1 = vec3(0.2, 0.8, 0.7); // Cyan
                        vec3 color2 = vec3(0.1, 0.5, 0.4); // Dark teal
                        vec3 color3 = vec3(0.8, 0.2, 0.8); // Magenta
                        
                        float gradient = sin(vUv.y * 3.14159 + time * 0.5) * 0.5 + 0.5;
                        vec3 baseColor = mix(color1, color2, gradient);
                        
                        // Add pulse effect
                        float pulse = sin(time * 3.0 - vUv.y * 10.0) * 0.5 + 0.5;
                        baseColor = mix(baseColor, color3, pulse * 0.3);
                        
                        // Combine grid with color
                        vec3 finalColor = baseColor * grid;
                        
                        // Add glow
                        finalColor += baseColor * 0.1;
                        
                        // Distance fade
                        float fade = 1.0 - vUv.y;
                        finalColor *= fade;
                        
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `,side:F,transparent:!0});return new I(e,o)}const n=g(),a=g();n.rotation.x=Math.PI/2;a.rotation.x=Math.PI/2;n.position.z=-t/2;a.position.z=-t/2-t;l.add(n);l.add(a);const w=1e3,h=new P,m=new Float32Array(w*3);for(let e=0;e<w;e++){const o=e*3,d=Math.random()*Math.PI*2,s=p*.8*Math.random();m[o]=Math.cos(d)*s,m[o+1]=Math.sin(d)*s,m[o+2]=Math.random()*t*2-t}h.setAttribute("position",new S(m,3));const R=new A({size:.05,color:5164484,transparent:!0,opacity:.8,blending:U}),v=new E(h,R);l.add(v);let u=0,y=0,r=1;document.addEventListener("mousemove",e=>{u=e.clientX/window.innerWidth*2-1,y=e.clientY/window.innerHeight*2-1});document.addEventListener("wheel",e=>{r+=e.deltaY*-.001,r=Math.max(.2,Math.min(3,r)),L.textContent=r.toFixed(1)+"x"});const f=new G;function x(){requestAnimationFrame(x);const e=f.getElapsedTime();f.getDelta(),n.material.uniforms.time.value=e,n.material.uniforms.speed.value=r,a.material.uniforms.time.value=e,a.material.uniforms.speed.value=r;const o=r*.5;n.position.z+=o,a.position.z+=o,n.position.z>t/2&&(n.position.z=a.position.z-t),a.position.z>t/2&&(a.position.z=n.position.z-t);const d=v.geometry.attributes.position.array;for(let s=0;s<w;s++)d[s*3+2]+=o,d[s*3+2]>t/2&&(d[s*3+2]=-t);v.geometry.attributes.position.needsUpdate=!0,i.position.x+=(u*1.5-i.position.x)*.05,i.position.y+=(y*1.5-i.position.y)*.05,i.rotation.z=u*.1,c.render(l,i)}x();window.addEventListener("resize",()=>{i.aspect=window.innerWidth/window.innerHeight,i.updateProjectionMatrix(),c.setSize(window.innerWidth,window.innerHeight)});
