// Math and logic checks for Better Days. Run: node tests/logic.test.js
// Loads src/app.js with a tiny stand-in for the browser runtime and checks scoring, grades,
// colors, deltas, charts, tips, to-dos, settings history and CSV export against hand-worked answers.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const ctx = { console, setTimeout, clearTimeout, setInterval, Date, Math, JSON, Promise, URL: { createObjectURL: () => 'blob:x' }, Blob: function () {}, File: function () {} };
ctx.window = { addEventListener() {}, removeEventListener() {} };
vm.createContext(ctx);
vm.runInContext(`class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(o) { this.state = Object.assign({}, this.state, typeof o === 'function' ? o(this.state) : o); } forceUpdate() {} }`, ctx);
vm.runInContext(src + `\n;globalThis.__x = { Component, migrateTask, tipPosFromSeen, scoreDay, letter, rgbOf, badge, delta, dR, expDelta, rings, buildChart, makeData, makeTasks, weekKey, addDays, wFor, focusFor, FACTORS, TIPLIB, DEF_IMP, getToday: () => TODAY };`, ctx);
vm.runInContext("TODAY = '2026-11-02'; START = '2026-09-03';", ctx); // fixed dates so results are the same every day
const L = ctx.__x;

let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } };
const near = (a, b, t = 1e-6) => Math.abs(a - b) < t;
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

// Scoring: all 5.0, Medium; Sleep 10.0 High (Focus). Physical = (36+12+30)/(3.6+2.4+6) = 6.5 -> 65%.
const e = { date: '2026-11-02', score: {}, imp: {}, exp: {} };
L.FACTORS.forEach((f) => { e.score[f.id] = 5; e.imp[f.id] = 'M'; e.exp[f.id] = 5; });
e.score.sleep = 10; e.imp.sleep = 'H';
let sd = L.scoreDay(e, 'score');
ok(near(sd.pillars.physical, 65), 'physical weighted 65%');
ok(near(sd.pillars.emotional, 50) && near(sd.pillars.financial, 50), 'emotional and financial 50%');
ok(near(sd.overall, 56), 'overall = 65*0.40 + 50*0.35 + 50*0.25 = 56');
const e2 = JSON.parse(JSON.stringify(e)); L.FACTORS.filter((f) => f.p === 'financial').forEach((f) => { e2.score[f.id] = null; });
sd = L.scoreDay(e2, 'score');
ok(sd.pillars.financial === null && near(sd.overall, (65 * 40 + 50 * 35) / 75), 'all-N/A pillar skipped, others re-normalize');

// Grades use the shown (rounded) percent.
[[90, 'A'], [89.6, 'A'], [89.4, 'B'], [80, 'B'], [69.7, 'C'], [69.4, 'D'], [60, 'D'], [59.4, 'F'], [0, 'F']].forEach(([p, g]) => ok(L.letter(p) === g, `letter(${p}) = ${g}`));
ok(L.badge(72).missed === '28%', 'left on the table');

// Colors.
ok(hex(L.rgbOf(30)) === '#E0201B' && hex(L.rgbOf(50)) === '#E0201B', '<=50 full red');
ok(hex(L.rgbOf(60)) !== '#E0201B' && hex(L.rgbOf(60)) !== '#FFD60A', '50-70 fades red to yellow');
ok(hex(L.rgbOf(70)) === '#FFD60A' && hex(L.rgbOf(75)) === '#FFD60A', '70-75 yellow');
ok(hex(L.rgbOf(80)) !== '#FFD60A' && hex(L.rgbOf(80)) !== '#1FA34A', 'green starts showing after 75');
ok(hex(L.rgbOf(85)) === '#1FA34A' && hex(L.rgbOf(100)) === '#1FA34A', 'full green from 85');

// Deltas match the displayed numbers.
ok(L.dR(75.4, 76.6) === 2, '75% -> 77% shows +2');
ok(L.delta(5).txt === '▲ 5' && L.delta(-0.4).txt === '0', 'delta arrows');
ok(L.expDelta(70.5, 70.4).txt === '▲ Beat expectations by 0.1 points', 'expected vs actual to one decimal');
ok(L.expDelta(73.3, 76.08).txt === '▼ Fell short by 2.8 points', 'fell short to one decimal');
ok(L.expDelta(null, 70).txt === '', 'no expectation -> no text');

// Rings and charts.
const r = L.rings({ pillars: { physical: 50, emotional: 100, financial: null } }, true);
ok(near(parseFloat(r[0].dash), Math.PI * 62, 0.1) && near(parseFloat(r[1].dash), 2 * Math.PI * 45, 0.1) && parseFloat(r[2].dash) === 0, 'ring fill fractions');
const ch = L.buildChart(['a', 'b', 'c'], (k) => ({ a: 30, b: 100, c: 65 })[k], 326, 96, true, 3);
ok(ch.dots[0].cy === '90.0' && ch.dots[1].cy === '6.0', 'chart y mapping');
const ch2 = L.buildChart(['a', 'b'], (k) => ({ a: 20, b: 100 })[k], 326, 96, false, 3);
ok(ch2.dots[0].cy === '90.0', 'very low days are not hidden');
const ch3 = L.buildChart(['a', 'b', 'c', 'd'], (k) => ({ a: 40, b: null, c: 60, d: 70 })[k], 326, 96, true, 3);
ok((ch3.path.match(/M/g) || []).length === 2, 'missed days break the line');

// App flow with sample data (makeData/makeTasks are test fixtures only).
const C = new L.Component({});
C.state.days = L.makeData(); C.state.tasks = L.makeTasks(); C.state.setup = null; C.state.setupDone = true;
let v = C.renderVals();
ok(v.hasData && v.vdb.show, 'sample data loads');
ok(v.latRecs.items.every((x) => parseFloat(x.score) < 7), 'recommendations only below 7.0');
const ids = Object.values(L.TIPLIB).flat().map((x) => x.id);
ok(new Set(ids).size === ids.length, 'tip ids unique');
const stress = () => C.renderVals().latRecs.items.find((x) => x.name === 'Stress');
if (stress()) { const first = stress().tip; stress().next(); ok(stress().tip !== first, 'New tip shows a different tip'); }
Object.keys(L.TIPLIB).forEach((k) => ok(L.TIPLIB[k].length >= 10, k + ' has at least 10 tips'));
// Tips never run out: 5 full rounds, every round shows every tip once, never the same tip twice in a row.
{
  const T = new L.Component({}); T.state.tipPos = {};
  const n = L.TIPLIB.sleep.length; const shown = [];
  for (let i = 0; i < n * 5; i++) { const t = T.tipFor('sleep'); ok(!!t, 'tip always available'); shown.push(t.id); T.newTip('sleep'); }
  for (let r = 0; r < 5; r++) ok(new Set(shown.slice(r * n, (r + 1) * n)).size === n, 'round ' + r + ' shows every tip once');
  ok(shown.every((id, i) => i === 0 || id !== shown[i - 1]), 'never the same tip twice in a row');
  ok(shown.slice(0, n).join() === L.TIPLIB.sleep.map((t) => t.id).join(), 'first round in library order');
  ok(shown.slice(n, 2 * n).join() !== shown.slice(0, n).join(), 'later rounds are shuffled');
}
// Old saves: tips already seen are skipped once; a fully seen old library starts a new round.
{
  const pos = L.tipPosFromSeen({ 'sleep-0': true, 'sleep-1': true, 'mood-0': true, 'mood-1': true });
  ok(pos.sleep.r === 0 && pos.sleep.i === 2 && !pos.stress, 'seen tips map to the next tip');
}
// To-dos: old factor links move to that factor's pillar; new ones need a pillar.
ok(L.migrateTask({ text: 'x', factor: 'saving' }).pillar === 'financial' && L.migrateTask({ text: 'y', factor: '' }).pillar === '', 'factor links become pillars');
{
  const T = new L.Component({}); T.state.tasks = []; T.state.nextId = 1;
  ok(!T.addTask('No pillar', L.getToday(), null, ''), 'pillar required');
  ok(T.addTask('Walk', L.getToday(), null, 'physical') && T.state.tasks[0].pillar === 'physical', 'to-do saved with pillar');
  T.startInput(L.getToday()); const rv = T.renderVals().rv;
  ok(rv.groups.length === 1 && rv.groups[0].name === 'Physical' && rv.groups[0].tasks[0].text === 'Walk', 'check-in groups to-dos by pillar');
  T.patchInp({ phase: 'q', fi: 0 }); const pt = T.renderVals().iv.pt;
  ok(pt.has && /Physical to-dos · 0 of 1 done/.test(pt.head), 'pillar to-dos shown on its factor pages');
  T.patchInp({ fi: 5 }); ok(!T.renderVals().iv.pt.has, 'not shown on other pillars');
}
// Work list is separate from personal to-dos.
{
  const T = new L.Component({}); T.state.tasks = []; T.state.work = []; T.state.workNextId = 1;
  T.state.workText = '  Send proposal '; T.addWork(); T.state.workText = 'Call client'; T.addWork();
  ok(T.state.work.length === 2 && T.state.work[0].text === 'Send proposal' && T.state.tasks.length === 0, 'work to-dos kept separate');
  T.toggleWork(1); let w = T.renderVals().wk;
  ok(w.items.length === 1 && w.doneItems.length === 1 && w.count === '1 to do', 'done work moves to Done');
  w.clear(); ok(T.state.work.length === 1, 'clear done');
}
// vs. day before matches the shown numbers.
{
  const vd = v.vdb; const ks = Object.keys(C.state.days).sort(); const a = L.scoreDay(C.state.days[ks[ks.length - 2]], 'score'), b = L.scoreDay(C.state.days[ks[ks.length - 1]], 'score');
  ok(vd.rows[0].b.pct === Math.round(b.overall) + '%', 'vs day before: overall shown');
  const d = Math.round(b.overall) - Math.round(a.overall); ok(vd.rows[0].d.txt === (d > 0 ? '▲ ' + d : d < 0 ? '▼ ' + -d : '0'), 'vs day before: change from rounded numbers');
  ok(vd.rows.length === 4 && vd.lines.length >= 1, 'vs day before: pillars and factor lines');
}
// History calendar: checked-in days use their grade color; days without a check-in are blank.
{
  C.state.month = { y: 2026, m: 9 }; const cells = C.renderVals().cal.cells.filter((c) => c.real);
  const d20 = cells[19]; const ov = L.scoreDay(C.state.days['2026-10-20'], 'score').overall;
  ok(d20.style.indexOf('background: rgb(' + L.rgbOf(ov).join(',') + ')') === 0, 'logged day colored by score');
  ok(/^background: transparent/.test(cells[16].style), 'missed day left blank');
}

// Week keys run Monday-Sunday.
ok(L.weekKey('2026-11-08') === '2026-11-02' && L.weekKey('2026-11-09') === '2026-11-09', 'weeks start Monday');

// Settings: weights must total 100; past days keep old weights.
const today = L.getToday();
C.state.tab = 'settings'; C.state.set = C.freshDraft();
C.renderVals().st.weights[0].inc(); C.renderVals().st.save();
ok(/must add up/.test(C.state.msg), 'save blocked when weights != 100');
C.renderVals().st.weights[2].dec(); C.renderVals().st.save();
ok(L.wFor(today).physical === 45 && L.wFor(L.addDays(today, -1)).physical === 40, 'new weights from today only');

// CSV export.
const csv = C.buildCsv().split('\n');
ok(csv[0].split(',').length === 5 + 15 * 3 + 2, 'CSV columns');
ok(csv.length === Object.keys(C.state.days).length + 1, 'CSV one row per day');

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
