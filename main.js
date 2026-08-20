// virtual:index.ts
import { createEngine, startEngine, createEffectWrapper, createEffectRenderer, registerEffectRenderer, setEffectUniforms } from "@babylonjs/lite";
var FRAGMENT_WGSL = (
  /* wgsl */
  `
struct U {
iResolution : vec2f,
iTime : f32,
uIntensity : f32,
};
@group(0) @binding(0) var<uniform> u : U;

const RED   = vec3f(0.733, 0.275, 0.294); // #bb464b
const CORAL = vec3f(0.878, 0.408, 0.294); // #e0684b
const LIGHT = vec3f(0.878, 0.871, 0.847); // #e0ded8
const DARK  = vec3f(0.040, 0.026, 0.032);

// Cyclic palette ramp across the ribbons: red -> coral -> light -> red.
fn palette(h: f32) -> vec3f {
let x = fract(h);
if (x < 0.4) { return mix(RED, CORAL, x / 0.4); }
if (x < 0.7) { return mix(CORAL, LIGHT, (x - 0.4) / 0.3); }
return mix(LIGHT, RED, (x - 0.7) / 0.3);
}

@fragment fn effectFragment(@location(0) uv: vec2f) -> @location(0) vec4f {
let res = u.iResolution;
let t = u.iTime;
let p = (uv * res - 0.5 * res) / res.y;

// dark brand background with a soft central red bloom
var col = mix(DARK, RED * 0.16, smoothstep(1.1, -0.2, length(p)));

const N = 9;
var glowSum = 0.0;
for (var i = 0; i < N; i = i + 1) {
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

col += cribbon * (core * 0.6 + glow * 0.28);
glowSum += glow;
}

col += CORAL * clamp(glowSum * 0.02, 0.0, 0.4) * u.uIntensity;
col = col * u.uIntensity;
col = col * mix(0.7, 1.0, smoothstep(1.6, 0.2, length(p)));
col = min(col, vec3f(0.82));
col = pow(clamp(col, vec3f(0.0), vec3f(1.0)), vec3f(0.92));
return vec4f(col, 1.0);
}`
);
async function main() {
  const canvas = document.getElementById("renderCanvas");
  const engine = await createEngine(canvas);
  const effect = createEffectWrapper(engine, {
    name: "neon-ribbons",
    fragmentWGSL: FRAGMENT_WGSL,
    bindings: [{ binding: 0, kind: "uniform", uniformByteLength: 16 }]
  });
  const u = new Float32Array(4);
  const start = performance.now();
  const renderer = createEffectRenderer(engine, effect, {
    update: () => {
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
void main().catch((err) => console.error(err));
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidmlydHVhbDppbmRleC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBOZW9uIFJpYmJvbnMgXHUyMDE0IGEgcHVyZSBCYWJ5bG9uIExpdGUgZnVsbHNjcmVlbiBXR1NMIGVmZmVjdCAobm8gc2NlbmUsIGNhbWVyYSxcbiAqIG9yIG1lc2gpLiBBIHNoYWRlcnRveS1zdHlsZSBmaWVsZCBvZiBmbG93aW5nIG5lb24gd2F2ZS1yaWJib25zOiBzZXZlcmFsIGxheWVyZWRcbiAqIHNpbmUgY3VydmVzIGRyaWZ0IGFjcm9zcyB0aGUgc2NyZWVuLCBlYWNoIGVtaXR0aW5nIGEgc29mdCBnbG93IHdob3NlIHdpZHRoXG4gKiBwdWxzZXMgd2l0aCBpdHMgb3duIGFtcGxpdHVkZSwgdGludGVkIGZyb20gdGhlIEJhYnlsb24gYnJhbmQgcGFsZXR0ZVxuICogKHJlZCAvIGNvcmFsIC8gbGlnaHQpIG92ZXIgYSBkYXJrIHdhc2guIEFkYXB0ZWQgZnJvbSB0aGUgZGVtb3MgbGFuZGluZyBwYWdlLlxuICovXG5pbXBvcnQgeyBjcmVhdGVFbmdpbmUsIHN0YXJ0RW5naW5lLCBjcmVhdGVFZmZlY3RXcmFwcGVyLCBjcmVhdGVFZmZlY3RSZW5kZXJlciwgcmVnaXN0ZXJFZmZlY3RSZW5kZXJlciwgc2V0RWZmZWN0VW5pZm9ybXMgfSBmcm9tIFwiQGJhYnlsb25qcy9saXRlXCI7XG5cbmNvbnN0IEZSQUdNRU5UX1dHU0wgPSAvKiB3Z3NsICovIGBcbnN0cnVjdCBVIHtcbmlSZXNvbHV0aW9uIDogdmVjMmYsXG5pVGltZSA6IGYzMixcbnVJbnRlbnNpdHkgOiBmMzIsXG59O1xuQGdyb3VwKDApIEBiaW5kaW5nKDApIHZhcjx1bmlmb3JtPiB1IDogVTtcblxuY29uc3QgUkVEICAgPSB2ZWMzZigwLjczMywgMC4yNzUsIDAuMjk0KTsgLy8gI2JiNDY0YlxuY29uc3QgQ09SQUwgPSB2ZWMzZigwLjg3OCwgMC40MDgsIDAuMjk0KTsgLy8gI2UwNjg0YlxuY29uc3QgTElHSFQgPSB2ZWMzZigwLjg3OCwgMC44NzEsIDAuODQ3KTsgLy8gI2UwZGVkOFxuY29uc3QgREFSSyAgPSB2ZWMzZigwLjA0MCwgMC4wMjYsIDAuMDMyKTtcblxuLy8gQ3ljbGljIHBhbGV0dGUgcmFtcCBhY3Jvc3MgdGhlIHJpYmJvbnM6IHJlZCAtPiBjb3JhbCAtPiBsaWdodCAtPiByZWQuXG5mbiBwYWxldHRlKGg6IGYzMikgLT4gdmVjM2Yge1xubGV0IHggPSBmcmFjdChoKTtcbmlmICh4IDwgMC40KSB7IHJldHVybiBtaXgoUkVELCBDT1JBTCwgeCAvIDAuNCk7IH1cbmlmICh4IDwgMC43KSB7IHJldHVybiBtaXgoQ09SQUwsIExJR0hULCAoeCAtIDAuNCkgLyAwLjMpOyB9XG5yZXR1cm4gbWl4KExJR0hULCBSRUQsICh4IC0gMC43KSAvIDAuMyk7XG59XG5cbkBmcmFnbWVudCBmbiBlZmZlY3RGcmFnbWVudChAbG9jYXRpb24oMCkgdXY6IHZlYzJmKSAtPiBAbG9jYXRpb24oMCkgdmVjNGYge1xubGV0IHJlcyA9IHUuaVJlc29sdXRpb247XG5sZXQgdCA9IHUuaVRpbWU7XG5sZXQgcCA9ICh1diAqIHJlcyAtIDAuNSAqIHJlcykgLyByZXMueTtcblxuLy8gZGFyayBicmFuZCBiYWNrZ3JvdW5kIHdpdGggYSBzb2Z0IGNlbnRyYWwgcmVkIGJsb29tXG52YXIgY29sID0gbWl4KERBUkssIFJFRCAqIDAuMTYsIHNtb290aHN0ZXAoMS4xLCAtMC4yLCBsZW5ndGgocCkpKTtcblxuY29uc3QgTiA9IDk7XG52YXIgZ2xvd1N1bSA9IDAuMDtcbmZvciAodmFyIGkgPSAwOyBpIDwgTjsgaSA9IGkgKyAxKSB7XG5sZXQgZmkgPSBmMzIoaSk7XG5sZXQgc3AgPSBmaSAvIGYzMihOIC0gMSk7XG5cbmxldCBwaCA9IGZpICogMC43O1xubGV0IGFtcCA9IDAuMjggKyAwLjEwICogc2luKHQgKiAwLjMgKyBwaCk7XG5sZXQgeSA9XG5hbXAgKiBzaW4ocC54ICogMS4zICsgdCAqIDAuNiArIHBoKSArXG5hbXAgKiAwLjU1ICogc2luKHAueCAqIDIuNyAtIHQgKiAwLjQ1ICsgcGggKiAxLjcpICtcbmFtcCAqIDAuMzAgKiBzaW4ocC54ICogNS4xICsgdCAqIDAuOSArIHBoICogMi4zKTtcblxubGV0IGJhc2UgPSAoc3AgLSAwLjUpICogMS43ICsgMC4wNiAqIHNpbih0ICogMC4yICsgZmkpO1xubGV0IGRpc3QgPSBhYnMocC55IC0gKGJhc2UgKyB5KSk7XG5cbmxldCB3aWR0aCA9IDAuMDEyICsgMC4wMDYgKiBzaW4odCAqIDAuNyArIHBoKTtcbmxldCBjb3JlID0gd2lkdGggLyAoZGlzdCArIHdpZHRoKTtcbmxldCBnbG93ID0gMC4xMCAvIChkaXN0ICogZGlzdCAqIDQ1LjAgKyAwLjA4KTtcblxubGV0IGh1ZSA9IHNwICogMC44ICsgMC4xMCAqIHNpbih0ICogMC4xNSArIGZpKSArIHAueCAqIDAuMDQ7XG5sZXQgY3JpYmJvbiA9IHBhbGV0dGUoaHVlKTtcblxuY29sICs9IGNyaWJib24gKiAoY29yZSAqIDAuNiArIGdsb3cgKiAwLjI4KTtcbmdsb3dTdW0gKz0gZ2xvdztcbn1cblxuY29sICs9IENPUkFMICogY2xhbXAoZ2xvd1N1bSAqIDAuMDIsIDAuMCwgMC40KSAqIHUudUludGVuc2l0eTtcbmNvbCA9IGNvbCAqIHUudUludGVuc2l0eTtcbmNvbCA9IGNvbCAqIG1peCgwLjcsIDEuMCwgc21vb3Roc3RlcCgxLjYsIDAuMiwgbGVuZ3RoKHApKSk7XG5jb2wgPSBtaW4oY29sLCB2ZWMzZigwLjgyKSk7XG5jb2wgPSBwb3coY2xhbXAoY29sLCB2ZWMzZigwLjApLCB2ZWMzZigxLjApKSwgdmVjM2YoMC45MikpO1xucmV0dXJuIHZlYzRmKGNvbCwgMS4wKTtcbn1gO1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVuZGVyQ2FudmFzXCIpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xuICAgIGNvbnN0IGVuZ2luZSA9IGF3YWl0IGNyZWF0ZUVuZ2luZShjYW52YXMpO1xuXG4gICAgY29uc3QgZWZmZWN0ID0gY3JlYXRlRWZmZWN0V3JhcHBlcihlbmdpbmUsIHtcbiAgICAgICAgbmFtZTogXCJuZW9uLXJpYmJvbnNcIixcbiAgICAgICAgZnJhZ21lbnRXR1NMOiBGUkFHTUVOVF9XR1NMLFxuICAgICAgICBiaW5kaW5nczogW3sgYmluZGluZzogMCwga2luZDogXCJ1bmlmb3JtXCIsIHVuaWZvcm1CeXRlTGVuZ3RoOiAxNiB9XSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHUgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICBjb25zdCByZW5kZXJlciA9IGNyZWF0ZUVmZmVjdFJlbmRlcmVyKGVuZ2luZSwgZWZmZWN0LCB7XG4gICAgICAgIHVwZGF0ZTogKCkgPT4ge1xuICAgICAgICAgICAgdVswXSA9IGNhbnZhcy53aWR0aDtcbiAgICAgICAgICAgIHVbMV0gPSBjYW52YXMuaGVpZ2h0O1xuICAgICAgICAgICAgdVsyXSA9IChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDA7XG4gICAgICAgICAgICB1WzNdID0gMS4wOyAvLyB1SW50ZW5zaXR5XG4gICAgICAgICAgICBzZXRFZmZlY3RVbmlmb3JtcyhlZmZlY3QsIHUpO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmVnaXN0ZXJFZmZlY3RSZW5kZXJlcihyZW5kZXJlcik7XG4gICAgYXdhaXQgc3RhcnRFbmdpbmUoZW5naW5lKTtcbn1cblxudm9pZCBtYWluKCkuY2F0Y2goKGVycikgPT4gY29uc29sZS5lcnJvcihlcnIpKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFPQSxTQUFTLGNBQWMsYUFBYSxxQkFBcUIsc0JBQXNCLHdCQUF3Qix5QkFBeUI7QUFFaEksSUFBTTtBQUFBO0FBQUEsRUFBMkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFnRWpDLGVBQWUsT0FBc0I7QUFDakMsUUFBTSxTQUFTLFNBQVMsZUFBZSxjQUFjO0FBQ3JELFFBQU0sU0FBUyxNQUFNLGFBQWEsTUFBTTtBQUV4QyxRQUFNLFNBQVMsb0JBQW9CLFFBQVE7QUFBQSxJQUN2QyxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxVQUFVLENBQUMsRUFBRSxTQUFTLEdBQUcsTUFBTSxXQUFXLG1CQUFtQixHQUFHLENBQUM7QUFBQSxFQUNyRSxDQUFDO0FBRUQsUUFBTSxJQUFJLElBQUksYUFBYSxDQUFDO0FBQzVCLFFBQU0sUUFBUSxZQUFZLElBQUk7QUFFOUIsUUFBTSxXQUFXLHFCQUFxQixRQUFRLFFBQVE7QUFBQSxJQUNsRCxRQUFRLE1BQU07QUFDVixRQUFFLENBQUMsSUFBSSxPQUFPO0FBQ2QsUUFBRSxDQUFDLElBQUksT0FBTztBQUNkLFFBQUUsQ0FBQyxLQUFLLFlBQVksSUFBSSxJQUFJLFNBQVM7QUFDckMsUUFBRSxDQUFDLElBQUk7QUFDUCx3QkFBa0IsUUFBUSxDQUFDO0FBQUEsSUFDL0I7QUFBQSxFQUNKLENBQUM7QUFFRCx5QkFBdUIsUUFBUTtBQUMvQixRQUFNLFlBQVksTUFBTTtBQUM1QjtBQUVBLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLFFBQVEsTUFBTSxHQUFHLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

//# sourceURL=playground.js
