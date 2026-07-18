/* ==========================================================================
   J.A.R.V.I.S. — Aurora Nodes orb
   A hollow "energy shell" made of little glowing nodes on a sphere: the
   silhouette lights up electric-blue, the points undulate with fbm noise and
   bloom outward with the voice. Renders to a <canvas>; audio-reactive across
   idle / listening / thinking / speaking. No dependencies.
   ========================================================================== */
(function () {
"use strict";

function AuroraOrb(canvas, opts) {
  opts = opts || {};
  this.cv = canvas;
  this.ctx = canvas.getContext("2d");
  this.state = "idle";
  this.audioAmp = 0;                 // external real mic/TTS amplitude 0..1
  this.t = Math.random() * 100;
  this.ampS = 0;
  this.autoYaw = 0; this.spinY = 0; this.spinX = 0; this.spinVY = 0; this.spinVX = 0; this.grabbed = false; this._lvy = 0; this._lvx = 0;
  this.dpr = Math.min(2, window.devicePixelRatio || 1);
  this.PN = opts.points || (window.innerWidth < 640 ? 440 : 640);
  this.fill = opts.fill || 0.33;    // sphere radius as a fraction of min(W,H)
  this.running = true;
  this._buildSprite();
  this._buildPoints();
  this._resize();
  try { this._ro = new ResizeObserver(this._resize.bind(this)); this._ro.observe(canvas); } catch (e) {}
  this._loop = this._loop.bind(this);
  requestAnimationFrame(this._loop);
}
AuroraOrb.prototype.setState = function (s) { this.state = s; };
AuroraOrb.prototype.setAmp = function (a) { this.audioAmp = a; };
AuroraOrb.prototype.grab = function () { this.grabbed = true; this.spinVY = 0; this.spinVX = 0; this._lvy = 0; this._lvx = 0; };
AuroraOrb.prototype.dragBy = function (dx, dy) { var k = 0.006; this.spinY += dx * k; this.spinX += dy * k; this._lvy = dx * k; this._lvx = dy * k; };
AuroraOrb.prototype.release = function () { this.grabbed = false; this.spinVY = this._lvy; this.spinVX = this._lvx; };
AuroraOrb.prototype.stop = function () { this.running = false; if (this._ro) try { this._ro.disconnect(); } catch (e) {} };

AuroraOrb.prototype._resize = function () {
  var r = this.cv.getBoundingClientRect();
  this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
  this.cv.width = this.W * this.dpr; this.cv.height = this.H * this.dpr;
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
};
AuroraOrb.prototype._buildSprite = function () {
  var s = document.createElement("canvas"); s.width = s.height = 28;
  var c = s.getContext("2d");
  var g = c.createRadialGradient(14, 14, 0, 14, 14, 14);
  g.addColorStop(0, "rgba(223,235,255,1)");
  g.addColorStop(0.4, "rgba(76,141,255,.85)");
  g.addColorStop(1, "rgba(76,141,255,0)");
  c.fillStyle = g; c.beginPath(); c.arc(14, 14, 14, 0, 7); c.fill();
  this.spr = s;
};
AuroraOrb.prototype._buildPoints = function () {
  var pts = [], GA = 2.399963229728653, N = this.PN;
  for (var i = 0; i < N; i++) {
    var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = GA * i;
    pts.push({ x: Math.cos(th) * rr, y: y, z: Math.sin(th) * rr });
  }
  this.pts = pts;
};
function hash(x, y, z) { var h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, z) {
  var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  function l(a, b, t) { return a + (b - a) * t; }
  return l(l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
           l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
}
function fbm(x, y, z) { return vnoise(x, y, z) * 0.6 + vnoise(x * 2, y * 2, z * 2) * 0.3; }

AuroraOrb.prototype._raw = function () {
  var t = this.t, s = this.state;
  if (s === "speak") { var g = Math.pow(Math.max(0, Math.sin(t * 7.5) * Math.sin(t * 2.7) + 0.15 * Math.sin(t * 13.1)), 2); return Math.min(1, 0.15 + g * 1.15); }
  if (s === "think") return 0.28 + 0.12 * Math.sin(t * 3.0);
  if (s === "listen") return 0.16 + 0.08 * Math.abs(Math.sin(t * 2.1));
  return 0;
};
AuroraOrb.prototype._loop = function () {
  if (!this.running) return;
  if (this.cv.offsetWidth === 0) { requestAnimationFrame(this._loop); return; }  // hidden -> skip heavy draw
  if (Math.abs(this.cv.offsetWidth - this.W) > 1 || Math.abs(this.cv.offsetHeight - this.H) > 1) this._resize();
  this.t += 0.016;
  var raw = Math.max(this._raw(), this.audioAmp);
  this.ampS += (raw > this.ampS ? 0.35 : 0.10) * (raw - this.ampS);
  var d = Math.max(this.ampS, 0.05 * (0.5 + 0.5 * Math.sin(this.t * 0.9)));
  var ctx = this.ctx, W = this.W, H = this.H, t = this.t, pts = this.pts, spr = this.spr;
  ctx.clearRect(0, 0, W, H);
  var cx = W / 2, cy = H / 2, R = Math.min(W, H) * this.fill;
  var base = 0.28 + (this.state === "think" ? 0.25 : 0);
  if (!this.grabbed) {
    this.autoYaw += 0.016 * base;
    this.spinY += this.spinVY; this.spinX += this.spinVX;
    this.spinVY *= 0.993; this.spinVX *= 0.993;            // lower friction -> a flick spins much longer
    this.spinY += (0 - this.spinY) * 0.012;                // ease back to the original orientation when left alone
    this.spinX += (0 - this.spinX) * 0.05;                 // tilt settles back to neutral
  }
  this.spinX = Math.max(-1.15, Math.min(1.15, this.spinX));
  var ay = this.autoYaw + this.spinY, ax = 0.34 + 0.05 * Math.sin(t * 0.4) + this.spinX;
  var cyaw = Math.cos(ay), syaw = Math.sin(ay), cpit = Math.cos(ax), spit = Math.sin(ax), f = 3.0, speed = 0.3 + d * 0.5;
  ctx.globalCompositeOperation = "lighter";
  // outer glow ring (transparent centre so the shell reads as hollow)
  var hg = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.9);
  hg.addColorStop(0, "rgba(76,141,255,0)"); hg.addColorStop(0.22, "rgba(76,141,255," + (0.05 + 0.14 * d) + ")"); hg.addColorStop(1, "rgba(76,141,255,0)");
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.8, 0, 7); ctx.fill();
  var lean = this.state === "listen" ? 0.97 : 1;
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    var n = fbm(p.x * 2.4 + t * speed * 0.4, p.y * 2.4, p.z * 2.4 + t * speed * 0.4);
    var disp = lean * (1 + 0.06 * n + 0.34 * d * (0.6 + 0.4 * n));
    var X = p.x * disp, Y = p.y * disp, Z = p.z * disp;
    var x1 = X * cyaw - Z * syaw, z1 = X * syaw + Z * cyaw, y1 = Y;
    var y2 = y1 * cpit - z1 * spit, z2 = y1 * spit + z1 * cpit, x2 = x1;
    var sc2 = f / (f + z2);
    var sx = cx + x2 * R * sc2, sy = cy + y2 * R * sc2;
    var edge = 1 - Math.abs(z2), front = (z2 + 1) / 2;
    var bright = (0.06 + Math.pow(edge, 2.4) * 1.2) * (0.42 + 0.58 * front) * (0.7 + 0.5 * n) * (1 + 0.55 * d);
    var sz = (1.3 + front * 1.0) * (1 + 0.2 * d) * sc2;
    ctx.globalAlpha = Math.min(1, bright);
    ctx.drawImage(spr, sx - sz, sy - sz, sz * 2, sz * 2);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  requestAnimationFrame(this._loop);
};

window.AuroraOrb = AuroraOrb;
})();
