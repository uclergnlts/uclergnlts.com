import"./modulepreload-polyfill-B5Qt9EMX.js";import{S as z,P as b,W as C,C as i,B as A,a as p,b as S,A as W,V as f,c as E,d as B}from"./three.module-BvLKSbK-.js";const F=document.getElementById("canvas-container"),M=new z,e=new b(75,window.innerWidth/window.innerHeight,.1,1e3);e.position.z=50;const a=new C({antialias:!0,alpha:!0});a.setSize(window.innerWidth,window.innerHeight);a.setPixelRatio(Math.min(window.devicePixelRatio,2));F.appendChild(a.domElement);const l=1e4,s=new Float32Array(l*3),c=new Float32Array(l*3),y=new Float32Array(l),g=[new i("#ff6b6b"),new i("#feca57"),new i("#ff9ff3"),new i("#54a0ff"),new i("#5f27cd")];for(let t=0;t<l;t++){const o=t*3,w=30+Math.random()*20,u=Math.random()*Math.PI*2,h=Math.acos(2*Math.random()-1);s[o]=w*Math.sin(h)*Math.cos(u),s[o+1]=w*Math.sin(h)*Math.sin(u),s[o+2]=w*Math.cos(h);const v=g[Math.floor(Math.random()*g.length)];c[o]=v.r,c[o+1]=v.g,c[o+2]=v.b,y[t]=Math.random()*2+.5}const m=new A;m.setAttribute("position",new p(s,3));m.setAttribute("color",new p(c,3));m.setAttribute("size",new p(y,1));const x=new S({uniforms:{time:{value:0},mousePos:{value:new f(0,0)}},vertexShader:`
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Add some wave motion
                    pos.x += sin(time + position.y * 0.1) * 0.5;
                    pos.y += cos(time + position.x * 0.1) * 0.5;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,fragmentShader:`
                varying vec3 vColor;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,transparent:!0,blending:W,depthWrite:!1}),n=new E(m,x);M.add(n);const r=new f,d=new f;document.addEventListener("mousemove",t=>{r.x=t.clientX/window.innerWidth*2-1,r.y=-(t.clientY/window.innerHeight)*2+1,d.x=r.y*.5,d.y=r.x*.5});document.addEventListener("wheel",t=>{e.position.z+=t.deltaY*.05,e.position.z=Math.max(20,Math.min(100,e.position.z))});const H=new B;function P(){requestAnimationFrame(P);const t=H.getElapsedTime();x.uniforms.time.value=t,n.rotation.x+=(d.x-n.rotation.x)*.05,n.rotation.y+=(d.y-n.rotation.y)*.05,n.rotation.z+=.001,a.render(M,e)}P();window.addEventListener("resize",()=>{e.aspect=window.innerWidth/window.innerHeight,e.updateProjectionMatrix(),a.setSize(window.innerWidth,window.innerHeight)});
