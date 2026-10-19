/* The Talent Dept. · round 12 · v2 City. "The city is what the rhythm makes."
   The statement is printed behind its Line of Sight: every word under one Ink dash, the full stop under the Signal
   block, the Draft replies in the pauses. Each dash is cut into blocks exactly one bar of the brand's City wide.
   The hand: blocks flinch, then dart away along their line, curl around it and creep home on a slower spring.
   The scroll, pose to pose: the ground line draws and the statement rises (anticipation); "The department behind"
   falls block by block into the first towers; the replies answer and finish the Ink city, leaving one plot empty;
   "the world's biggest conversations." pours into that plot floor by floor, each block turning Signal as it lands,
   the full stop last, straight down onto the crown. Mass is conserved: the same blocks, the same size, the same count.
   Nothing moves on its own; when everything is at rest the loop stops. ?still and reduced motion show the end pose. */
(function () {
  var H = document.querySelector('.hero4'), root = document.documentElement;
  if (!H) return;
  var STILL = root.classList.contains('still') || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var stage = H.querySelector('.stage'), hb = H.querySelector('.hb'), hl = H.querySelector('.hl');
  if (!stage || !hb || !hl) return;
  var wds = [].slice.call(hl.querySelectorAll('.wd'));
  var rowEls = [].slice.call(H.querySelectorAll('.far .row'));
  var sw = document.createElement('div'); sw.className = 'sw'; sw.setAttribute('aria-hidden', 'true'); stage.appendChild(sw);
  var gl = document.createElement('b'); gl.className = 'gl'; sw.appendChild(gl);
  var cv = document.createElement('canvas').getContext('2d');

  // The brand City (Brand Standards, The system 26), bar heights measured off the page: six clusters, one Signal.
  var BRAND = [[102, 122, 122, 146, 146, 122, 116, 92], [169, 196, 223, 223, 196, 166], [203, 250, 294, 338, 291, 236, 190],
    [89, 89, 264, 264, 89, 89], [122, 122, 149, 149, 122, 122, 105], [75, 102, 102, 89, 72]];
  // the phone keeps the six clusters with fewer, wider bars
  var PHONE = [[122, 146, 146, 116], [196, 223, 196], [250, 294, 338, 291, 236], [89, 264, 264, 89], [122, 149, 122], [102, 102, 72]];
  var SIG = 2, GR = .27;                                   // the Signal cluster; gap to pitch, as in the book
  // the acts, as fractions of the pinned scroll; the gaps between them are holds
  var ACT = { rise: [.03, .13], a1: [.16, .34], a2: [.37, .53], a3: [.56, .78] };
  var TAU = .2;                                            // scrub smoothing, seconds (about 0.6 s to settle)

  var W = 1, SH = 1, em = 16, h = 4, seam = 1, fs = 1, bw = 4, P = 6, G = 0, cityL = 0, cityR = 0, D = 0, F = .05, clr = 10, lane1 = 0, lane3 = 0;
  var R = 160, A = 40, phone = false;
  var blocks = [], words = [], bars = [], lines = [];
  var ps = 0, pT = 0, running = false, tPrev = 0;
  var mx = -1e4, my = -1e4, pvx = 0, pvy = 0, lastX = null, lastY = null, lastT = 0, inside = false;
  var rings = [];
  var QA = !!window.__cityQA, qaT = 1000;                 // the frame-capture script drives a manual clock
  function clock() { return QA ? qaT : performance.now(); }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hash(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }
  function sstep(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
  function io3(t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function out3(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function io2(t) { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // integer heights proportional to a profile, summing exactly to n (largest remainder), at least one floor each
  function share(prof, n) {
    var flat = [], sum = 0, i;
    prof.forEach(function (c) { c.forEach(function (v) { flat.push(v); sum += v; }); });
    var raw = flat.map(function (v) { return v / sum * n; }), out = raw.map(function (v) { return Math.max(1, Math.floor(v)); });
    var tot = out.reduce(function (a, b) { return a + b; }, 0);
    var ord = raw.map(function (v, k) { return [v - Math.floor(v), k]; }).sort(function (a, b) { return b[0] - a[0]; });
    for (i = 0; tot < n; i = (i + 1) % ord.length) { out[ord[i][1]]++; tot++; }
    for (i = ord.length - 1; tot > n; i = (i - 1 + ord.length) % ord.length) { var k = ord[i][1]; if (out[k] > 1) { out[k]--; tot--; } }
    var res = [], at = 0;
    prof.forEach(function (c) { res.push(out.slice(at, at + c.length)); at += c.length; });
    return res;
  }

  function glyph(tx, r, top) {
    var cs = getComputedStyle(tx); cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var m = cv.measureText(tx.textContent), lh = parseFloat(cs.lineHeight) || r.height;
    var fa = m.fontBoundingBoxAscent || em * .95, fd = m.fontBoundingBoxDescent || em * .22;
    var base = top + (lh - fa - fd) / 2 + fa;
    return { top: base - m.actualBoundingBoxAscent, bottom: base + Math.max(0, m.actualBoundingBoxDescent) };
  }

  function cut(x, y, len, hh, minN) {
    var n = Math.max(minN || 1, Math.round(len / bw)), w = len / n, out = [];
    for (var j = 0; j < n; j++) out.push({ x: x + j * w, y: y, w: w, h: hh, ov: j < n - 1 ? .6 : 0 });
    return out;
  }

  function measure() {
    hl.style.transform = ''; sw.querySelectorAll('i').forEach(function (e) { e.remove(); });
    var S = stage.getBoundingClientRect();
    W = S.width; SH = S.height; phone = W < 700;
    em = parseFloat(getComputedStyle(hl).fontSize) || 16;
    var d0 = wds[0].lastElementChild.getBoundingClientRect();
    h = d0.height; seam = 0; fs = Math.max(1, Math.round(em * .011)); clr = em * .36;
    var t0 = wds[0].firstElementChild.getBoundingClientRect();
    cityL = t0.left - S.left; cityR = W - cityL;

    // the city grid: one pitch for everything
    var prof = phone ? PHONE : BRAND, nb = 0; prof.forEach(function (c) { nb += c.length; });
    var Q = phone ? 2 : 4, cells = nb + (prof.length - 1) * Q;
    P = (cityR - cityL) / (cells - GR); bw = P * (1 - GR);
    G = Math.round(SH - Math.max(26, SH * (phone ? .055 : .06)));

    // the blocks: words first, in reading order, then the replies
    blocks = []; words = []; lines = [];
    wds.forEach(function (el, k) {
      var tx = el.firstElementChild, dr = el.lastElementChild.getBoundingClientRect(), tr = tx.getBoundingClientRect();
      var sig = el.classList.contains('pd');
      var wd = { el: el, tx: tx, k: k, x0: tr.left - S.left, x1: tr.right - S.left, top: tr.top - S.top, clip: null,
        g: glyph(tx, tr, tr.top - S.top), dy: dr.top - S.top + dr.height / 2 };
      var li = -1; lines.forEach(function (L, i) { if (Math.abs(L.top - wd.top) < em * .3) li = i; });
      if (li < 0) { lines.push({ top: wd.top, x0: wd.x0, x1: wd.x1, bottom: wd.g.bottom, dy: wd.dy }); li = lines.length - 1; }
      else { var L = lines[li]; L.x0 = Math.min(L.x0, wd.x0); L.x1 = Math.max(L.x1, wd.x1); L.bottom = Math.max(L.bottom, wd.g.bottom); }
      wd.line = li; words.push(wd);
      var segs = sig ? [{ x: dr.left - S.left + dr.width / 2 - bw / 2, y: dr.top - S.top, w: bw, h: dr.height }]
                     : cut(dr.left - S.left, dr.top - S.top, dr.width, dr.height);
      segs.forEach(function (s) { s.kind = 'w'; s.k = k; s.line = li; s.col = sig ? 'c' : 'k'; s.grp = k <= 2 ? 0 : 2; blocks.push(s); });
    });
    var nRow = 0, nPc = 0;
    rowEls.forEach(function (row) {
      if (!row.offsetParent && getComputedStyle(row).display === 'none') return;
      var any = false;
      [].forEach.call(row.querySelectorAll('i'), function (el) {
        var r = el.getBoundingClientRect(); if (!r.width) return;
        var l = Math.max(r.left - S.left, cityL), rr = Math.min(r.right - S.left, cityR); if (rr - l < bw * .8) return;
        var pcid = nPc++; cut(l, r.top - S.top, rr - l, r.height).forEach(function (s) { s.pc = pcid; s.kind = 'r'; s.row = nRow; s.line = -1 - nRow; s.col = 'd'; s.grp = 1; blocks.push(s); });
        any = true;
      });
      if (any) nRow++;
    });
    var ord = function (g) { return blocks.filter(function (b) { return b.grp === g; }); };
    var g0 = ord(0), g1 = ord(1), g2 = ord(2), ink = g0.concat(g1), sg = g2;

    // the city: Ink clusters share the first phrase and the replies, the Signal cluster takes the last phrase
    var inkProf = prof.filter(function (c, i) { return i !== SIG; });
    var inkH = share(inkProf, ink.length), sigH = share([prof[SIG]], sg.length)[0];
    var Hs = []; for (var c = 0, q = 0; c < prof.length; c++) Hs.push(c === SIG ? sigH : inkH[q++]);
    // place the Signal cluster so its tallest bar stands under the full stop, everything on the pitch
    var stop = g2[g2.length - 1], peak = sigH.indexOf(Math.max.apply(null, sigH));
    var lens = prof.map(function (c) { return c.length; }), leftN = 0, rightN = 0, i2;
    for (i2 = 0; i2 < SIG; i2++) leftN += lens[i2];
    for (i2 = SIG + 1; i2 < lens.length; i2++) rightN += lens[i2];
    var want = Math.round((stop.x + stop.w / 2 - cityL - bw / 2) / P) - peak;
    var s0 = clamp(want, leftN + SIG * (Q - 1), cells - lens[SIG] - rightN - (lens.length - SIG - 1) * (Q - 1));
    var starts = [], at, gaps, extra;
    gaps = SIG; extra = s0 - leftN; at = 0;
    for (c = 0; c < SIG; c++) { starts[c] = at; at += lens[c] + Math.floor(extra / gaps) + (c < extra % gaps ? 1 : 0); }
    starts[SIG] = s0;
    gaps = lens.length - SIG - 1; extra = cells - (s0 + lens[SIG]) - rightN; at = s0 + lens[SIG];
    for (c = SIG + 1; c < lens.length; c++) { var gq = Math.floor(extra / gaps) + (c - SIG - 1 < extra % gaps ? 1 : 0); at += gq; starts[c] = at; at += lens[c]; }

    // slots, course by course (bricklaying), bottom up; the Ink clusters left to right, then the Signal, crown last
    bars = []; var fp = h + fs, inkSlots = [], sigSlots = [];
    for (c = 0; c < prof.length; c++) {
      var cb = [];
      for (var j = 0; j < lens[c]; j++) {
        var bar = { c: c, x: cityL + (starts[c] + j) * P, n: Hs[c][j], q: 0, v: 0, sig: c === SIG };
        bar.cx = bar.x + bw / 2; bars.push(bar); cb.push(bar);
      }
      var tall = Math.max.apply(null, Hs[c]);
      for (var f = 0; f < tall; f++) cb.forEach(function (bb) { if (f < bb.n) (c === SIG ? sigSlots : inkSlots).push({ bar: bb, f: f, course: c * 100 + f }); });
    }
    var sigBars = bars.filter(function (b) { return b.sig; });
    var crown = sigSlots.filter(function (s) { return s.bar === sigBars[peak] && s.f === sigBars[peak].n - 1; })[0];
    sigSlots.splice(sigSlots.indexOf(crown), 1); sigSlots.push(crown);
    // where the statement ends up: as low as the city allows with clear air above the towers under it
    var air = Math.max(44, SH * (phone ? .06 : .065)), need = -1e9;
    bars.forEach(function (b) {
      var lo = null; lines.forEach(function (L) { if (b.x + bw > L.x0 - em * .1 && b.x < L.x1 + em * .1 && (!lo || L.bottom > lo.bottom)) lo = L; });
      if (lo) need = Math.max(need, lo.bottom - (G - b.n * fp - air));
    });
    var tTop = Math.min.apply(null, lines.map(function (L) { return L.top; })), padTop = Math.max(10, SH * .025);
    var maxRise = Math.max(0, tTop - padTop), minRise = Math.max(0, need);
    D = Math.min(maxRise, minRise + (maxRise - minRise) * (phone ? .62 : .85));
    // the lanes: one rail under the statement for each act, midway to the towers it must clear
    var tb = Math.max.apply(null, lines.map(function (L) { return L.bottom; })) - D;
    var inkTop = G - Math.max.apply(null, bars.filter(function (b) { return !b.sig; }).map(function (b) { return b.n; })) * fp;
    var sigTop = G - Math.max.apply(null, sigH) * fp;
    lane1 = tb + Math.max(h * .3, (inkTop - tb - h) * .5);
    // where the replies wait under the statement (the phone), the first lane runs below them, never through them
    var rowBot = -1e9; blocks.forEach(function (b) { if (b.kind === 'r') rowBot = Math.max(rowBot, b.y + b.h - D); });
    if (rowBot > lane1 - h * 1.2) lane1 = Math.min(Math.max(lane1, rowBot + h * 1.1), inkTop - h * 1.6);
    lane3 = tb + Math.max(h * .3, (Math.min(sigTop, inkTop) - tb - h) * .5);

    // the pieces (a word's dash, or one reply dash), in reading order
    function pieces(list) {
      var out = [], cur = null;
      list.forEach(function (b) { var id = b.kind === 'w' ? 'w' + b.k : 'r' + b.row; if (!cur || cur.id !== id) { cur = { id: id, bl: [] }; out.push(cur); } cur.bl.push(b); });
      return out;
    }
    var P0 = pieces(g0), P1 = pieces(g1), P2 = pieces(g2);
    // each piece takes the next slots, a course (run) at a time; each run takes the blocks nearest its columns, so the
    // leading end goes first and nothing is ever passed; within a run the blocks keep their order
    function assign(pcs, slots) {
      var q2 = 0;
      pcs.forEach(function (pc) {
        var pool = pc.bl.slice(), mine = slots.slice(q2, q2 + pool.length), runs = []; q2 += pool.length;
        for (var i3 = 0; i3 < mine.length;) {
          var j3 = i3; while (j3 < mine.length && mine[j3].course === mine[i3].course) j3++;
          var ss = mine.slice(i3, j3).sort(function (p, q3) { return p.bar.x - q3.bar.x; }), xc = 0;
          ss.forEach(function (m) { xc += m.bar.cx; }); xc /= ss.length;
          pool.sort(function (p, q3) { return Math.abs(p.x + p.w / 2 - xc) - Math.abs(q3.x + q3.w / 2 - xc); });
          var bb = pool.splice(0, ss.length).sort(function (p, q3) { return p.x - q3.x; });
          var lead = xc < bb[0].x ? 1 : xc > bb[bb.length - 1].x ? -1 : 0;
          bb.forEach(function (b, k3) {
            var sl = ss[k3]; b.bar = sl.bar; b.f = sl.f; b.X = sl.bar.x; b.Y = G - (sl.f + 1) * h - sl.f * fs; b.land = sl.bar.sig ? 'c' : 'k';
            b.rank = lead > 0 ? k3 : lead < 0 ? bb.length - 1 - k3 : Math.abs(k3 - (bb.length - 1) / 2);
          });
          runs.push(bb); i3 = j3;
        }
        pc.runs = runs;
      });
    }
    assign(P0.concat(P1), inkSlots); assign(P2, sigSlots);

    // the schedule, in beats. A dash drops to its lane whole (its word is said) and rests a beat; then course by course
    // its leading blocks slide along the lane together, comb out to the columns and fall as one row onto the course,
    // landing with a small ripple. A dash only comes down onto the lane when nothing will pass through it, and a
    // course only leaves when its way along the lane is clear.
    var kx = 1440 / W, VB = 34, VD = 60, GB = .4, LB = 3.2, HOLD = 2, ST = .025;
    function lanePos(e, t) {                             // where a block is on its lane at time t, or null
      if (t < e.Td + e.t1 * .4 || t > e.s + e.t2 + e.st) return null;
      if (t <= e.s || !e.t2) return e.x + e.w / 2;
      return e.x + e.w / 2 + e.d2 * io2(Math.min(1, (t - e.s) / e.t2));
    }
    function clash(b, done) {
      for (var i4 = 0; i4 < done.length; i4++) {
        var e = done[i4]; if (e.lane !== b.lane) continue;
        var t0 = Math.max(b.Td + b.t1 * .4, e.Td + e.t1 * .4), t1 = Math.min(b.s + b.t2 + b.st, e.s + e.t2 + e.st);
        if (t1 <= t0) continue;
        for (var k4 = 0; k4 <= 16; k4++) {
          var t = t0 + (t1 - t0) * k4 / 16, pb = lanePos(b, t), pe = lanePos(e, t);
          if (pb !== null && pe !== null && Math.abs(pb - pe) < (b.w + e.w) / 2 + 1) return true;
        }
      }
      return false;
    }
    function schedule(pcs, laneY, a, last) {
      var done = [], at3 = 0;
      pcs.forEach(function (pc, pi) {
        var bl = pc.bl, y0 = bl[0].y - D, direct = last && pi === pcs.length - 1;
        // each dash waits as low as the courses it feeds allow: clear of the words above, never above the act's lane
        var hi = Math.min.apply(null, bl.map(function (b) { return b.Y; }));
        var lp = Math.max(laneY, Math.min(lane1, hi - h * 1.9));
        var lane = direct ? y0 : Math.max(lp, y0), t1 = Math.abs(lane - y0) * kx / VD;
        if (pi) at3 += direct ? 5 : 2.2;
        for (var tries = 0; tries < 600; tries++) {
          var t = at3, ok = true;
          pc.runs.forEach(function (run) {
            var mx2 = 0; run.forEach(function (b) { mx2 = Math.max(mx2, Math.abs(b.X + bw / 2 - (b.x + b.w / 2))); });
            var t2 = direct || mx2 < 1 ? 0 : mx2 * kx / VB;
            run.forEach(function (b) {
              b.lane = lane; b.d1 = lane - y0; b.t1 = t1; b.direct = direct; b.Td = at3 - t1 - HOLD;
              b.d2 = b.X + bw / 2 - (b.x + b.w / 2); b.t2 = t2; b.s = t; b.st = ST * b.rank;
              b.d3 = Math.max(0, b.Y - lane); b.t3 = GB * Math.sqrt(b.d3 * kx); b.tl = LB;
            });
            t += t2 + 1.2 + ST * run.length * .5;
          });
          for (var k6 = 0; k6 < bl.length && ok; k6++) if (clash(bl[k6], done)) ok = false;
          if (ok) break; at3 += 1;
        }
        bl.forEach(function (b) { done.push(b); });
        at3 = Math.max.apply(null, bl.map(function (b) { return b.s + b.t2; })) + 1;
      });
      var end = 0; done.forEach(function (b) { end = Math.max(end, b.s + b.t2 + b.st + b.t3 + b.tl); });
      var st0 = Math.min.apply(null, done.map(function (b) { return b.Td; })), z = (a[1] - a[0]) / (end - st0);
      done.forEach(function (b) {
        b.Td = a[0] + (b.Td - st0) * z; b.s = a[0] + (b.s - st0) * z;
        b.t1 *= z; b.t2 *= z; b.st *= z; b.t3 *= z; b.tl *= z;
      });
      return z;
    }
    var z1 = schedule(P0, lane1, ACT.a1), z2 = schedule(P1, lane1, ACT.a2), z3 = schedule(P2, lane3, ACT.a3, true);

    // the elements, and the scatter state
    var frag = document.createDocumentFragment(), zipN = {};
    blocks.forEach(function (b, i) {
      var el = document.createElement('i'); el.className = b.col === 'k' ? '' : b.col;
      el.style.cssText = 'left:' + b.x.toFixed(2) + 'px;top:' + b.y.toFixed(2) + 'px;width:' + (b.w + (b.ov || 0)).toFixed(2) + 'px;height:' + b.h.toFixed(2) + 'px';
      frag.appendChild(el);
      b.el = el; b.cls = el.className; b.tf = ''; b.i = i;
      b.cx = b.x + b.w / 2; b.cy = b.y + b.h / 2;
      b.ox = 0; b.oy = 0; b.vx = 0; b.vy = 0; b.tx = 0; b.ty = 0; b.seen = 0; b.wake = 0; b.hold = 0; b.side = 0; b.amp = 0;
      b.sqT = -1e4; b.sqAx = 0; b.jit = hash(i, 3) * 40; b.k2 = 0;
      b.zip = (zipN[b.line] = (zipN[b.line] || 0) + 1) % 2 ? -1 : 1;
          });
    sw.appendChild(frag);
    gl.style.cssText = 'left:' + cityL.toFixed(1) + 'px;top:' + G + 'px;width:' + (cityR - cityL).toFixed(1) + 'px';
    R = clamp(W * .15, 110, 240); A = em * .8;
    window.__city = { beat: [z1, z2, z3], lane1: lane1, lane3: lane3, W: W, SH: SH, em: em, bw: bw, P: P, h: h, n: blocks.length, ink: ink.length, sig: sg.length, D: D,
      minRise: minRise, maxRise: maxRise, G: G, heights: Hs, peakPx: Math.max.apply(null, sigH) * fp, inkMaxPx: Math.max.apply(null, [].concat.apply([], inkH)) * fp };
  }

  function progress() {
    if (STILL) return 1;
    var r = H.getBoundingClientRect(), span = H.offsetHeight - innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }

  // ---------------------------------------------------------------- the pose of a block at scroll progress p
  function pose(b, p, o) {
    var rise = io3((p - ACT.rise[0]) / (ACT.rise[1] - ACT.rise[0]));
    o.landed = false; o.flying = false; o.sx = 1; o.sy = 1;
    if (!(p > b.Td)) { o.x = 0; o.y = -D * rise; return o; }
    var y0 = b.y - D, x = 0, y = y0, wf = bw / b.w, sx = 1, sy = 1, s, t;
    var tS = b.s, tF = b.s + b.t2, tH = tF + b.st, tL = tH + b.t3, tE = tL + b.tl;
    o.flying = p < tE;
    if (p < b.Td + b.t1) {                                 // the dash drops off its word to the lane, whole
      t = (p - b.Td) / b.t1; y = y0 + b.d1 * io2(t); s = 1 + .1 * Math.sin(Math.PI * t); sy = s; sx = 1 / s;
    } else if (p < tS) {                                   // a beat on the lane
      y = b.lane;
    } else if (p < tF) {                                   // along the lane
      t = (p - tS) / b.t2; y = b.lane; x = b.d2 * io2(t); s = 1 + .18 * Math.sin(Math.PI * t); sx = s * (1 + (wf - 1) * t); sy = 1 / s;
    } else if (p < tH) {                                   // the course hangs a moment over its columns
      x = b.d2; y = b.lane; sx = wf;
    } else if (p < tL) {                                   // the fall, on gravity
      t = (p - tH) / b.t3; x = b.d2 * (b.t2 ? 1 : io2(t)); y = b.lane + b.d3 * t * t; s = 1 + .22 * t * t; sy = s; sx = wf / s;
    } else {                                               // the landing: squash, one small bounce, settle
      var v = Math.min(1, (p - tL) / b.tl), hop = .3 * (h + fs), sq = 0;
      x = b.d2; y = b.Y;
      if (v < .3) sq = .22 * (1 - v / .3) * (1 - v / .3);
      else if (v < .8) { var w2 = (v - .3) / .5; y = b.Y - hop * 4 * w2 * (1 - w2); }
      else sq = .07 * Math.sin(Math.PI * (v - .8) / .2);
      sy = 1 - sq; sx = wf / sy; y += b.h * (1 - sy) / 2;
      o.landed = true;
    }
    o.x = x; o.y = y - b.y; o.sx = sx; o.sy = sy;
    return o;
  }

  // ---------------------------------------------------------------- the hand
  var DART = { k: 260, c: 26 }, HOME = { k: 90, c: 14 };
  // The hand parts the Line of Sight like a curtain: inside an opening around it the blocks dart outward and bunch
  // into their neighbours (the same Ink on the same row, so the bunch reads as the dash), leaving a clean window in
  // which the words show whole. The opening is widest on the hand's own line and narrower on the lines beside it;
  // a quicker hand opens it wider. On the way each block hops a little off the line (an arc) and lands back on it.
  var gest = 0;
  function targets(now) {
    var calm = ps > .012, spd = Math.sqrt(pvx * pvx + pvy * pvy);
    gest = inside && !calm ? Math.max(gest, Math.tanh(spd / 900)) : 0;
    var Ry = em * 1.16 * 1.5, CMP = .3, th = null, i, k;
    if (!calm && inside) th = { x: mx, y: my, o: R * (.55 + .45 * gest), ring: false };
    for (k = 0; k < rings.length; k++) if (!calm && now < rings[k].t + rings[k].life) th = { x: rings[k].x, y: rings[k].y, o: rings[k].r * .7, ring: true };
    // the window on each line: on the statement's lines it snaps to whole words
    var win = {};
    if (th) {
      lines.forEach(function (L, li) {
        var O = th.o * sstep(1 - Math.abs(L.dy - th.y) / Ry); if (O < 4) return;
        var wl = 1e9, wr = -1e9;
        words.forEach(function (wd) {
          if (wd.line !== li) return;
          var cov2 = Math.min(wd.x1, th.x + O) - Math.max(wd.x0, th.x - O), mid = (wd.x0 + wd.x1) / 2;
          if (cov2 > 0 && (Math.abs(mid - th.x) < O || cov2 > (wd.x1 - wd.x0) * .4)) { wl = Math.min(wl, wd.x0); wr = Math.max(wr, wd.x1); }
        });
        if (wl > wr) return;
        win[li] = [wl, wr];
      });
      for (i = 0; i < blocks.length; i++) {
        var rb = blocks[i]; if (rb.kind !== 'r' || win[rb.line]) continue;
        var O2 = th.o * sstep(1 - Math.abs(rb.cy - th.y) / Ry); if (O2 >= 4) win[rb.line] = [th.x - O2, th.x + O2];
      }
    }
    for (i = 0; i < blocks.length; i++) {
      var b = blocks[i], wv = th ? win[b.line] : null;
      var inZone = wv && b.cx > wv[0] && b.cx < wv[1];
      if (inZone) {
        var dx = b.cx - th.x, dy = b.cy - th.y, d = Math.sqrt(dx * dx + dy * dy), sg = dx >= 0 ? 1 : -1;
        if (!b.seen) { b.seen = now; b.wake = now + (th.ring ? d / 650 * 1000 : d / 1400 * 1000) + b.jit; b.hopped = 0; }
        if (now < b.wake) { if (!b.k2) { b.tx = 0; b.ty = 0; } }
        else if (now < b.wake + 70) {                      // anticipation: a crouch toward the hand
          b.tx = -sg * .12 * P; b.ty = 0; b.k2 = 1; b.sqT = now; b.sqAx = 1;
        } else {                                           // the dart: out past the edge of the window, in order
          var edge = sg > 0 ? wv[1] + b.w / 2 + (b.cx - th.x) * CMP : wv[0] - b.w / 2 - (th.x - b.cx) * CMP;
          edge = clamp(edge, cityL * .5 + b.w / 2, W - cityL * .5 - b.w / 2);
          b.tx = Math.round((edge - b.cx) / (P * .5)) * P * .5; b.ty = 0;
          if (!b.hopped && b.tx) { b.vy += b.zip * 360 * Math.min(1, Math.abs(b.tx) / (P * 2)); b.hopped = 1; }
          b.k2 = 2; b.hold = now + 300 + b.jit * 2.5;
        }
      } else if (b.k2 && now > b.hold) { b.tx = 0; b.ty = 0; b.k2 = 0; b.seen = 0; }
      else if (!b.k2) { b.tx = 0; b.ty = 0; b.seen = 0; }
    }
  }
  function integrate(now, dt) {
    var moving = false, n = Math.max(1, Math.ceil(dt / (1 / 120))), st = dt / n;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i], s = b.k2 === 1 || b.k2 === 2 || b.k2 === 3 ? DART : HOME;
      if (b.k2 === 1) s = { k: 520, c: 40 };
      var pvx0 = b.vx;
      for (var k = 0; k < n; k++) {
        b.vx += (-s.k * (b.ox - b.tx) - s.c * b.vx) * st;
        b.vy += (-s.k * (b.oy - b.ty) - s.c * b.vy) * st;
        b.ox += b.vx * st; b.oy += b.vy * st;
      }
      if (Math.abs(pvx0) > 140 && pvx0 * b.vx < 0) { b.sqT = now; b.sqAx = 1; }   // a fast stop squashes
      var v = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (v < .5 && Math.abs(b.ox - b.tx) < .1 && Math.abs(b.oy - b.ty) < .1) { b.ox = b.tx; b.oy = b.ty; b.vx = b.vy = 0; }
      else moving = true;
      if (now - b.sqT < 140) moving = true;
    }
    return moving;
  }

  // ---------------------------------------------------------------- the end pose: towers duck for the hand
  function duck(dt) {
    var moving = false, endOn = ps > .8 && inside, n = Math.max(1, Math.ceil(dt / (1 / 120))), st = dt / n;
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i], tq = 0;
      if (endOn && my > G - b.n * (h + fs) - R * .9 && my < G + R * .4) tq = .11 * sstep(1 - Math.abs(mx - b.cx) / (R * .9));
      for (var k = 0; k < n; k++) { b.v += (-180 * (b.q - tq) - 20 * b.v) * st; b.q += b.v * st; }
      if (Math.abs(b.v) < .002 && Math.abs(b.q - tq) < .0005) { b.q = tq; b.v = 0; } else moving = true;
    }
    return moving;
  }

  // ---------------------------------------------------------------- draw
  var O = {};
  function clipWord(wd, off) {
    var cov = [], ww = wd.x1 - wd.x0, tiny = em * .3, L = lines[wd.line];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i]; if (b.kind !== 'w' || b.line !== wd.line || b._fly) continue;
      var cy = b.cy + b._y, ly = L.dy - D * off;
      if (Math.abs(cy - ly) > b.h * .9) continue;
      var hw = b.w * b._sx / 2, c = b.cx + b._x;
      if (c + hw < wd.x0 || c - hw > wd.x1) continue;
      cov.push([c - hw - wd.x0, c + hw - wd.x0]);
    }
    cov.sort(function (p, q) { return p[0] - q[0]; });
    var vis = [], at = 0, j;
    for (j = 0; j < cov.length; j++) { if (cov[j][0] - at >= tiny) vis.push([at, Math.min(cov[j][0], ww)]); at = Math.max(at, cov[j][1]); if (at >= ww) break; }
    if (ww - at >= tiny) vis.push([Math.max(at, 0), ww]);
    vis = vis.filter(function (p) { return p[1] - p[0] >= tiny; });
    if (wd.el.classList.contains('pd') && cov.length) vis = [];
    var c2;
    if (!vis.length) c2 = 'polygon(0 0,0 0,0 0)';
    else if (vis.length === 1 && vis[0][0] <= 0 && vis[0][1] >= ww) c2 = 'none';
    else c2 = 'polygon(' + vis.map(function (p) {
      var a = (clamp(p[0] / ww, 0, 1) * 100).toFixed(2) + '%', z = (clamp(p[1] / ww, 0, 1) * 100).toFixed(2) + '%';
      return a + ' -40%,' + a + ' 140%,' + z + ' 140%,' + z + ' -40%';
    }).join(',') + ')';
    if (c2 !== wd.clip) { wd.tx.style.clipPath = c2; wd.clip = c2; }
  }
  function draw(now) {
    var rise = io3((ps - ACT.rise[0]) / (ACT.rise[1] - ACT.rise[0]));
    hl.style.transform = D * rise > .05 ? 'translate3d(0,' + (-D * rise).toFixed(2) + 'px,0)' : '';
    var g = out3((ps - ACT.rise[0]) / (ACT.rise[1] - ACT.rise[0] - .02));
    var gt = 'scaleX(' + g.toFixed(4) + ')'; if (gt !== gl._t) { gl.style.transform = gt; gl._t = gt; }
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i]; pose(b, ps, O);
      var x = O.x + b.ox, y = O.y + b.oy, sx = O.sx, sy = O.sy;
      // squash and stretch in the scatter, locked to the axis of travel (never a rotation)
      var v = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (v > 1) {
        var s = 1 + Math.min(v / 1800, .45), hz = Math.abs(b.vx) >= Math.abs(b.vy);
        if (hz) { sx *= s; sy /= s; } else { sy *= s; sx /= s; }
      }
      var sq = now - b.sqT; if (sq < 140) { var f = 1 - .14 * Math.sin(Math.PI * sq / 140); if (b.sqAx === 1) { sx *= f; sy /= f; } else { sy *= f; sx /= f; } }
      if (O.landed && b.bar && b.bar.q) {                   // ducking: the tower squashes toward the ground
        var q = b.bar.q, bot = G - (b.cy + y + b.h * sy / 2);
        y += bot * q + b.h * sy * q / 2; sy *= 1 - q; sx *= 1 + q * .45;
      }
      b._x = x; b._y = y; b._sx = sx; b._fly = O.landed || (O.flying && Math.abs(O.y + D * rise) > b.h * .9);
      var tf = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)' + (Math.abs(sx - 1) > .001 || Math.abs(sy - 1) > .001 ? ' scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')' : '');
      if (tf !== b.tf) { b.el.style.transform = tf; b.tf = tf; }
      var cls = O.landed ? (b.land === 'k' ? '' : b.land) : b.col === 'k' ? '' : b.col;
      if (cls !== b.cls) { b.el.className = cls; b.cls = cls; }
    }
    for (var k = 0; k < words.length; k++) clipWord(words[k], rise);
  }

  function tick(now) {
    var dt = tPrev ? clamp((now - tPrev) / 1000, 0, .05) : 1 / 60; tPrev = now;
    pT = progress();
    ps += (pT - ps) * (1 - Math.exp(-dt / TAU)); if (Math.abs(pT - ps) < 2e-4) ps = pT;
    var fade = Math.exp(-dt / .12); pvx *= fade; pvy *= fade;
    rings = rings.filter(function (r) { return now < r.t + r.life + 600; });
    targets(now);
    var m1 = integrate(now, dt), m2 = duck(dt);
    draw(now);
    var moving = m1 || m2 || ps !== pT || Math.abs(pvx) + Math.abs(pvy) > 2 || rings.length > 0 ||
      blocks.some(function (b) { return (b.seen && b.k2 !== 2) || (b.k2 && !inside && now <= b.hold + 50); });
    if (QA) { running = moving; return; }
    if (moving) requestAnimationFrame(tick); else { running = false; tPrev = 0; }
  }
  function kick() { if (QA) return; if (!running) { running = true; tPrev = 0; requestAnimationFrame(tick); } }

  function point(x, y) {
    var s = stage.getBoundingClientRect(), nx = x - s.left, ny = y - s.top, now = clock();
    if (lastX !== null && now - lastT < 120 && now > lastT) {
      var k = 1000 / Math.max(8, now - lastT);
      pvx = pvx * .5 + (nx - lastX) * k * .5; pvy = pvy * .5 + (ny - lastY) * k * .5;
    }
    lastX = nx; lastY = ny; lastT = now; mx = nx; my = ny;
    inside = nx >= 0 && nx <= s.width && ny >= 0 && ny <= s.height; kick();
  }
  function ring(x, y) { rings.push({ x: x, y: y, t: clock(), r: R * 1.5, life: 380 }); kick(); }
  function away() { inside = false; lastX = null; mx = my = -1e4; kick(); }

  function start() {
    measure();
    H.classList.add('live', 'sw-on');
    if (STILL) { ps = pT = 1; draw(performance.now()); return; }
    if (QA) {
      window.__city.advance = function (ms) { var end = qaT + ms; tPrev = qaT; while (qaT < end) { qaT = Math.min(end, qaT + 1000 / 60); tick(qaT); } return { ps: ps, running: running }; };
      window.__city.point = point; window.__city.away = away;
      window.__city.touch = function (x, y) { lastX = null; point(x, y); var s = stage.getBoundingClientRect(); ring(x - s.left, y - s.top); };
      window.__city.state = function () { return { ps: ps, pT: pT, running: running, t: qaT }; };
    }
    ps = pT = progress();
    stage.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') point(e.clientX, e.clientY); });
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') away(); });
    stage.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; if (!t) return; lastX = null; point(t.clientX, t.clientY);
      var s = stage.getBoundingClientRect();
      ring(t.clientX - s.left, t.clientY - s.top);
    }, { passive: true });
    stage.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) point(t.clientX, t.clientY); }, { passive: true });
    stage.addEventListener('touchend', away, { passive: true });
    stage.addEventListener('touchcancel', away, { passive: true });
    addEventListener('scroll', kick, { passive: true });
    var rt, w0 = innerWidth;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (innerWidth === w0 && matchMedia('(pointer: coarse)').matches) return;
        w0 = innerWidth; var keep = window.__city; measure(); if (keep && keep.advance) ['advance', 'point', 'away', 'touch', 'state'].forEach(function (k) { window.__city[k] = keep[k]; }); kick();
      }, 120);
    });
    kick();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
