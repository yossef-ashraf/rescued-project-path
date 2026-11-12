export default `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flow Field with Particle Trails</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000000; }
  canvas { display: block; width: 100vw; height: 100vh; }
</style>
</head>
<body>

<canvas id="canvas"></canvas>
<script>
const SimplexNoise = (function() {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const F3 = 1 / 3;
  const G3 = 1 / 6;

  const grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
  ];

  function SimplexNoise(seed) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    const p = new Uint8Array(256);
    seed = seed || Math.random() * 65536;
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807 + 0) % 2147483647;
      const j = seed % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  SimplexNoise.prototype.noise2D = function(xin, yin) {
    const perm = this.perm, permMod12 = this.permMod12;
    let n0, n1, n2;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = xin - X0, y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let t0 = 0.5 - x0*x0 - y0*y0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; const gi = permMod12[ii + perm[jj]]; n0 = t0 * t0 * (grad3[gi][0]*x0 + grad3[gi][1]*y0); }
    let t1 = 0.5 - x1*x1 - y1*y1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; const gi = permMod12[ii + i1 + perm[jj + j1]]; n1 = t1 * t1 * (grad3[gi][0]*x1 + grad3[gi][1]*y1); }
    let t2 = 0.5 - x2*x2 - y2*y2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; const gi = permMod12[ii + 1 + perm[jj + 1]]; n2 = t2 * t2 * (grad3[gi][0]*x2 + grad3[gi][1]*y2); }
    return 70 * (n0 + n1 + n2);
  };

  SimplexNoise.prototype.noise3D = function(xin, yin, zin) {
    const perm = this.perm, permMod12 = this.permMod12;
    let n0, n1, n2, n3;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const X0 = i - t, Y0 = j - t, Z0 = k - t;
    const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
      else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
      else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
      else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
      else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
    const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; const gi = permMod12[ii+perm[jj+perm[kk]]]; n0 = t0*t0*(grad3[gi][0]*x0+grad3[gi][1]*y0+grad3[gi][2]*z0); }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; const gi = permMod12[ii+i1+perm[jj+j1+perm[kk+k1]]]; n1 = t1*t1*(grad3[gi][0]*x1+grad3[gi][1]*y1+grad3[gi][2]*z1); }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; const gi = permMod12[ii+i2+perm[jj+j2+perm[kk+k2]]]; n2 = t2*t2*(grad3[gi][0]*x2+grad3[gi][1]*y2+grad3[gi][2]*z2); }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 < 0) n3 = 0;
    else { t3 *= t3; const gi = permMod12[ii+1+perm[jj+1+perm[kk+1]]]; n3 = t3*t3*(grad3[gi][0]*x3+grad3[gi][1]*y3+grad3[gi][2]*z3); }
    return 32 * (n0 + n1 + n2 + n3);
  };

  return SimplexNoise;
})();

(function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const noise = new SimplexNoise(42);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

  let W, H;
  const BG_COLOR = '#000000';

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);
  }

  window.addEventListener('resize', resize);
  resize();

  const mouse = { x: -9999, y: -9999, active: false };
  window.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', function() {
    mouse.active = false;
  });

  const palette = [
    { r: 249, g: 115, b: 22 },  // #F97316 bright vibrant orange
    { r: 234, g: 88,  b: 12 },  // #EA580C deep vivid orange
    { r: 251, g: 146, b: 60 },  // #FB923C warm luminous orange
    { r: 188, g: 92,  b: 41 },  // #BC5C29 brand terracotta orange
    { r: 255, g: 107, b: 0 },   // #FF6B00 electric pure orange
    { r: 194, g: 65,  b: 12 },  // #C2410C rich burnt orange
    { r: 245, g: 158, b: 11 }   // #F59E0B warm amber orange
  ];

  const PARTICLE_COUNT = 2500;
  let NOISE_SCALE = 0.0025;
  let SPEED = 0.8;
  const MOUSE_RADIUS = 160;
  const MOUSE_FORCE = 2.0;

  const particles = [];

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.4 + Math.random() * 0.8,
      alpha: 0.25 + Math.random() * 0.35,
      size: 1.1 + Math.random() * 0.8
    };
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }

  const buckets = palette.map(() => []);
  let time = 0;

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.055)';
    ctx.fillRect(0, 0, W, H);

    time += 0.0008;

    for (let b = 0; b < buckets.length; b++) buckets[b].length = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      const nx = p.x * NOISE_SCALE;
      const ny = p.y * NOISE_SCALE;
      const angle = noise.noise3D(nx, ny, time) * Math.PI * 2;

      let vx = Math.cos(angle) * p.speed * SPEED;
      let vy = Math.sin(angle) * p.speed * SPEED;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
          vx += (dx / dist) * force;
          vy += (dy / dist) * force;
        }
      }

      const px = p.x;
      const py = p.y;
      p.x += vx;
      p.y += vy;

      const normAngle = ((angle / (Math.PI * 2)) % 1 + 1) % 1;
      const bucketIdx = Math.min(palette.length - 1, Math.floor(normAngle * palette.length));
      buckets[bucketIdx].push(px, py, p.x, p.y);

      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      }
    }

    for (let b = 0; b < buckets.length; b++) {
      const coords = buckets[b];
      if (coords.length === 0) continue;
      const c = palette[b];
      ctx.lineWidth = 1.35;
      ctx.strokeStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.55)';
      ctx.beginPath();
      for (let j = 0; j < coords.length; j += 4) {
        ctx.moveTo(coords[j], coords[j + 1]);
        ctx.lineTo(coords[j + 2], coords[j + 3]);
      }
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(draw);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'param') {
      switch (e.data.name) {
        case 'SPEED': SPEED = e.data.value; break;
        case 'NOISE_SCALE': NOISE_SCALE = e.data.value; break;
      }
    }
  });
})();
</script>

</body>
</html>
`;
