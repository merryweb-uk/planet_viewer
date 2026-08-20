// main.js
import { createEngine, startEngine, createEffectWrapper, createEffectRenderer, registerEffectRenderer, setEffectUniforms } from "@babylonjs/lite";

const FRAGMENT_WGSL = (
`struct U {
  iResolution : vec2<f32>,
  iTime : f32,
  uIntensity : f32,
};

@group(0) @binding(0) var<uniform> u : U;

// helpers (implementations to avoid relying on non-standard builtins)
fn fract(x: f32) -> f32 { return x - floor(x); }
fn mix_v3(a: vec3<f32>, b: vec3<f32>, t: f32) -> vec3<f32> { return a + t * (b - a); }
fn mix_f(a: f32, b: f32, t: f32) -> f32 { return a + t * (b - a); }
fn clamp_f(x: f32, lo: f32, hi: f32) -> f32 { return clamp(x, lo, hi); }
fn smoothstep_f(edge0: f32, edge1: f32, x: f32) -> f32 {
  let t = clamp_f((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

const RED   : vec3<f32> = vec3<f32>(0.733, 0.275, 0.294); // #bb464b
const CORAL : vec3<f32> = vec3<f32>(0.878, 0.408, 0.294); // #e0684b
const LIGHT : vec3<f32> = vec3<f32>(0.878, 0.871, 0.847); // #e0ded8
const DARK  : vec3<f32> = vec3<f32>(0.040, 0.026, 0.032);

// Cyclic palette ramp across the ribbons: red -> coral -> light -> red.
fn palette(h: f32) -> vec3<f32> {
  let x = fract(h);
  if (x < 0.4) { return mix_v3(RED, CORAL, x / 0.4); }
  if (x < 0.7) { return mix_v3(CORAL, LIGHT, (x - 0.4) / 0.3); }
  return mix_v3(LIGHT, RED, (x - 0.7) / 0.3);
}

@fragment fn effectFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let res = u.iResolution;
  let t = u.iTime;
  let p = (uv * res - 0.5 * res) / res.y;

  // dark brand background with a soft central red bloom
  var col : vec3<f32> = mix_v3(DARK, RED * 0.16, smoothstep_f(1.1, -0.2, length(p)));

  const N = 9;
  var glowSum = 0.0;
  for (var i = 0u; i < N; i = i + 1u) {
    let fi = f32(i);
    let sp = fi / f32(N - 1);

    let ph = fi * 0.7;
    let amp = 0.28 + 0.10 * sin(t * 0.3 + ph);
    let y =
      amp * sin(p.x * 1.3 + t * 0.6 + ph) +
      amp * 0.55 * sin(p.x * 2.7 - t * 0.45 + ph * 1.7) +
      amp * 0.30 * sin(p.x * 5.1 + t * 0.9 + ph * 2.3);

    let base = (sp - 0.5) * 1.7 + 0.06 * sin(t * 0.2 + fi);
    let dist = abs(p.y - (base + y));

    let width = 0.012 + 0.006 * sin(t * 0.7 + ph);
    let core = width / (dist + width);
    let glow = 0.10 / (dist * dist * 45.0 + 0.08);

    let hue = sp * 0.8 + 0.10 * sin(t * 0.15 + fi) + p.x * 0.04;
    let cribbon = palette(hue);

    col = col + cribbon * (core * 0.6 + glow * 0.28);
    glowSum = glowSum + glow;
  }

  col = col + CORAL * clamp(glowSum * 0.02, 0.0, 0.4) * u.uIntensity;
  col = col * u.uIntensity;
  col = col * mix_f(0.7, 1.0, smoothstep_f(1.6, 0.2, length(p)));
  col = min(col, vec3<f32>(0.82, 0.82, 0.82));
  col = pow(clamp(col, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(0.92));
  return vec4<f32>(col, 1.0);
}`
);

async function main() {
  const canvas = document.getElementById("renderCanvas");
  if (!canvas) {
    console.error("renderCanvas element not found – ensure a <canvas id=\"renderCanvas\"> exists in the DOM.");
    return;
  }

  const engine = await createEngine(canvas);
  const effect = createEffectWrapper(engine, {
    name: "neon-ribbons",
    fragmentWGSL: FRAGMENT_WGSL,
    // 4 floats (vec2 + float + float) = 16 bytes
    bindings: [{ binding: 0, kind: "uniform", uniformByteLength: 16 }]
  });

  const u = new Float32Array(4);
  const start = performance.now();

  const renderer = createEffectRenderer(engine, effect, {
    update: () => {
      // keep uniforms in sync
      u[0] = canvas.width;
      u[1] = canvas.height;
      u[2] = (performance.now() - start) / 1e3;
      u[3] = 1;
      setEffectUniforms(effect, u);
    }
  });

  registerEffectRenderer(renderer);
  await startEngine(engine);
}

// Run only in browser after DOM ready (prevents SSR/node-side errors)
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      main().catch((err) => console.error("Failed to start effect:", err));
    });
  } else {
    main().catch((err) => console.error("Failed to start effect:", err));
  }
}
