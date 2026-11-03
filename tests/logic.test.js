// Math and logic checks for Better Days. Run: node tests/logic.test.js
// Loads src/app.js with a tiny stand-in for the browser runtime and checks scoring, grades,
// colors, deltas, charts, tips, to-dos, settings history and CSV export against hand-worked answers.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const ctx = { console, setTimeout, clearTimeout, setInterval, Date, Math, JSON, Promise, URL: { createObjectURL: () => 'blob:x' }, Blob: function () {}, File: function () {} };
ctx.window = { addEventListener() {}, removeEventListener() {} };
vm.createContext(ctx);
vm.runInContext(`class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(o) { this.state = Object.assign({}, this.state, typeof o === 'function' ? o(this.state) : o); } forceUpdate() {} }`, ctx);
vm.runInContext(src + `\n;globalThis.__x = { Component, fmtTime, focusOk, migrateTask, tipPosFromSeen, carryOver, repeatsOn, repeatLabel, scoreDay, letter, rgbOf, badge, delta, dR, expDelta, rings, buildChart, makeData, makeTasks, weekKey, addDays, wFor, focusFor, FACTORS, TIPLIB, DEF_IMP, getToday: () => TODAY };`, ctx);
vm.runInContext("TODAY = '2026-11-02'; START = '2026-09-03';", ctx); // fixed dates so results are the same every day
const L = ctx.__x;

let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } };
const near = (a, b, t = 1e-6) => Math.abs(a - b) < t;
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

// Scoring: all 5.0, Medium; Sleep 10.0 High. Focus is Sleep, Mood, Saving (×1.2).
// Physical = (10×3.6 + 4×(5×2)) / (3.6 + 4×2) = 76 / 11.6 = 6.5517 -> 65.517%.
// Emotional = (5×2.4 + 4×(5×2)) / (2.4 + 8) = 52 / 10.4 = 5 -> 50%. Financial likewise 50%.
const e = { date: '2026-11-02', score: {}, imp: {}, exp: {} };
L.FACTORS.forEach((f) => { e.score[f.id] = 5; e.imp[f.id] = 'M'; e.exp[f.id] = 5; });
e.score.sleep = 10; e.imp.sleep = 'H';
let sd = L.scoreDay(e, 'score');
ok(near(sd.pillars.physical, 760 / 11.6), 'physical weighted 65.5%');
ok(near(sd.pillars.emotional, 50) && near(sd.pillars.financial, 50), 'emotional and financial 50%');
ok(near(sd.overall, (760 / 11.6) * 0.40 + 50 * 0.35 + 50 * 0.25), 'overall = 65.52*0.40 + 50*0.35 + 50*0.25 = 56.21');
const e2 = JSON.parse(JSON.stringify(e)); L.FACTORS.filter((f) => f.p === 'financial').forEach((f) => { e2.score[f.id] = null; });
sd = L.scoreDay(e2, 'score');
ok(sd.pillars.financial === null && near(sd.overall, ((760 / 11.6) * 40 + 50 * 35) / 75), 'all-N/A pillar skipped, others re-normalize');

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
// Work list: day by day, separate from personal to-dos.
{
  const T = new L.Component({}); T.state.tasks = []; T.state.work = []; T.state.workNextId = 1; T.state.series = [];
  const today = L.getToday(); T.state.wDate = today;
  T.state.workText = '  Send proposal '; T.addWork(); T.state.workText = 'Call client'; T.addWork();
  ok(T.state.work.length === 2 && T.state.work[0].text === 'Send proposal' && T.state.work[0].date === today && T.state.tasks.length === 0, 'work to-dos kept separate, on the shown day');
  T.toggleWork(T.state.work[0]); let w = T.renderVals().wk;
  ok(w.items.length === 2 && w.items[1].text === 'Send proposal' && w.items[1].done && w.count === '1 of 2 done', 'done work sinks to the bottom');
  w.next(); ok(T.renderVals().wk.empty, 'other days have their own list');
}
// Planner switches between personal and work; Journal keeps one page per day.
{
  const T = new L.Component({}); T.state.tasks = []; T.state.work = []; T.state.series = []; T.state.journal = {};
  let r = T.renderVals(); ok(r.pm.isPersonal && !r.pm.isWork, 'planner opens on Personal');
  r.pm.toWork(); r = T.renderVals(); ok(r.pm.isWork && r.pm.addAria === 'Add work to-do with options', 'switch to Work');
  r.pm.add(); ok(T.state.add.kind === 'work', '+ adds a work to-do in Work mode');
  const today = L.getToday(); T.state.jDate = today;
  T.renderVals().jn.onText({ target: { value: 'Good day today' } });
  ok(T.state.journal[today] === 'Good day today' && T.renderVals().jn.count === '3 words', 'journal saves per day');
  T.renderVals().jn.next(); ok(T.renderVals().jn.text === '' && T.renderVals().jn.count === 'Blank page', 'each day starts blank');
  T.renderVals().jn.prev(); T.renderVals().jn.onText({ target: { value: '  ' } }); ok(!(today in T.state.journal), 'clearing a page removes it');
}
// Pop-up calendar in Planner jumps to a date.
{
  const T = new L.Component({}); T.state.tasks = []; T.state.work = []; T.state.series = []; T.state.pView = 'week'; T.state.pDate = '2026-11-03'; T.state.pWeek = '2026-11-02';
  T.addTask('Dentist', '2026-11-20', null, 'physical');
  T.renderVals().openPick(); let pk = T.renderVals().pk;
  ok(pk.open && pk.title === 'November 2026' && pk.cells.filter((c) => c.real).length === 30, 'calendar opens on the shown month');
  const c20 = pk.cells.filter((c) => c.real)[19]; ok(c20.dot !== 'transparent' && /1 to-do/.test(c20.aria), 'dot on days with to-dos');
  c20.pick(); ok(!T.state.pick && T.state.pView === 'day' && T.state.pDate === '2026-11-20', 'picking a date opens that day');
  T.renderVals().pm.toWork(); T.renderVals().openPick(); T.renderVals().pk.next(); ok(T.renderVals().pk.title === 'December 2026', 'next month');
  T.renderVals().pk.cells.filter((c) => c.real)[4].pick(); ok(T.state.wDate === '2026-12-05' && T.state.pMode === 'work', 'work list jumps too');
}
// No reminders anywhere: setup has 5 steps and none is about reminders.
{
  const T = new L.Component({}); T.state.setup = { step: 0 }; const su = T.renderVals().su;
  ok(su.total === 5, 'setup has 5 steps');
  let titles = []; for (let i = 0; i < 5; i++) { T.state.setup = { step: i }; titles.push(T.renderVals().su.title); }
  ok(!titles.some((t) => /remind/i.test(t)) && !('reminder' in T.state), 'no reminder step or setting');
}
// Optional times: shown as 6:00 AM, timed to-dos first in time order, kept on repeats and work.
{
  ok(L.fmtTime('06:00') === '6:00 AM' && L.fmtTime('17:30') === '5:30 PM' && L.fmtTime('00:15') === '12:15 AM' && L.fmtTime('12:00') === '12:00 PM' && L.fmtTime('') === '', 'time format');
  const T = new L.Component({}); T.state.tasks = []; T.state.series = []; T.state.seriesNextId = 1; T.state.work = []; T.state.nextId = 1;
  const d = '2026-11-10';
  T.addTask('No time', d, null, 'physical'); T.addTask('Late', d, null, 'physical', '18:00'); T.addTask('Early', d, null, 'emotional', '07:15');
  T.addSeries('personal', 'Leg day', 'physical', { type: 'weekly', days: [1] }, '2026-11-03', '17:30');
  const order = T.tasksForDay(d, true).map((t) => t.text); ok(order.join() === 'Early,Leg day,Late,No time', 'sorted by time, untimed last');
  ok(T.taskRow(T.tasksForDay(d, true)[1], false).sub === '5:30 PM · ↻ Every Tue', 'time shown on the row');
  T.state.wDate = d; T.openAdd('work'); T.patchAdd({ text: 'Standup', time: '09:00' }); T.submitAdd();
  ok(T.state.work[0].time === '09:00', 'work to-do keeps its time');
  T.state.pView = 'week'; T.state.pWeek = '2026-11-09'; T.openAdd('personal'); T.patchAdd({ text: 'Anytime', pillar: 'physical', time: '10:00' }); T.submitAdd();
  ok(T.state.tasks[T.state.tasks.length - 1].time === '', 'no time on anytime-this-week to-dos');
  ok(L.carryOver([{ id: 9, date: '2026-11-01', time: '08:00', done: false }], '2026-11-03')[0].time === '08:00', 'carried to-dos keep their time');
}
// Journal date picker, and History day sections that start collapsed.
{
  const T = new L.Component({}); T.state.tasks = []; T.state.work = []; T.state.series = []; T.state.days = L.makeData();
  T.state.journal = { '2026-10-20': 'Paid it off!' }; T.state.jDate = '2026-11-02';
  T.renderVals().openJPick(); let pk = T.renderVals().pk;
  ok(pk.open && pk.hint === 'Dots mark days you wrote in', 'journal calendar opens');
  T.renderVals().pk.prev(); const c20 = T.renderVals().pk.cells.filter((c) => c.real)[19];
  ok(c20.dot !== 'transparent' && /has an entry/.test(c20.aria), 'dot on days with an entry');
  c20.pick(); ok(T.state.jDate === '2026-10-20' && !T.state.pick && T.renderVals().jn.text === 'Paid it off!', 'picking opens that page');
  T.state.sel = '2026-10-20'; let sh = T.renderVals().sheet;
  ok(sh.groups.every((g) => !g.open) && !sh.taskSec.open && sh.noteSec.open && sh.hasJournal && !sh.jSec.open, 'note starts open, other sections collapsed');
  sh.groups[1].toggle(); sh = T.renderVals().sheet; ok(sh.groups[1].open && !sh.groups[0].open, 'tap opens one section');
  sh.groups[1].toggle(); ok(!T.renderVals().sheet.groups[1].open, 'tap again closes it');
  T.renderVals().sheet.noteSec.toggle(); ok(!T.renderVals().sheet.noteSec.open, 'note can be closed');
  T.renderVals().sheet.taskSec.toggle(); T.state.sel = '2026-10-21'; ok(T.renderVals().sheet.noteSec.open && !T.renderVals().sheet.taskSec.open, 'another day starts fresh');
}
// Focus: one factor per pillar.
{
  ok(L.focusOk(['sleep', 'mood', 'saving']) && !L.focusOk(['sleep', 'exercise', 'saving']) && !L.focusOk(['sleep', 'mood']), 'one per pillar rule');
  const T = new L.Component({}); T.state.set = T.freshDraft(); T.state.set.focus = ['sleep', 'exercise', 'saving'];
  let st = T.renderVals().st; ok(st.focusNote === 'Still need: Emotional.', 'tells you which pillar is missing');
  st.save(); ok(/one Focus factor from each pillar/.test(T.state.msg), 'cannot save without one per pillar');
  T.renderVals().st.focusGroups[1].opts[1].pick(); ok(T.state.set.focus.join() === 'sleep,stress,saving', 'pick fills the missing pillar');
  T.renderVals().st.focusGroups[0].opts[1].pick(); ok(T.state.set.focus.join() === 'exercise,stress,saving', 'tapping another in a pillar swaps it');
  T.state.setup = { step: 3 }; T.state.set.focus = ['exercise', 'saving']; let su = T.renderVals().su;
  ok(su.nextLabel === 'Pick Emotional' && /background: #2C2C2E/.test(su.nextStyle), 'setup waits for one per pillar');
}
// Carry-over: unfinished one-time to-dos move to today; done ones stay put.
{
  const out = L.carryOver([{ id: 1, date: '2026-10-30', done: false, mark: 'not', carried: '' }, { id: 2, date: '2026-10-30', done: true }, { id: 3, date: null, week: '2026-10-26', done: false }], '2026-11-02');
  ok(out[0].date === '2026-11-02' && out[0].carried === 'Oct 30' && out[0].mark === null, 'unfinished to-do carried with a note');
  ok(out[1].date === '2026-10-30' && out[2].date === null, 'done and anytime-this-week to-dos stay');
  ok(L.carryOver(out, '2026-11-03')[0].carried === 'Oct 30', 'keeps the original day when carried again');
}
// Repeating to-dos.
{
  const sr = (type, days) => ({ id: 1, kind: 'personal', text: 'x', pillar: 'physical', rule: { type, days }, start: '2026-11-03', end: null, marks: {} });
  // Nov 3 2026 is a Tuesday.
  ok(L.repeatsOn(sr('weekly', [1]), '2026-11-03') && L.repeatsOn(sr('weekly', [1]), '2026-11-10') && !L.repeatsOn(sr('weekly', [1]), '2026-11-04'), 'weekly on Tuesday');
  ok(!L.repeatsOn(sr('weekly', [1]), '2026-10-27'), 'nothing before the start date');
  ok(L.repeatsOn(sr('weekdays', []), '2026-11-06') && !L.repeatsOn(sr('weekdays', []), '2026-11-07'), 'weekdays skip Saturday');
  ok(L.repeatsOn(sr('daily', []), '2026-11-07'), 'daily');
  ok(L.repeatLabel({ type: 'weekly', days: [3, 1] }) === 'Every Tue, Thu' && L.repeatLabel({ type: 'weekdays', days: [] }) === 'Every weekday', 'repeat labels');

  const T = new L.Component({}); T.state.tasks = []; T.state.series = []; T.state.seriesNextId = 1; T.state.work = [];
  T.state.pView = 'day'; T.state.pDate = '2026-11-03'; T.openAdd('personal');
  T.patchAdd({ text: 'Leg day', pillar: 'physical' }); T.renderVals().ad.reps[3].pick();
  ok(T.state.add.rep === 'weekly' && T.state.add.wdays.join() === '2026-11-03', 'weekly starts with the chosen day');
  T.submitAdd();
  ok(T.state.series.length === 1 && T.state.series[0].rule.days.join() === '1' && T.state.series[0].start === '2026-11-03', 'repeating to-do saved');
  const occ = T.tasksForDay('2026-11-10', true); ok(occ.length === 1 && occ[0].text === 'Leg day' && occ[0].rec === 'Every Tue', 'shows up next Tuesday');
  ok(T.tasksForDay('2026-11-11', true).length === 0, 'not on Wednesday');
  T.setMark(occ[0], 'done'); ok(T.tasksForDay('2026-11-10', true)[0].done && !T.tasksForDay('2026-11-17', true)[0].done, 'each week ticked separately');
  T.delTask(T.tasksForDay('2026-11-17', true)[0]); T.skipOne();
  ok(T.tasksForDay('2026-11-17', true).length === 0 && T.tasksForDay('2026-11-24', true).length === 1, 'skip just one day');
  T.delTask(T.tasksForDay('2026-11-24', true)[0]); T.stopSeries();
  ok(T.tasksForDay('2026-11-24', true).length === 0 && T.tasksForDay('2026-12-01', true).length === 0 && T.tasksForDay('2026-11-10', true)[0].done, 'stop repeating keeps past ticks');
  // Work repeats on weekdays and never shows in personal lists.
  T.state.wDate = '2026-11-03'; T.openAdd('work'); T.patchAdd({ text: 'Check pipeline' }); T.renderVals().ad.reps[2].pick(); T.submitAdd();
  ok(T.workForDay('2026-11-06').length === 1 && T.workForDay('2026-11-07').length === 0 && T.tasksForDay('2026-11-06', true).length === 0, 'work repeats stay on the Work tab');
  T.openAdd('personal'); T.patchAdd({ text: 'No pillar' }); T.submitAdd(); ok(T.state.series.length === 2 && T.state.add.open, 'personal repeat still needs a pillar');
}
// Today vs. expected: actual % with the change from the prediction, to one decimal.
{
  const vd = v.vdb; const ks = Object.keys(C.state.days).sort(); const e = C.state.days[ks[ks.length - 1]];
  const a = L.scoreDay(e, 'score'), x = L.scoreDay(e, 'exp');
  ok(vd.show && vd.rows[0].b.pct === Math.round(a.overall) + '%' && vd.rows[0].exp === 'expected ' + Math.round(x.overall) + '%', 'vs expected: overall shown');
  const d = Math.round(a.overall * 10) / 10 - Math.round(x.overall * 10) / 10; const r = Math.round(d * 10) / 10;
  ok(vd.rows[0].d.txt === (r > 0 ? '▲ ' + r.toFixed(1) : r < 0 ? '▼ ' + Math.abs(r).toFixed(1) : '0.0'), 'vs expected: one-decimal change');
  ok(vd.rows.length === 4 && vd.lines.length >= 1, 'vs expected: pillars and factor lines');
  const T = new L.Component({}); T.state.days = { [L.getToday()]: Object.assign({}, e, { date: L.getToday(), exp: {} }) };
  ok(!T.renderVals().vdb.show, 'hidden when no prediction was made');
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
ok(csv[0].split(',').length === 5 + 15 * 3 + 3, 'CSV columns (with journal)');
ok(csv.length === Object.keys(C.state.days).length + 1, 'CSV one row per day');

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
