'use client';

import { useEffect, useRef } from 'react';
import { isTouch, prefersReducedMotion } from '@/lib/gsap';

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

// Slow, warm "lamp light" field: domain-warped noise, an ember glow that follows the pointer, vignette.
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r;uniform float t;uniform vec2 m;
// sine-free hash: stable on low-precision (mobile) GPUs
float h(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;vec2 q=uv;q.x*=r.x/r.y;
 float tt=t*.04;
 vec2 w=vec2(fbm(q*1.4+tt),fbm(q*1.4-tt+3.1));
 float f=fbm(q*1.7+w*1.6+tt*.6);
 vec2 mm=m;mm.x*=r.x/r.y;
 float glow=exp(-3.2*distance(q,mm));
 vec3 ink=vec3(.047,.039,.031);
 vec3 umber=vec3(.20,.10,.04);
 vec3 ember=vec3(.94,.54,.24);
 vec3 c=mix(ink,umber,smoothstep(.42,1.,f)*.85);
 c+=ember*pow(f,3.2)*.38;
 c+=ember*glow*.22*(.6+.4*f);
 c*=1.-.72*smoothstep(.3,1.1,length(uv-vec2(.66,.5)));
 gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`;

export function HeroShader({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    if (prefersReducedMotion()) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl || gl.isContextLost()) return;
    const onLost = () => (canvas.style.opacity = '0');
    canvas.addEventListener('webglcontextlost', onLost);

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r');
    const uT = gl.getUniformLocation(prog, 't');
    const uM = gl.getUniformLocation(prog, 'm');

    // render at reduced resolution: it's a soft field, nobody can tell, and phones stay cool
    const scale = isTouch() ? 0.35 : 0.5;
    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * scale));
      const hgt = Math.max(1, Math.floor(canvas.clientHeight * scale));
      canvas.width = w;
      canvas.height = hgt;
      gl.viewport(0, 0, w, hgt);
      gl.uniform2f(uR, w, hgt);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const target = { x: 0.68, y: 0.55 };
    const mouse = { x: 0.68, y: 0.55 };
    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      target.x = (e.clientX - b.left) / b.width;
      target.y = 1 - (e.clientY - b.top) / b.height;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      mouse.x += (target.x - mouse.x) * 0.04;
      mouse.y += (target.y - mouse.y) * 0.04;
      gl.uniform1f(uT, (now - start) / 1000);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // Sanity check: render one frame and sample it. This field is always dark; if a GPU produces a bright
    // frame (broken precision/driver), keep the CSS fallback instead of flashing white.
    gl.uniform1f(uT, 0);
    gl.uniform2f(uM, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const px = new Uint8Array(4);
    let bright = 0;
    for (const [fx, fy] of [[0.2, 0.2], [0.5, 0.5], [0.8, 0.7], [0.1, 0.9]]) {
      gl.readPixels(Math.floor(canvas.width * fx), Math.floor(canvas.height * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      if (px[0] + px[1] + px[2] > 600) bright++;
    }
    if (bright >= 2) {
      canvas.removeEventListener('webglcontextlost', onLost);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      return;
    }
    raf = requestAnimationFrame(frame);
    canvas.style.opacity = '1';

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.style.opacity = '0';
      // Free GPU objects but keep the context: React may re-run this effect on the same canvas
      // (strict mode, or a route kept alive and shown again), and a lost context can't be revived.
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div className={className} aria-hidden>
      {/* static fallback (no WebGL / reduced motion) */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 68% 45%, rgb(240 138 60 / 0.28), transparent 70%), radial-gradient(90% 80% at 20% 100%, rgb(80 40 15 / 0.5), transparent)' }} />
      <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-[2s]" />
    </div>
  );
}
