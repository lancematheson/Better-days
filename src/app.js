
function localToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
let TODAY = localToday();
// Saved app data lives on the phone (localStorage). Nothing is sent anywhere.
const STORE_KEY = 'dayscore.v1';
function loadStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }
const SAVED = loadStore();
let START = (SAVED && SAVED.start) || TODAY;
const FACTORS = [
  { id: 'sleep', name: 'Sleep', p: 'physical', lo: 'barely slept or very poor sleep', hi: 'full, restful night' },
  { id: 'exercise', name: 'Exercise', p: 'physical', lo: 'sedentary all day', hi: 'did the planned workout or very active' },
  { id: 'nutrition', name: 'Nutrition', p: 'physical', lo: 'mostly junk or skipped meals', hi: 'balanced, on-plan eating' },
  { id: 'hydration', name: 'Hydration', p: 'physical', lo: 'barely drank water', hi: 'hit your water goal' },
  { id: 'energy', name: 'Body / Energy', p: 'physical', lo: 'sick, in pain or exhausted', hi: 'felt strong and energized' },
  { id: 'mood', name: 'Mood', p: 'emotional', lo: 'low or down all day', hi: 'upbeat and positive' },
  { id: 'stress', name: 'Stress', p: 'emotional', lo: 'overwhelmed', hi: 'calm and in control' },
  { id: 'connection', name: 'Connection', p: 'emotional', lo: 'isolated, or conflict with people', hi: 'meaningful time with others' },
  { id: 'purpose', name: 'Purpose', p: 'emotional', lo: 'felt wasted or aimless', hi: 'did what mattered to you' },
  { id: 'rest', name: 'Mental Rest', p: 'emotional', lo: 'no downtime at all', hi: 'recharged with a hobby, quiet time or reflection' },
  { id: 'spending', name: 'Spending', p: 'financial', lo: 'impulsive or well over plan', hi: 'stayed within plan' },
  { id: 'saving', name: 'Saving', p: 'financial', lo: 'pulled from savings', hi: 'moved money toward goals' },
  { id: 'earning', name: 'Earning / Work', p: 'financial', lo: 'unproductive or lost income', hi: 'strong work day or income progress' },
  { id: 'obligations', name: 'Obligations', p: 'financial', lo: 'missed a bill or added debt', hi: 'everything on track or paid down' },
  { id: 'awareness', name: 'Awareness', p: 'financial', lo: 'no idea where money stands', hi: 'checked accounts, tracked or planned' }
];
const PILLARS = [
  { id: 'physical', name: 'Physical', w: 40 },
  { id: 'emotional', name: 'Emotional', w: 35 },
  { id: 'financial', name: 'Financial', w: 25 }
];
const FOCUS = (SAVED && SAVED.focus0) || ['sleep', 'mood', 'saving'];
const IW = { H: 3, M: 2, L: 1 };
const INAME = { H: 'High', M: 'Medium', L: 'Low' };
const DEF_IMP = { sleep: 'H', exercise: 'H', nutrition: 'M', hydration: 'L', energy: 'M', mood: 'H', stress: 'H', connection: 'M', purpose: 'M', rest: 'L', spending: 'H', saving: 'M', earning: 'H', obligations: 'M', awareness: 'L' };
const BASE = { sleep: 6.0, exercise: 6.2, nutrition: 6.0, hydration: 7.0, energy: 6.6, mood: 6.9, stress: 5.9, connection: 6.7, purpose: 6.9, rest: 5.7, spending: 7.0, saving: 6.2, earning: 7.4, obligations: 8.4, awareness: 5.9 };
// Built-in tip library (about 10 per factor), written in plain words from each source's main ideas.
// Existing tips keep their position so saved progress lines up. Tips rotate forever: once every tip for a
// factor has been shown, a new shuffled round starts (never the same tip twice in a row).
const SRC = {
  hub: { author: 'Andrew Huberman', work: 'Huberman Lab', url: 'https://www.hubermanlab.com' },
  walker: { author: 'Matthew Walker', work: 'Why We Sleep', url: 'https://www.sleepdiplomat.com' },
  attia: { author: 'Peter Attia', work: 'Outlive', url: 'https://peterattiamd.com' },
  pollan: { author: 'Michael Pollan', work: 'Food Rules', url: 'https://michaelpollan.com' },
  mayo: { author: 'Mayo Clinic', work: 'Water: How much should you drink?', url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256' },
  burns: { author: 'David D. Burns', work: 'Feeling Good', url: 'https://feelinggood.com' },
  neff: { author: 'Kristin Neff', work: 'Self-Compassion', url: 'https://self-compassion.org' },
  seligman: { author: 'Martin Seligman', work: 'Flourish', url: 'https://www.authentichappiness.sas.upenn.edu' },
  nag: { author: 'Emily & Amelia Nagoski', work: 'Burnout', url: 'https://www.emilynagoski.com' },
  mcg: { author: 'Kelly McGonigal', work: 'The Upside of Stress', url: 'https://kellymcgonigal.com' },
  wal: { author: 'Robert Waldinger & Marc Schulz', work: 'The Good Life', url: 'https://www.lifespanresearch.org' },
  frankl: { author: 'Viktor Frankl', work: 'Man’s Search for Meaning', url: 'https://www.viktorfrankl.org' },
  pang: { author: 'Alex Soojung-Kim Pang', work: 'Rest', url: 'https://www.hachettebookgroup.com/titles/alex-soojung-kim-pang/rest/9781541604834/' },
  newport: { author: 'Cal Newport', work: 'Digital Minimalism', url: 'https://calnewport.com' },
  deepwork: { author: 'Cal Newport', work: 'Deep Work', url: 'https://calnewport.com' },
  sethi: { author: 'Ramit Sethi', work: 'I Will Teach You to Be Rich', url: 'https://www.iwillteachyoutoberich.com' },
  collins: { author: 'JL Collins', work: 'The Simple Path to Wealth', url: 'https://jlcollinsnh.com' },
  ramsey: { author: 'Dave Ramsey', work: 'The Total Money Makeover', url: 'https://www.ramseysolutions.com' },
  housel: { author: 'Morgan Housel', work: 'The Psychology of Money', url: 'https://collabfund.com/blog/' },
  robin: { author: 'Vicki Robin & Joe Dominguez', work: 'Your Money or Your Life', url: 'https://www.yourmoneyoryourlife.com' }
};
const RAW = {
  sleep: [['hub', 'Get outside for morning sunlight soon after waking to help set your sleep schedule.'], ['hub', 'Keep lights dim in the late evening and avoid bright overhead light before bed.'], ['hub', 'Keep your bedroom cool and dark. A slight drop in body temperature helps you fall asleep.'],
    ['walker', 'Go to bed and wake up at the same time every day, weekends included.'],
    ['walker', 'Cut off caffeine by early afternoon. It stays in your system for many hours.'],
    ['walker', 'Skip the nightcap. Alcohol may help you nod off, but it breaks up your sleep later in the night.'],
    ['walker', 'If you can’t fall asleep after about 20 minutes, get up and do something calm in dim light until you feel sleepy.'],
    ['walker', 'Give yourself a full 8-hour window in bed so you can actually get 7 to 9 hours of sleep.'],
    ['walker', 'Take a warm bath or shower before bed. Your body cools down quickly afterward, which helps you fall asleep.'],
    ['hub', 'Look at the late-afternoon or evening sun for a few minutes. It helps your body clock know when the day is ending.']],
  exercise: [['hub', 'Build a weekly routine that mixes resistance training with cardio, and put each session on your calendar.'], ['hub', 'Include steady cardio where you can still hold a conversation, several times a week.'],
    ['hub', 'Try a simple weekly plan: one long endurance session, one hard interval session, and strength days for legs and for upper body.'],
    ['hub', 'You don’t have to lift to total failure. Stopping a rep or two short still builds strength.'],
    ['hub', 'Take a 10 to 15 minute walk after meals. It helps keep blood sugar steady.'],
    ['attia', 'Aim for about three hours a week of easy “zone 2” cardio, where you can talk but would rather not sing.'],
    ['attia', 'Once a week, do hard intervals, like four 4-minute pushes with 4 easy minutes between, to raise your top-end fitness.'],
    ['attia', 'Train for the life you want at 80: carrying groceries, getting up off the floor, playing with grandkids.'],
    ['attia', 'Work on grip strength with carries and dead hangs. Grip is a strong signal of overall health as you age.'],
    ['attia', 'Practice balance and stability, like standing on one leg, to protect yourself from falls later in life.']],
  nutrition: [['hub', 'Build most meals around minimally processed foods.'],
    ['pollan', 'Eat food. Not too much. Mostly plants.'],
    ['pollan', 'Skip food products with more than five ingredients, or ingredients you can’t pronounce.'],
    ['pollan', 'Don’t eat anything your great-grandmother wouldn’t recognize as food.'],
    ['pollan', 'Shop the edges of the grocery store, where the fresh food usually is.'],
    ['pollan', 'Eat meals at a table, not at your desk or in the car.'],
    ['pollan', 'Stop eating when you’re satisfied, not when you’re full.'],
    ['pollan', 'Cook more of your own meals. Home cooking is usually healthier than anything ready-made.'],
    ['attia', 'Get enough protein, and spread it across your meals with a solid serving at each.'],
    ['attia', 'There are three ways to eat less: eat less overall, cut out certain foods, or shorten your eating window. Pick the one you can stick with.']],
  hydration: [['hub', 'Spread water through the day instead of all at once, and add electrolytes when you sweat a lot.'], ['hub', 'Start the day with water, before your first coffee.'],
    ['hub', 'For the first 10 hours after waking, aim for about 8 ounces of water every hour.'],
    ['hub', 'Drink extra during exercise. A few gulps every 15 to 20 minutes is a good rough guide.'],
    ['hub', 'Taper off drinks in the last couple of hours before bed so you aren’t up at night.'],
    ['mayo', 'Pale yellow urine is a simple sign you’re drinking enough. Dark yellow means drink more.'],
    ['mayo', 'Drink a glass of water with each meal and between meals.'],
    ['mayo', 'Drink more on hot days, when you exercise, or when you’re sick with a fever.'],
    ['mayo', 'Food counts too. Fruits and vegetables like watermelon, cucumber and spinach are mostly water.'],
    ['mayo', 'Choose water over sugary drinks. It hydrates you without the extra calories.']],
  energy: [['hub', 'Get light and movement early in the day, and wait 90 to 120 minutes after waking before your first caffeine.'], ['hub', 'Try a short non-sleep deep rest (NSDR) session or a brief nap in the afternoon to restore energy.'],
    ['hub', 'Stop caffeine 8 to 10 hours before bed so it doesn’t steal tonight’s sleep and tomorrow’s energy.'],
    ['hub', 'A brief cold shower can raise your alertness for hours afterward.'],
    ['hub', 'Breathing changes your energy. Slow breaths calm you down; a minute of faster, deeper breaths wakes you up.'],
    ['hub', 'When you need to focus, keep daytime meals lighter. Big, heavy meals tend to make you sleepy.'],
    ['walker', 'Most energy problems trace back to sleep. Protect your sleep before reaching for more caffeine.'],
    ['walker', 'A short early-afternoon nap of 20 to 30 minutes can restore alertness. Keep it short and not too late.'],
    ['attia', 'Break up long stretches of sitting with a few minutes of walking or movement every hour.'],
    ['pang', 'Do your hardest work when you feel sharpest, often in the morning, and save easier tasks for your afternoon slump.']],
  mood: [['burns', 'Write down the thought that is bringing you down, spot the distortion in it (like all-or-nothing thinking), and rewrite it more accurately.'], ['neff', 'Talk to yourself the way you would talk to a good friend who is struggling.'],
    ['burns', 'Ask yourself, “What would I tell a friend who had this thought?” Then say that to yourself.'],
    ['burns', 'Watch for “should” statements. Swap “I should have…” for “It would have been nice if…, and here’s what I’ll try next.”'],
    ['burns', 'Do one small, doable thing now. Action often comes before motivation, not after.'],
    ['burns', 'Predict how much you’ll enjoy something from 0 to 100, do it, then rate it again. It’s often better than you expected.'],
    ['neff', 'When things are hard, put a hand on your chest and tell yourself: this is hard, everyone struggles, may I be kind to myself.'],
    ['neff', 'Remember you’re not alone. Mistakes and bad days are part of being human, not proof something is wrong with you.'],
    ['seligman', 'Each night, write down three things that went well today and why they happened.'],
    ['seligman', 'Write a thank-you letter to someone who made a difference in your life, and read it to them if you can.']],
  stress: [['nag', 'When stress builds up, finish the stress cycle with physical activity, even a short walk.'], ['mcg', 'Try seeing stress as your body getting ready to meet a challenge. That view can change how stress affects you.'], ['nag', 'Other ways to finish the stress cycle: slow deep breaths, a real laugh, a long hug or a good cry.'],
    ['nag', 'Your stress and its cause are different things. Even after a problem is solved, your body may still need to let the stress out.'],
    ['nag', 'Do something creative, like drawing, music or writing, to help your body release stress.'],
    ['nag', 'A 20-second hug with someone you trust can tell your body you’re safe.'],
    ['mcg', 'Notice the stress and remind yourself it shows up because you care about something. Then use the energy it gives you.'],
    ['mcg', 'Stress can push you to connect. Reaching out to help someone else can ease your own stress.'],
    ['mcg', 'Before a stressful moment, remind yourself that a racing heart is your body getting ready to perform.'],
    ['hub', 'Try a “physiological sigh”: two inhales through the nose, then a long, slow exhale through the mouth. One to three can calm you quickly.']],
  connection: [['wal', 'Close relationships are among the strongest predictors of a happy, healthy life. Reach out to one person you care about today.'], ['wal', 'Relationships need regular upkeep, a kind of social fitness. Check in on one you have let slide.'],
    ['wal', 'Ask someone a question you’ve never asked them before. Curiosity deepens relationships.'],
    ['wal', 'Swap one scrolling session for a phone call or coffee with a friend.'],
    ['wal', 'The quality of your relationships matters more than the number. Invest in the few that matter most.'],
    ['wal', 'Loneliness affects your health, not just your mood. Treat time with people as part of staying healthy.'],
    ['wal', 'Keep up with people from different parts of your life: family, friends, coworkers and neighbors.'],
    ['wal', 'Give the people you’re with your full attention. Put the phone away during meals and conversations.'],
    ['wal', 'Don’t wait for a reason to reach out. A quick “thinking of you” text counts.'],
    ['newport', 'Choose real conversation over likes and comments. A phone call or face-to-face talk builds far more connection.']],
  purpose: [['frankl', 'Meaning can come from your work, from the people you love and from how you face hard things. Name one thing that gives today’s effort meaning.'], ['frankl', 'You cannot always choose what happens, but you can choose your attitude toward it.'],
    ['frankl', 'When something hard happens, ask “What is this asking of me?” instead of “Why me?”'],
    ['frankl', 'Meaning often comes from caring for someone or something beyond yourself.'],
    ['frankl', 'Don’t chase success directly. It tends to follow when you commit to something bigger than you.'],
    ['frankl', 'Live as if you were living for the second time and had gotten it wrong the first time. What would you do differently today?'],
    ['frankl', 'Small acts, like doing your work well or helping one person, can carry real meaning.'],
    ['seligman', 'Use one of your strengths in a new way today.'],
    ['seligman', 'A meaningful life comes from belonging to and serving something bigger than yourself.'],
    ['deepwork', 'Spend focused, undistracted time on work that matters to you. Deep work brings a real sense of meaning.']],
  rest: [['pang', 'Treat rest as a skill: take real breaks like walks or short naps, and protect time fully away from work.'], ['newport', 'Set aside time away from your phone and replace scrolling with a hobby you actually enjoy.'], ['pang', 'Active hobbies like sports or making things restore you more than passive downtime.'],
    ['pang', 'Stop work at a point where you know what comes next. It’s easier to switch off, and easier to start again tomorrow.'],
    ['pang', 'Take a walk. Walking is one of the best ways to rest your mind and let new ideas come.'],
    ['pang', 'Detach fully after work. No checking email in the evening.'],
    ['pang', 'A short nap is real rest, not laziness.'],
    ['newport', 'Spend some time alone with your thoughts, without a podcast or your phone.'],
    ['newport', 'Try a 30-day break from optional apps, then add back only the ones that truly help you.'],
    ['newport', 'Leave your phone at home for a short walk or errand.']],
  spending: [['sethi', 'Decide ahead of time what you love spending on, and cut back hard on everything else.'], ['robin', 'Before buying, ask whether it is worth the hours of your life you traded to earn the money.'],
    ['sethi', 'Split your money four ways: fixed costs, investing, savings, and guilt-free spending you can use however you like.'],
    ['sethi', 'Don’t sweat the latte. Focus on the big costs, like housing, cars and food.'],
    ['sethi', 'Cancel subscriptions you don’t use, and call to negotiate lower bills for your phone, internet and insurance.'],
    ['housel', 'Spending money to show people how much you have is the fastest way to have less.'],
    ['housel', 'No one is as impressed by your stuff as you are.'],
    ['robin', 'Ask whether each expense brought you fulfillment worth the life energy it cost.'],
    ['ramsey', 'Give every dollar a job before the month starts with a zero-based budget.'],
    ['ramsey', 'Use cash envelopes for categories where you tend to overspend, like eating out.']],
  saving: [['collins', 'Spend less than you earn, invest the difference in a low-cost index fund, and avoid debt.'], ['housel', 'Save even without a specific goal. Savings give you flexibility and options.'], ['sethi', 'Automate your savings so money moves before you can spend it.'],
    ['collins', 'Raise your savings rate a little at a time. The more you save, the sooner your money can support you.'],
    ['collins', 'Keep investing simple. A broad stock market index fund does the heavy lifting.'],
    ['collins', 'When the market drops, don’t sell. Stay the course.'],
    ['housel', 'Your savings rate matters more than your investment returns, and it’s the part you control.'],
    ['housel', 'Leave room for error. Keep more cash on hand than you think you need.'],
    ['ramsey', 'Build a full emergency fund of 3 to 6 months of expenses once your consumer debt is paid off.'],
    ['sethi', 'Open a separate savings account for each goal, like a trip or a car, and give it a name.']],
  earning: [['sethi', 'Focus on big wins, like negotiating your salary or growing your income, before trimming small expenses.'], ['robin', 'Figure out your real hourly wage once you subtract work costs like commuting and work clothes.'],
    ['sethi', 'Keep a list of your wins at work and bring it to your manager before review time to ask for a raise.'],
    ['sethi', 'Build a side income around a skill people already pay for.'],
    ['sethi', 'Always negotiate a job offer. A small raise now grows over your whole career.'],
    ['robin', 'Chart your monthly income and spending together so you can watch the gap between them grow.'],
    ['deepwork', 'Block out time for focused work with no email or messages. That’s where your most valuable work happens.'],
    ['deepwork', 'Plan your workday in blocks so every hour has a job.'],
    ['deepwork', 'End each workday with a short shutdown routine: review what’s left, plan tomorrow, then stop.'],
    ['housel', 'Being able to control your own time is the biggest payoff money gives. Work toward more control over your schedule.']],
  obligations: [['ramsey', 'List your debts from smallest to largest and pay off the smallest first (the debt snowball).'], ['ramsey', 'Start with a small starter emergency fund before attacking debt, so surprises do not go on a card.'],
    ['ramsey', 'Stop borrowing while you pay off debt.'],
    ['ramsey', 'Put extra money, like a raise or tax refund, toward the debt snowball.'],
    ['ramsey', 'When a debt is paid off, roll its payment into the next one so the snowball grows.'],
    ['ramsey', 'Make a written budget every month, and agree on it with your partner if you share money.'],
    ['sethi', 'Set up automatic payments so you never miss a due date.'],
    ['sethi', 'Call your credit card company and ask for a lower interest rate or to waive a late fee. It often works.'],
    ['sethi', 'Pay your credit card in full every month so you never pay interest.'],
    ['housel', 'Avoid any debt you couldn’t survive if things went wrong. Staying in the game matters most.']],
  awareness: [['robin', 'Track every dollar that comes in or goes out, so you know where your money really goes.'], ['housel', 'Wealth is what you do not see: the money you did not spend.'],
    ['robin', 'Add up what you’ve earned in your lifetime and compare it with what you have to show for it.'],
    ['robin', 'Once a month, total up your income and spending by category.'],
    ['robin', 'Find your “enough”: the point where spending more stops making you happier.'],
    ['sethi', 'Spend a few minutes each week checking your accounts. It keeps small problems from growing.'],
    ['sethi', 'Know your numbers: what you take home, your fixed costs, and what’s left over.'],
    ['sethi', 'Check your credit report and score once a year.'],
    ['ramsey', 'Check your budget each week so you catch problems before the month ends.'],
    ['collins', 'Know what your investments cost you in fees. Low fees leave more money for you.']]
};
const TIPLIB = {};
Object.keys(RAW).forEach(function (k) { TIPLIB[k] = RAW[k].map(function (r, i) { return Object.assign({ id: k + '-' + i, tip: r[1] }, SRC[r[0]]); }); });
// Order tips are shown in for a factor's round. Round 0 is library order; later rounds are shuffled
// (same shuffle every time) and never start with the tip that ended the round before.
const TIP_ORDERS = {};
function tipOrder(fid, round) {
  const key = fid + ':' + round; if (TIP_ORDERS[key]) return TIP_ORDERS[key];
  const n = (TIPLIB[fid] || []).length; const a = []; for (let i = 0; i < n; i++) a.push(i);
  if (round > 0 && n > 1) {
    let h = 7; for (let i = 0; i < fid.length; i++) h = (h * 31 + fid.charCodeAt(i)) | 0;
    const R = rng(h + round * 7919);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    const prev = tipOrder(fid, round - 1);
    if (a[0] === prev[n - 1]) { const t = a[0]; a[0] = a[1]; a[1] = t; }
  }
  TIP_ORDERS[key] = a; return a;
}
// Older saves stored which tips had been seen; those were shown in library order, so start just after them.
function tipPosFromSeen(seen) {
  const pos = {};
  Object.keys(TIPLIB).forEach(function (k) { let c = 0; TIPLIB[k].forEach(function (t) { if (seen && seen[t.id]) c++; }); if (c) pos[k] = c >= TIPLIB[k].length ? { r: 1, i: 0 } : { r: 0, i: c }; });
  return pos;
}
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const UP = '#30D158', DOWN = '#FF6961', NEU = '#98989F';

function addDays(k, n) { const d = new Date(k + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function fmt(k) { const d = new Date(k + 'T12:00:00Z'); return WD[d.getUTCDay()] + ', ' + MO[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
function fmtShort(k) { const d = new Date(k + 'T12:00:00Z'); return MO[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
function dayDiff(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }
function r1(x) { return Math.round(Math.max(0, Math.min(10, x)) * 10) / 10; }
function f1(v) { return v == null ? 'N/A' : Number(v).toFixed(1); }
function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Settings history: past days keep the weights and Focus that applied at the time.
let WHIST = (SAVED && SAVED.whist) || [{ from: '2000-01-01', w: { physical: 40, emotional: 35, financial: 25 } }];
let FHIST = (SAVED && SAVED.fhist) || [{ from: '2000-01-01', list: FOCUS.slice() }];
if (SAVED && SAVED.names) FACTORS.forEach(function (f) { if (SAVED.names[f.id]) f.name = SAVED.names[f.id]; });
if (SAVED && SAVED.defImp) Object.keys(SAVED.defImp).forEach(function (k) { DEF_IMP[k] = SAVED.defImp[k]; });
function blankEntry(k) { const e = { date: k, score: {}, imp: {}, exp: {}, note: '', edited: '' }; FACTORS.forEach(function (f) { e.score[f.id] = null; e.exp[f.id] = null; e.imp[f.id] = DEF_IMP[f.id]; }); return e; }
function histFor(h, key) { let best = h[0]; h.forEach(function (x) { if (x.from <= key && x.from >= best.from) best = x; }); return best; }
function wFor(date) { return histFor(WHIST, date || '9999-12-31').w; }
function focusFor(date) { return histFor(FHIST, date ? weekKey(date) : '9999-12-31').list; }
// Points possible per factor: swipe check-ins (scale 9) top out at Good = 9; older typed days top out at 10.
function maxPts(e) { return (e && e.scale) || 10; }
// A factor's score in words for swipe days (Good / Okay / Bad), as a number for older typed days.
function scoreTxt(e, v) { return maxPts(e) === 9 && v != null ? answerLabel(v) : f1(v); }
function wt(e, f) { return IW[(e.imp && e.imp[f]) || 'M'] * (focusFor(e.date).indexOf(f) >= 0 ? 1.2 : 1); }
function scoreDay(e, which) {
  const res = { pillars: {}, overall: null };
  let tot = 0, tw = 0; const PW = wFor(e.date);
  PILLARS.forEach(function (p) {
    let s = 0, w = 0;
    FACTORS.forEach(function (f) {
      if (f.p !== p.id) return;
      const v = e[which] ? e[which][f.id] : null;
      if (v == null) return;
      const x = wt(e, f.id); s += v * x; w += x;
    });
    const pct = w ? s / (w * maxPts(e)) * 100 : null; // points earned ÷ points possible (all weights kept)
    res.pillars[p.id] = pct;
    if (pct != null) { tot += pct * PW[p.id]; tw += PW[p.id]; }
  });
  res.overall = tw ? tot / tw : null;
  return res;
}
function letter(p) { const q = Math.round(p); return q >= 90 ? 'A' : q >= 80 ? 'B' : q >= 70 ? 'C' : q >= 60 ? 'D' : 'F'; }
// Change between two shown values, computed from the rounded numbers so it always matches what is on screen.
function dR(a, b, dec) { if (a == null || b == null) return null; return dec ? Math.round(b * 10) / 10 - Math.round(a * 10) / 10 : Math.round(b) - Math.round(a); }
function h2r(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
function mix(a, b, t) { const A = h2r(a), B = h2r(b); return A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }); }
// Grade colors: 50 and below full red, red to yellow 50-70, yellow 70-75, green appears from 75, full green 85+.
function rgbOf(p) {
  if (p <= 50) return h2r('#E0201B');
  if (p <= 70) return mix('#E0201B', '#FFD60A', (p - 50) / 20);
  if (p <= 75) return h2r('#FFD60A');
  if (p < 85) return mix('#FFD60A', '#1FA34A', (p - 75) / 10);
  return h2r('#1FA34A');
}
function weekKey(k) { const d = new Date(k + 'T12:00:00Z'); return addDays(k, -((d.getUTCDay() + 6) % 7)); }
function makeTasks() {
  const t = [
    { text: 'Long run, 6 miles', date: '2026-11-01', factor: 'exercise', done: true },
    { text: 'Meal prep for the week', date: '2026-11-01', factor: 'nutrition', done: true },
    { text: 'Move $200 to savings', date: '2026-11-01', factor: 'saving', done: false },
    { text: 'Gym: legs', date: '2026-11-02', factor: 'exercise', done: false, time: '06:00' },
    { text: 'Pay electric bill', date: '2026-11-02', factor: 'obligations', done: true },
    { text: 'Call Mom', date: '2026-11-02', factor: 'connection', done: false },
    { text: 'Lights out by 10:30 PM', date: '2026-11-02', factor: 'sleep', done: false },
    { text: 'Prep for team meeting', date: '2026-11-03', factor: 'earning', done: false },
    { text: 'Run 3 miles', date: '2026-11-03', factor: 'exercise', done: false },
    { text: 'Review this month’s budget', date: '2026-11-04', factor: 'awareness', done: false },
    { text: 'Read two chapters', week: '2026-11-02', factor: 'rest', done: false },
    { text: 'Book dentist appointment', week: '2026-11-02', factor: 'energy', done: false },
    { text: 'Plan weekend with friends', week: '2026-11-02', factor: 'connection', done: true }
  ];
  return t.map(function (x, i) {
    const o = { id: i + 1, text: x.text, date: x.date || null, week: x.week || null, factor: x.factor || '', time: x.time || '', done: x.done, mark: x.done ? 'done' : null, carried: '' };
    if (o.date && o.date < TODAY && !o.done) { o.carried = fmtShort(o.date); o.date = TODAY; }
    return migrateTask(o);
  });
}
function makeWork() {
  const t = [['Send Q4 proposal to Dana', 0, false], ['Follow up with Acme on renewal', 0, false], ['Update pipeline notes', 0, true], ['Prep slides for Thursday', 1, false], ['Call back Jordan', -1, false]];
  return carryOver(t.map(function (x, i) { return { id: i + 1, text: x[0], date: addDays(TODAY, x[1]), done: x[2], carried: '' }; }), TODAY);
}
function makeSeries() {
  return [
    { id: 1, kind: 'personal', text: 'Leg day', time: '17:30', pillar: 'physical', rule: { type: 'weekly', days: [1] }, start: '2026-10-01', end: null, marks: { '2026-10-27': 'done' } },
    { id: 2, kind: 'personal', text: 'Take vitamins', pillar: 'physical', rule: { type: 'daily', days: [] }, start: '2026-10-25', end: null, marks: {} },
    { id: 3, kind: 'work', text: 'Check pipeline', time: '09:00', pillar: '', rule: { type: 'weekdays', days: [] }, start: '2026-10-01', end: null, marks: {} }
  ];
}
const PCOL = { physical: '#64D2FF', emotional: '#FF6FAE', financial: '#BF5AF2' };
function pillarOfFactor(id) { const f = FACTORS.filter(function (x) { return x.id === id; })[0]; return f ? f.p : ''; }
function pillarName(id) { const p = PILLARS.filter(function (x) { return x.id === id; })[0]; return p ? p.name : ''; }
// To-dos used to link to a factor; now they belong to a pillar. Linked ones move to that factor's pillar.
function migrateTask(t) { if (t.pillar !== undefined) return t; return Object.assign({}, t, { pillar: pillarOfFactor(t.factor) }); }
// Repeating to-dos. rule: { type: 'daily' | 'weekdays' | 'weekly', days: [0-6, Monday = 0] }.
// Each day's copy is worked out from the rule; ticks are kept per date in series.marks.
function dow0(k) { return (new Date(k + 'T12:00:00Z').getUTCDay() + 6) % 7; }
const WDN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function repeatsOn(sr, k) {
  if (k < sr.start || (sr.end && k > sr.end) || (sr.marks && sr.marks[k] === 'skip')) return false;
  const d = dow0(k); const r = sr.rule;
  return r.type === 'daily' || (r.type === 'weekdays' && d < 5) || (r.type === 'weekly' && r.days.indexOf(d) >= 0);
}
// Optional start time on to-dos, stored as 'HH:MM' (24h); shown as '6:00 AM'.
function fmtTime(t) { if (!t) return ''; const p = t.split(':'); const h = +p[0]; return (h % 12 || 12) + ':' + p[1] + ' ' + (h < 12 ? 'AM' : 'PM'); }
// Timed to-dos first, in time order; untimed keep their order after them.
function byTime(list) { return list.map(function (t, i) { return [t, i]; }).sort(function (a, b) { const x = a[0].time || '', y = b[0].time || ''; if (x && y && x !== y) return x < y ? -1 : 1; if (x && !y) return -1; if (!x && y) return 1; return a[1] - b[1]; }).map(function (p) { return p[0]; }); }
function repeatLabel(r) {
  if (r.type === 'daily') return 'Every day';
  if (r.type === 'weekdays') return 'Every weekday';
  return 'Every ' + r.days.slice().sort().map(function (d) { return WDN[d]; }).join(', ');
}
// Unfinished one-off to-dos from earlier days move to today, noting where they came from.
// Repeating to-dos never carry over; a missed one just stays not done on its day.
function carryOver(list, today) {
  let changed = false;
  const out = list.map(function (t) {
    if (!t.date || t.date >= today || t.done) return t;
    changed = true; return Object.assign({}, t, { date: today, mark: null, carried: t.carried || fmtShort(t.date) });
  });
  return changed ? out : list;
}
// ---------- Scan: read a photo of a list on the phone and turn each line into a to-do ----------
// The text reader (Tesseract, in vendor/ocr/) runs on the phone; nothing is sent anywhere.
// parseScan is plain text-in, rows-out so it can be tested without a photo.
const MON3 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WDAYS = [['mon', 'monday'], ['tue', 'tues', 'tuesday'], ['wed', 'weds', 'wednesday'], ['thu', 'thur', 'thurs', 'thursday'], ['fri', 'friday'], ['sat', 'saturday'], ['sun', 'sunday']];
const WD_RE = WDAYS.map(function (w) { return w.slice().sort(function (a, b) { return b.length - a.length; }).join('|'); }).join('|');
const MON_RE = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
const PILLAR_WORDS = {
  physical: ['gym', 'run', 'running', 'jog', 'walk', 'workout', 'work out', 'lift', 'legs', 'leg day', 'yoga', 'stretch', 'swim', 'bike', 'hike', 'sleep', 'nap', 'bed', 'doctor', 'dr', 'dentist', 'physio', 'meal', 'meal prep', 'cook', 'eat', 'groceries', 'grocery', 'water', 'vitamins', 'steps', 'exercise', 'training', 'haircut'],
  emotional: ['call', 'text', 'mom', 'dad', 'family', 'friend', 'friends', 'date', 'kids', 'wife', 'husband', 'journal', 'read', 'book', 'meditate', 'therapy', 'pray', 'church', 'birthday', 'gift', 'card', 'visit', 'dinner with', 'lunch with', 'coffee with', 'relax', 'hobby', 'movie', 'thank'],
  financial: ['pay', 'bill', 'bills', 'rent', 'mortgage', 'budget', 'bank', 'save', 'savings', 'invest', 'invoice', 'tax', 'taxes', 'insurance', 'credit', 'loan', 'debt', 'refund', 'money', 'transfer', 'deposit', 'paycheck', 'subscription', 'cancel', 'return', 'quote', 'estimate', '$']
};
function guessPillar(t) {
  const lt = ' ' + t.toLowerCase().replace(/[^a-z0-9$ ]/g, ' ') + ' ';
  let best = '', bn = 0;
  Object.keys(PILLAR_WORDS).forEach(function (p) {
    let n = 0; PILLAR_WORDS[p].forEach(function (w) { if (w === '$' ? t.indexOf('$') >= 0 : lt.indexOf(' ' + w + ' ') >= 0) n++; });
    if (n > bn) { bn = n; best = p; }
  });
  return best;
}
function ymd(y, m, d) { const dt = new Date(Date.UTC(y, m, d)); if (dt.getUTCMonth() !== m) return null; return dt.toISOString().slice(0, 10); }
// A month/day with no year: this year, unless that was more than 60 days ago (then next year).
function withYear(today, m, d, y) {
  if (y) return ymd(y < 100 ? 2000 + y : y, m, d);
  const ty = +today.slice(0, 4); const k = ymd(ty, m, d); if (!k) return null;
  return dayDiff(k, today) > 60 ? ymd(ty + 1, m, d) : k;
}
function parseScanLine(raw, today) {
  let t = ' ' + raw.replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim() + ' ';
  // bullets, checkboxes, list numbers
  t = ' ' + t.trim().replace(/^(?:[-–—•*·●▪■□☐☑☒✓✔>~=+]+|\[\s?[xX✓ ]?\s?\]|\(\s?\)|\d{1,2}[.)](?!\d))\s*/, '') + ' ';
  let date = null, time = '', rep = 'none', days = [];
  const cut = function (re, fn) { const m = t.match(re); if (!m) return false; const r = fn(m); if (r === false) return false; t = t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length); return true; };
  // repeats
  cut(/\b(?:every\s?day|daily)\b/i, function () { rep = 'daily'; });
  if (rep === 'none') cut(/\b(?:every\s+)?weekdays\b/i, function () { rep = 'weekdays'; });
  if (rep === 'none') cut(new RegExp('\\b(?:every|each)\\s+(' + WD_RE + ')s?\\b', 'i'), function (m) { const w = m[1].toLowerCase(); rep = 'weekly'; days = [WDAYS.findIndex(function (a) { return a.indexOf(w) >= 0; })]; });
  // times
  cut(/\b(noon|midday)\b/i, function () { time = '12:00'; });
  if (!time) cut(/\bmidnight\b/i, function () { time = '00:00'; });
  if (!time) cut(/(?:@|\bat\s+)?\b(\d{1,2})(?::|\.)?(\d{2})?\s*(a\.?m\.?|p\.?m\.?|a|p)(?![a-z])/i, function (m) {
    let h = +m[1]; const mi = m[2] ? +m[2] : 0; if (h < 1 || h > 12 || mi > 59) return false;
    const pm = /p/i.test(m[3]); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0;
    time = String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
  });
  if (!time) cut(/(?:@|\bat\s+)?\b(\d{1,2}):(\d{2})\b/, function (m) {
    let h = +m[1]; const mi = +m[2]; if (h > 23 || mi > 59) return false;
    if (h >= 1 && h <= 6) h += 12; // "3:30 meeting" is almost always afternoon
    time = String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
  });
  // dates
  if (rep === 'none') {
    cut(/\b(today|tonight)\b/i, function () { date = today; });
    if (!date) cut(/\b(tomorrow|tmrw|tmr)\b/i, function () { date = addDays(today, 1); });
    if (!date) cut(new RegExp('\\b(' + MON_RE + ')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b', 'i'), function (m) { const k = withYear(today, MON3.indexOf(m[1].slice(0, 3).toLowerCase()), +m[2], m[3] ? +m[3] : 0); if (!k) return false; date = k; });
    if (!date) cut(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(' + MON_RE + ')\\b\\.?', 'i'), function (m) { const k = withYear(today, MON3.indexOf(m[2].slice(0, 3).toLowerCase()), +m[1], 0); if (!k) return false; date = k; });
    if (!date) cut(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/, function (m) { const k = withYear(today, +m[1] - 1, +m[2], m[3] ? +m[3] : 0); if (!k) return false; date = k; });
    if (!date) cut(new RegExp('\\b(?:next\\s+|this\\s+|on\\s+)?(' + WD_RE + ')\\.?\\b', 'i'), function (m) {
      const w = m[1].toLowerCase(); const i = WDAYS.findIndex(function (a) { return a.indexOf(w) >= 0; });
      date = addDays(today, (i - dow0(today) + 7) % 7);
    });
  }
  // tidy what's left: stray connectors and punctuation at the ends
  let text = t.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++) text = text.replace(/^(?:at|on|by|due|@|[-–—,:;.|])\s*/i, '').replace(/\s*(?:at|on|by|due|@|[-–—,:;|])$/i, '').trim();
  return { text: text, date: date, time: time, rep: rep, days: days };
}
function parseScan(fullText, today) {
  const seen = {}; const out = [];
  String(fullText || '').split(/\r?\n/).forEach(function (line) {
    if ((line.match(/[A-Za-z]/g) || []).length < 2) return;
    const r = parseScanLine(line, today);
    if ((r.text.match(/[A-Za-z]/g) || []).length < 2) return;
    if (/^(?:my\s+)?(?:to[\s-]?do'?s?|things to do|tasks|list|to[\s-]?do list|this week|today)\s*:?$/i.test(r.text)) return; // list headings
    const key = r.text.toLowerCase(); if (seen[key]) return; seen[key] = true;
    r.pillar = guessPillar(r.text); out.push(r);
  });
  return out;
}
// Loads the reader on first use (about 7 MB, then kept on the phone) and reads one photo.
let OCR_LOAD = null;
function ocrBase() { return new URL('vendor/ocr/', location.href).href; }
function loadOcr() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!OCR_LOAD) OCR_LOAD = new Promise(function (res, rej) { const sc = document.createElement('script'); sc.src = ocrBase() + 'tesseract.min.js'; sc.onload = function () { res(window.Tesseract); }; sc.onerror = function () { OCR_LOAD = null; rej(new Error('load')); }; document.head.appendChild(sc); });
  return OCR_LOAD;
}
// Shrink big photos (keeps memory low on the phone) and respect the photo's rotation.
function photoCanvas(file) {
  const draw = function (src, w, h) { const sc = Math.min(1, 2000 / Math.max(w, h)); const c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c; };
  if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (b) { return draw(b, b.width, b.height); });
  return new Promise(function (res, rej) { const im = new Image(); im.onload = function () { res(draw(im, im.naturalWidth, im.naturalHeight)); }; im.onerror = rej; im.src = URL.createObjectURL(file); });
}
function ocrStore(mode, fn) {
  return new Promise(function (res, rej) {
    const rq = indexedDB.open('keyval-store'); rq.onupgradeneeded = function () { rq.result.createObjectStore('keyval'); };
    rq.onerror = function () { rej(rq.error); };
    rq.onsuccess = function () { const db = rq.result; const tx = db.transaction('keyval', mode); const q = fn(tx.objectStore('keyval')); tx.oncomplete = function () { db.close(); res(q && q.result); }; tx.onerror = function () { db.close(); rej(tx.error); }; };
  });
}
function ocrPrimeData() {
  const KEY = './eng.traineddata';
  return ocrStore('readonly', function (st) { return st.get(KEY); }).then(function (have) {
    if (have) return;
    return fetch(ocrBase() + 'eng-traineddata.wasm').then(function (r) { if (!r.ok) throw new Error('data'); return r.arrayBuffer(); })
      .then(function (buf) { return ocrStore('readwrite', function (st) { return st.put(new Uint8Array(buf), KEY); }); });
  });
}
function readPhoto(file, onProgress) {
  let worker = null;
  // The English data ships as eng-traineddata.wasm (gzip inside) so every host serves it. The reader looks in its
  // own on-phone store (IndexedDB 'keyval-store' / 'keyval', key './eng.traineddata') before downloading, so the app
  // puts the data there first; after that it is read from the phone, even offline.
  let T0 = null;
  return loadOcr().then(function (T) { T0 = T; return ocrPrimeData(); }).then(function () {
    const b = ocrBase();
    return T0.createWorker('eng', 1, { workerPath: b + 'worker.min.js', corePath: b, langPath: b, workerBlobURL: false,
      logger: function (m) { if (onProgress && m && typeof m.progress === 'number') onProgress(m.status, m.progress); } });
  }).then(function (w) { worker = w; return photoCanvas(file); })
    .then(function (c) { return worker.recognize(c); })
    .then(function (r) { const txt = r && r.data ? r.data.text : ''; return worker.terminate().then(function () { return txt; }); })
    .catch(function (e) { if (worker) worker.terminate(); throw e; });
}

// Swipe check-in scores: up = Good, right = Okay, down = Bad.
const SWIPE_SCORE = { good: 9, okay: 7, bad: 4 };
function swipeDir(dx, dy, min) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return null;
  if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? 'good' : 'bad';
  return dx > 0 ? 'okay' : 'back';
}
function answerLabel(v) { if (v === undefined) return ''; if (v === 'NA') return 'N/A'; return v === 9 ? 'Good' : v === 7 ? 'Okay' : v === 4 ? 'Bad' : f1(v); }
// Focus ("Big Three") is one factor from each pillar.
function focusMissing(list) { return PILLARS.filter(function (p) { return !list.some(function (id) { return pillarOfFactor(id) === p.id; }); }); }
function focusOk(list) { return list.length === 3 && focusMissing(list).length === 0; }
function factorName(id) { const f = FACTORS.filter(function (x) { return x.id === id; })[0]; return f ? f.name : ''; }
function gcol(p) { if (p == null) return '#636366'; return 'rgb(' + rgbOf(p).join(',') + ')'; }
function badge(p) { return { pct: p == null ? '–' : Math.round(p) + '%', letter: p == null ? '–' : letter(p), bg: gcol(p), missed: p == null ? '–' : (100 - Math.round(p)) + '%' }; }
function delta(d, dec) {
  if (d == null || isNaN(d)) return { txt: '', col: NEU };
  const r = dec ? Math.round(d * 10) / 10 : Math.round(d);
  const s = dec ? Math.abs(r).toFixed(1) : String(Math.abs(r));
  if (r > 0) return { txt: '▲ ' + s, col: UP };
  if (r < 0) return { txt: '▼ ' + s, col: DOWN };
  return { txt: dec ? '0.0' : '0', col: NEU };
}
function p1(v) { return (Math.round(v * 10) / 10).toFixed(1) + '%'; }
function expDelta(act, exp) {
  if (act == null || exp == null) return { txt: '', col: NEU };
  const d = Math.round((Math.round(act * 10) - Math.round(exp * 10))) / 10;
  if (d > 0) return { txt: '\u25B2 Beat expectations by ' + d.toFixed(1) + ' points', col: UP };
  if (d < 0) return { txt: '\u25BC Fell short by ' + Math.abs(d).toFixed(1) + ' points', col: DOWN };
  return { txt: 'Right on expectations', col: NEU };
}
function rings(sd, big) {
  const R = big ? [62, 45, 28] : [16, 11, 6];
  return PILLARS.map(function (p, i) {
    const v = sd ? sd.pillars[p.id] : null; const r = R[i]; const c = 2 * Math.PI * r;
    const frac = v == null ? 0 : Math.max(0.02, Math.min(1, v / 100));
    return { r: r, col: gcol(v), dash: (c * frac).toFixed(1) + ' ' + (c + 1).toFixed(1) };
  });
}
function makeData() {
  const R = rng(42); const days = {};
  const missed = ['2026-09-14', '2026-09-27', '2026-10-09', '2026-10-17', '2026-10-25'];
  const notes = {
    '2026-10-20': 'Paid off the credit card balance.',
    '2026-10-29': 'Late shift, only 5 hours of sleep. Planned for it.',
    '2026-10-31': 'Halloween with the family. Too much candy, skipped the gym.',
    '2026-11-01': 'Good long run this morning. Meal-prepped for the week.'
  };
  for (let i = 0; i < 60; i++) {
    const key = addDays(START, i);
    if (missed.indexOf(key) >= 0) continue;
    const trend = i / 60 * 1.2; const dm = (R() - 0.5) * 2;
    const e = { date: key, score: {}, imp: {}, exp: {}, note: notes[key] || '', edited: key === '2026-10-20' ? 'Oct 22' : '' };
    FACTORS.forEach(function (f) {
      let imp = DEF_IMP[f.id];
      if (R() < 0.1) imp = imp === 'M' ? (R() < 0.5 ? 'H' : 'L') : 'M';
      const v = BASE[f.id] + trend + dm * 0.8 + (R() - 0.5) * 3.4;
      const x = v + 0.6 + (R() - 0.5) * 2;
      if (f.id === 'saving' && R() < 0.35) { e.score[f.id] = null; e.exp[f.id] = null; }
      else { e.score[f.id] = r1(v); e.exp[f.id] = r1(x); }
      e.imp[f.id] = imp;
    });
    days[key] = e;
  }
  const o29 = days['2026-10-29']; o29.score.sleep = 3.5; o29.imp.sleep = 'L'; o29.exp.sleep = 4.0;
  function setDay(k, sc, ex, imp) { const e = days[k]; FACTORS.forEach(function (f, i) { e.score[f.id] = sc[i]; e.exp[f.id] = ex[i]; e.imp[f.id] = imp[f.id] || DEF_IMP[f.id]; }); }
  setDay('2026-10-31',
    [6.0, 4.0, 3.5, 5.0, 6.0, 8.5, 7.0, 9.0, 6.5, 7.0, 5.0, null, 6.0, 8.5, 5.0],
    [6.5, 5.0, 5.0, 6.0, 6.5, 8.0, 7.0, 8.5, 6.0, 7.0, 6.0, null, 6.0, 8.5, 5.5],
    { exercise: 'L', nutrition: 'L' });
  setDay('2026-11-01',
    [7.5, 9.0, 8.0, 6.5, 8.0, 8.0, 6.0, 7.5, 8.5, 5.5, 6.5, 8.0, 7.0, 9.0, 7.5],
    [7.0, 8.5, 7.5, 7.0, 7.5, 7.5, 6.5, 7.0, 7.5, 6.0, 7.5, 7.0, 6.5, 9.0, 7.0],
    {});
  return days;
}
function makePlans() {
  const ex = [4.5, 7.5, 7.0, 7.0, 6.5, 7.5, 6.0, 7.0, 7.5, 5.0, 7.5, 8.0, 8.0, 9.0, 7.0];
  const p = { imp: Object.assign({}, DEF_IMP, { sleep: 'L' }), exp: {} };
  FACTORS.forEach(function (f, i) { p.exp[f.id] = ex[i]; });
  const out = {}; out[TODAY] = p; return out;
}
function buildChart(keys, valf, W, H, withTrend, r) {
  const n = keys.length;
  const xs = function (i) { return n <= 1 ? W / 2 : 8 + i * (W - 16) / (n - 1); };
  let lo = 30; keys.forEach(function (k) { const v = valf(k); if (v != null && v < lo) lo = Math.max(0, Math.floor(v / 10) * 10); });
  const ys = function (v) { const c = Math.max(lo, Math.min(100, v)); return 6 + (100 - c) / (100 - lo) * (H - 12); };
  let path = ''; let pen = false; const dots = []; const pts = [];
  keys.forEach(function (k, i) {
    const v = valf(k);
    if (v == null) { pen = false; return; }
    const x = xs(i), y = ys(v);
    path += (pen ? ' L' : ' M') + x.toFixed(1) + ' ' + y.toFixed(1); pen = true;
    dots.push({ cx: x.toFixed(1), cy: y.toFixed(1), fill: gcol(v) });
    pts.push([i, v]);
  });
  const out = { path: path.trim() || 'M0 0', dots: dots, r: r, y70: ys(70).toFixed(1), t: { x1: 0, y1: 0, x2: 0, y2: 0, op: 0 } };
  if (withTrend && pts.length > 2) {
    let sx = 0, sy = 0, sxx = 0, sxy = 0; const m = pts.length;
    pts.forEach(function (q) { sx += q[0]; sy += q[1]; sxx += q[0] * q[0]; sxy += q[0] * q[1]; });
    const b = (m * sxy - sx * sy) / (m * sxx - sx * sx); const a = (sy - b * sx) / m;
    out.t = { x1: xs(0).toFixed(1), y1: ys(a).toFixed(1), x2: xs(n - 1).toFixed(1), y2: ys(a + b * (n - 1)).toFixed(1), op: 1 };
  }
  return out;
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.busy = false;
    let S = SAVED || {};
    // Preview builds (window.BD_DEMO) start with sample data so every screen has something to show.
    if (!SAVED && typeof window !== 'undefined' && window.BD_DEMO) {
      START = '2026-09-04';
      S = { days: makeData(), plans: makePlans(), tasks: makeTasks(), work: makeWork(), series: makeSeries(), seriesNextId: 100, nextId: 100, workNextId: 100, setupDone: true };
    }
    const tParts = TODAY.split('-');
    this.state = { tab: 'summary', filter: 'all', open: {}, days: S.days || {}, plans: S.plans || {}, inp: null, month: { y: +tParts[0], m: +tParts[1] - 1 }, sel: null,
      tasks: carryOver((S.tasks || []).map(migrateTask), TODAY), work: carryOver((S.work || []).map(function (w) { return w.date ? w : Object.assign({}, w, { date: TODAY, carried: '' }); }), TODAY),
      workNextId: S.workNextId || 1, workText: '', wDate: TODAY, pMode: 'personal', pick: null, scan: null, journal: S.journal || {}, jDate: TODAY, series: S.series || [], seriesNextId: S.seriesNextId || 1, delAsk: null, nextId: S.nextId || 1, pView: 'day', pDate: TODAY, pWeek: weekKey(TODAY),
      draftC: { text: '', pillar: '' },
      online: (typeof navigator === 'undefined' || navigator.onLine !== false), simOff: false,
      tipPos: S.tipPos || tipPosFromSeen(S.seen), set: this.freshDraft(), msg: '', setup: S.setupDone ? null : { step: 0 }, setupDone: !!S.setupDone, delStep: 0, csv: '',
      hist: S.hist || [],
      add: { open: false, text: '', day: TODAY, week: weekKey(TODAY), pillar: '' } };
  }
  persist() {
    const s = this.state; const names = {}; FACTORS.forEach(function (f) { names[f.id] = f.name; });
    const data = { v: 1, start: START, days: s.days, plans: s.plans, tasks: s.tasks, nextId: s.nextId, work: s.work, workNextId: s.workNextId, series: s.series, seriesNextId: s.seriesNextId, journal: s.journal, hist: s.hist, tipPos: s.tipPos,
      setupDone: s.setupDone, whist: WHIST, fhist: FHIST, names: names, defImp: DEF_IMP, focus0: FOCUS };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
  }
  componentDidMount() {
    const tick = () => { const t = localToday(); if (t !== TODAY) { TODAY = t; this.setState({ tasks: carryOver(this.state.tasks, t), work: carryOver(this.state.work, t) }); } };
    try { document.addEventListener('visibilitychange', tick); setInterval(tick, 60000); } catch (e) {}
    this._on = () => this.setState({ online: true });
    this._off = () => this.setState({ online: false });
    try { window.addEventListener('online', this._on); window.addEventListener('offline', this._off); } catch (e) {}
  }
  componentWillUnmount() {
    try { window.removeEventListener('online', this._on); window.removeEventListener('offline', this._off); } catch (e) {}
  }

  freshDraft() {
    const names = {}, imp = {}; FACTORS.forEach(function (f) { names[f.id] = f.name; imp[f.id] = DEF_IMP[f.id]; });
    return { w: Object.assign({}, wFor(TODAY)), focus: focusFor(TODAY).slice(), names: names, imp: imp };
  }
  setDraft(p) { this.setState({ set: Object.assign({}, this.state.set, p), msg: '' }); }
  draftValid() { const d = this.state.set; return d.w.physical + d.w.emotional + d.w.financial === 100 && focusOk(d.focus); }
  commitSettings(origin) {
    const s = this.state, d = s.set; const out = [];
    if (!this.draftValid()) { this.setState({ msg: !focusOk(d.focus) ? 'Pick one Focus factor from each pillar.' : 'Pillar weights must add up to 100%.' }); return false; }
    const cw = wFor(TODAY);
    if (cw.physical !== d.w.physical || cw.emotional !== d.w.emotional || cw.financial !== d.w.financial) {
      WHIST = WHIST.filter(function (h) { return h.from !== TODAY; }).concat([{ from: TODAY, w: Object.assign({}, d.w) }]);
      out.push('Pillar weights ' + cw.physical + '/' + cw.emotional + '/' + cw.financial + ' → ' + d.w.physical + '/' + d.w.emotional + '/' + d.w.financial + ' (past days keep old weights)');
    }
    const cf = focusFor(TODAY); const wk = weekKey(TODAY);
    if (cf.slice().sort().join() !== d.focus.slice().sort().join()) {
      FHIST = FHIST.filter(function (h) { return h.from !== wk; }).concat([{ from: wk, list: d.focus.slice() }]);
      out.push('Focus for week of ' + fmtShort(wk) + ': ' + d.focus.map(factorName).join(', '));
    }
    // Importance applies from today on: today's saved check-in (if any) picks up the change; earlier days keep theirs.
    let days = s.days; const td = s.days[TODAY] ? Object.assign({}, s.days[TODAY], { imp: Object.assign({}, s.days[TODAY].imp) }) : null;
    FACTORS.forEach(function (f) {
      const nn = (d.names[f.id] || '').trim();
      if (nn && nn !== f.name) { out.push('Renamed ' + f.name + ' → ' + nn); f.name = nn; }
      if (d.imp[f.id] !== DEF_IMP[f.id]) { out.push(f.name + ' importance ' + INAME[DEF_IMP[f.id]] + ' → ' + INAME[d.imp[f.id]] + ' (from today on)'); DEF_IMP[f.id] = d.imp[f.id]; if (td) td.imp[f.id] = d.imp[f.id]; }
    });
    if (td) { days = Object.assign({}, s.days); days[TODAY] = td; }
    if (origin === 'setup') out.push('Setup completed');
    const hist = out.map(function (t) { return { date: fmtShort(TODAY), txt: t }; }).reverse().concat(s.hist);
    this.setState({ days: days, hist: hist, msg: origin === 'setup' ? '' : (out.length ? 'Saved ' + out.length + (out.length === 1 ? ' change.' : ' changes.') : 'No changes to save.'), setup: null, set: this.freshDraft() });
    return true;
  }
  buildCsv() {
    const s = this.state; const head = ['date', 'overall_pct', 'physical_pct', 'emotional_pct', 'financial_pct'];
    FACTORS.forEach(function (f) { head.push(f.id + '_score', f.id + '_importance', f.id + '_expected'); });
    head.push('note', 'edited_on', 'journal');
    const q = function (v) { const t = v == null ? '' : String(v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const r1d = function (v) { return v == null ? '' : (Math.round(v * 10) / 10).toFixed(1); };
    const rows = Object.keys(s.days).sort().map(function (k) {
      const e = s.days[k]; const sd = scoreDay(e, 'score');
      const row = [k, r1d(sd.overall), r1d(sd.pillars.physical), r1d(sd.pillars.emotional), r1d(sd.pillars.financial)];
      FACTORS.forEach(function (f) { row.push(e.score[f.id] == null ? 'N/A' : e.score[f.id], e.imp[f.id], e.exp[f.id] == null ? '' : e.exp[f.id]); });
      row.push(e.note || '', e.edited || '', s.journal[k] || '');
      return row.map(q).join(',');
    });
    return [head.join(',')].concat(rows).join('\n');
  }
  // Tips never run out: walk through the factor's library, then start a new shuffled round.
  tipFor(fid) { const lib = TIPLIB[fid] || []; if (!lib.length) return null; const p = this.state.tipPos[fid] || { r: 0, i: 0 }; return lib[tipOrder(fid, p.r)[p.i]]; }
  newTip(fid) {
    const n = (TIPLIB[fid] || []).length; if (!n) return;
    const p = this.state.tipPos[fid] || { r: 0, i: 0 }; const np = p.i + 1 < n ? { r: p.r, i: p.i + 1 } : { r: p.r + 1, i: 0 };
    const pos = Object.assign({}, this.state.tipPos); pos[fid] = np; this.setState({ tipPos: pos });
  }
  patchAdd(p) { this.setState({ add: Object.assign({}, this.state.add, p) }); }
  openAdd(kind) {
    const s = this.state; kind = kind || 'personal';
    let day, wk;
    if (kind === 'work') { day = s.wDate; wk = weekKey(s.wDate); }
    else { day = s.pView === 'day' ? s.pDate : 'week'; wk = s.pView === 'day' ? weekKey(s.pDate) : s.pWeek; }
    this.setState({ add: { open: true, kind: kind, text: '', day: day, week: wk, pillar: '', time: '', rep: 'none', wdays: day === 'week' ? [] : [day] } });
  }
  addReady(a) { return !!a.text.trim() && (a.kind === 'work' || !!a.pillar) && (a.rep !== 'weekly' || a.wdays.length > 0); }
  submitAdd() {
    const a = this.state.add; if (!this.addReady(a)) return;
    if (a.rep !== 'none') {
      const start = a.rep === 'weekly' ? a.wdays.slice().sort()[0] : (a.day === 'week' ? a.week : a.day);
      this.addSeries(a.kind, a.text, a.pillar, { type: a.rep, days: a.rep === 'weekly' ? a.wdays.map(dow0) : [] }, start, a.time);
    } else if (a.kind === 'work') this.addWorkItem(a.text, a.day === 'week' ? a.week : a.day, a.time);
    else { const isWeek = a.day === 'week'; this.addTask(a.text, isWeek ? null : a.day, isWeek ? a.week : null, a.pillar, isWeek ? '' : a.time); }
    this.setState({ add: Object.assign({}, this.state.add, { open: false, text: '' }) });
  }
  addSeries(kind, text, pillar, rule, start, time) {
    if (!text || !text.trim() || (kind === 'personal' && !pillar)) return false;
    const sr = { id: this.state.seriesNextId, kind: kind, text: text.trim(), time: time || '', pillar: kind === 'personal' ? pillar : '', rule: rule, start: start, end: null, marks: {} };
    this.setState({ series: this.state.series.concat([sr]), seriesNextId: this.state.seriesNextId + 1 });
    return true;
  }
  // A day's copy of a repeating to-do looks like a normal one, with id 's<series>@<date>'.
  occurrences(kind, k) {
    return this.state.series.filter(function (sr) { return sr.kind === kind && repeatsOn(sr, k); }).map(function (sr) {
      const m = sr.marks[k] || null;
      return { id: 's' + sr.id + '@' + k, sid: sr.id, date: k, week: null, text: sr.text, time: sr.time || '', pillar: sr.pillar, done: m === 'done', mark: m, carried: '', rec: repeatLabel(sr.rule) };
    });
  }
  markSeries(sid, k, fn) {
    this.setState({ series: this.state.series.map(function (sr) { if (sr.id !== sid) return sr; const marks = Object.assign({}, sr.marks); const nm = fn(marks[k] || null); if (nm) marks[k] = nm; else delete marks[k]; return Object.assign({}, sr, { marks: marks }); }) });
  }
  addTask(text, date, week, pillar, time) {
    if (!text || !text.trim() || !pillar) return false;
    const t = { id: this.state.nextId, text: text.trim(), date: date, week: week, pillar: pillar, time: time || '', done: false, mark: null, carried: '' };
    this.setState({ tasks: this.state.tasks.concat([t]), nextId: this.state.nextId + 1 });
    return true;
  }
  toggleTask(t) {
    if (t.sid) { this.markSeries(t.sid, t.date, function (m) { return m === 'done' ? null : 'done'; }); return; }
    this.setState({ tasks: this.state.tasks.map(function (x) { return x.id === t.id ? Object.assign({}, x, { done: !x.done, mark: x.done ? null : 'done' }) : x; }) });
  }
  setMark(t, m) {
    if (t.sid) { this.markSeries(t.sid, t.date, function (cur) { return cur === m ? null : m; }); return; }
    this.setState({ tasks: this.state.tasks.map(function (x) { if (x.id !== t.id) return x; const nm = x.mark === m ? null : m; return Object.assign({}, x, { mark: nm, done: nm === 'done' }); }) });
  }
  delTask(t) {
    if (t.sid) { this.setState({ delAsk: { sid: t.sid, date: t.date, text: t.text } }); return; }
    this.setState({ tasks: this.state.tasks.filter(function (x) { return x.id !== t.id; }) });
  }
  // Removing a repeating to-do: skip just this day, or stop it from this day on (earlier days keep their ticks).
  skipOne() { const d = this.state.delAsk; this.markSeries(d.sid, d.date, function () { return 'skip'; }); this.setState({ delAsk: null }); }
  stopSeries() {
    const d = this.state.delAsk;
    this.setState({ delAsk: null, series: this.state.series.map(function (sr) { return sr.id === d.sid ? Object.assign({}, sr, { end: addDays(d.date, -1) }) : sr; }).filter(function (sr) { return !sr.end || sr.end >= sr.start; }) });
  }
  // Work to-dos: day by day, separate from personal to-dos and never part of the check-in.
  addWorkItem(text, date, time) {
    if (!text || !text.trim()) return false;
    this.setState({ work: this.state.work.concat([{ id: this.state.workNextId, text: text.trim(), date: date, time: time || '', done: false, carried: '' }]), workNextId: this.state.workNextId + 1 });
    return true;
  }
  addWork() { if (this.addWorkItem(this.state.workText, this.state.wDate)) this.setState({ workText: '' }); }
  toggleWork(w) {
    if (w.sid) { this.markSeries(w.sid, w.date, function (m) { return m === 'done' ? null : 'done'; }); return; }
    this.setState({ work: this.state.work.map(function (x) { return x.id === w.id ? Object.assign({}, x, { done: !x.done }) : x; }) });
  }
  delWork(w) {
    if (w.sid) { this.setState({ delAsk: { sid: w.sid, date: w.date, text: w.text } }); return; }
    this.setState({ work: this.state.work.filter(function (x) { return x.id !== w.id; }) });
  }
  workForDay(k) { return byTime(this.state.work.filter(function (w) { return w.date === k; }).concat(this.occurrences('work', k))); }
  taskRow(t, showWhen) {
    const bits = [];
    if (t.time) bits.push(fmtTime(t.time));
    if (t.rec) bits.push('↻ ' + t.rec);
    if (t.carried) bits.push('Carried over from ' + t.carried);
    if (showWhen && t.week) bits.push('This week');
    return {
      hasTag: !!t.pillar, tag: pillarName(t.pillar), tagCol: PCOL[t.pillar] || '#8E8E93',
      text: t.text, done: t.done, notDone: !t.done, doneStr: t.done ? 'true' : 'false',
      aria: (t.done ? 'Mark not done: ' : 'Mark done: ') + t.text,
      textStyle: t.done ? 'color: #8E8E93; text-decoration: line-through' : 'color: #FFFFFF',
      hasSub: bits.length > 0, sub: bits.join(' · '),
      toggle: () => this.toggleTask(t), del: () => this.delTask(t),
      yes: () => this.setMark(t, 'done'), no: () => this.setMark(t, 'not'),
      yesP: t.mark === 'done' ? 'true' : 'false', noP: t.mark === 'not' ? 'true' : 'false',
      yesAria: 'Done: ' + t.text, noAria: 'Not done: ' + t.text,
      yesStyle: t.mark === 'done' ? 'background: #1FA34A; color: #FFFFFF' : 'background: #2C2C2E; color: #8E8E93',
      noStyle: t.mark === 'not' ? 'background: #C4161C; color: #FFFFFF' : 'background: #2C2C2E; color: #8E8E93'
    };
  }
  // Three big Physical / Emotional / Financial buttons used when adding a personal to-do.
  pillarPicks(cur, pick) {
    return PILLARS.map(function (p) { const on = cur === p.id; return { name: p.name, selStr: on ? 'true' : 'false', style: on ? 'background: ' + PCOL[p.id] + '; color: #000000' : 'background: #2C2C2E; color: ' + PCOL[p.id], pick: function () { pick(p.id); } }; });
  }
  addFromCheckin() {
    const s = this.state; const d = s.draftC; const tom = addDays(s.inp.date, 1);
    const ok = this.addTask(d.text, tom, null, d.pillar);
    if (ok) this.setState({ draftC: Object.assign({}, d, { text: '' }) });
  }
  tasksForDay(k, includeWeek) {
    const wk = weekKey(k);
    return byTime(this.state.tasks.filter(function (t) { return t.date === k || (includeWeek && t.week === wk); }).concat(this.occurrences('personal', k)));
  }

  // Importance is set in Settings. A saved day keeps the importance it was saved with; anything new uses Settings.
  impPrefill(date, f) { const d = this.state.days[date]; return d ? d.imp[f] : DEF_IMP[f]; }
  startInput(date) {
    const e = this.state.days[date];
    const a = { score: {}, expTom: {} };
    if (e) FACTORS.forEach(function (f) { a.score[f.id] = e.score[f.id] == null ? 'NA' : e.score[f.id]; });
    this.setState({ tab: 'input', sel: null, inp: { date: date, fi: 0, act: 0, a: a, phase: 'review', note: e ? e.note : '' } });
  }
  patchInp(p) { this.setState({ inp: Object.assign({}, this.state.inp, p) }); }
  setAnswer(key, f, v) {
    const inp = this.state.inp; const a = Object.assign({}, inp.a); a[key] = Object.assign({}, a[key]); a[key][f] = v; return a;
  }
  // Swipe check-in: each factor card takes two answers, today (act 0) then expected tomorrow (act 1).
  answer(v) {
    const inp = this.state.inp; if (!inp || inp.phase !== 'q') return;
    const f = FACTORS[inp.fi].id; const a = this.setAnswer(inp.act === 0 ? 'score' : 'expTom', f, v);
    if (inp.act === 0) { this.setState({ inp: Object.assign({}, inp, { a: a, act: 1 }) }); return; }
    if (inp.fi >= 14) { this.setState({ inp: Object.assign({}, inp, { a: a, act: 0, phase: 'plan' }) }); return; }
    this.setState({ inp: Object.assign({}, inp, { a: a, fi: inp.fi + 1, act: 0 }) });
  }
  back() {
    const inp = this.state.inp;
    if (inp.phase === 'note') { this.patchInp({ phase: 'plan' }); return; }
    if (inp.phase === 'plan') { this.patchInp({ phase: 'q', fi: 14, act: 1 }); return; }
    if (inp.act === 1) { this.patchInp({ act: 0 }); return; }
    if (inp.fi > 0) this.patchInp({ fi: inp.fi - 1, act: 1 });
    else this.patchInp({ phase: 'review' });
  }
  // Card drag: move the card directly while the finger is down (no re-render), decide on release.
  // Up = Good, right = Okay, down = Bad, left = back. Short drags snap back.
  swipeStart(ev) {
    if (this.busy) return; const el = ev.currentTarget;
    this.drag = { x: ev.clientX, y: ev.clientY, el: el, id: ev.pointerId };
    try { el.setPointerCapture(ev.pointerId); } catch (e) {}
    el.style.transition = 'none';
  }
  swipeMove(ev) {
    const d = this.drag; if (!d || ev.pointerId !== d.id) return;
    const dx = ev.clientX - d.x, dy = ev.clientY - d.y; d.dx = dx; d.dy = dy;
    d.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 22) + 'deg)';
    const dir = swipeDir(dx, dy, 24);
    d.el.style.boxShadow = dir === 'good' ? '0 0 0 3px #1FA34A' : dir === 'okay' ? '0 0 0 3px #FFD60A' : dir === 'bad' ? '0 0 0 3px #E0201B' : dir === 'back' ? '0 0 0 3px #636366' : '';
  }
  swipeEnd(ev) {
    const d = this.drag; if (!d || (ev && ev.pointerId !== d.id)) return; this.drag = null;
    const dir = swipeDir(d.dx || 0, d.dy || 0, 70);
    d.el.style.transition = 'transform 0.18s ease-out'; d.el.style.boxShadow = '';
    if (!dir) { d.el.style.transform = ''; return; }
    const off = { good: 'translate(0,-140%)', okay: 'translate(140%,0) rotate(12deg)', bad: 'translate(0,140%)', back: 'translate(-140%,0) rotate(-12deg)' }[dir];
    d.el.style.transform = off; this.busy = true;
    setTimeout(() => { this.busy = false; d.el.style.transition = 'none'; d.el.style.transform = ''; this.choose(dir); }, 170);
  }
  choose(dir) { if (dir === 'back') this.back(); else this.answer(SWIPE_SCORE[dir]); }
  save() {
    const s = this.state; const inp = s.inp; const date = inp.date; const old = s.days[date]; const plan = s.plans[date];
    const e = { date: date, score: {}, imp: {}, exp: {}, scale: 9, note: inp.note || '', edited: old ? fmtShort(TODAY) : '' };
    FACTORS.forEach((f) => {
      const v = inp.a.score[f.id]; e.score[f.id] = (v === 'NA' || v == null) ? null : v;
      e.imp[f.id] = this.impPrefill(date, f.id);
      e.exp[f.id] = plan ? plan.exp[f.id] : (old ? old.exp[f.id] : null);
      if (e.score[f.id] == null) e.exp[f.id] = null;
    });
    const tom = addDays(date, 1); const np = { imp: {}, exp: {} };
    FACTORS.forEach((f) => { np.imp[f.id] = DEF_IMP[f.id]; const x = inp.a.expTom[f.id]; np.exp[f.id] = (x === 'NA' || x == null) ? null : x; });
    const days = Object.assign({}, s.days); days[date] = e;
    const plans = Object.assign({}, s.plans); plans[tom] = np;
    this.setState({ days: days, plans: plans, inp: Object.assign({}, inp, { phase: 'done' }) });
  }
  go(tab) {
    if (tab === 'input' && (!this.state.inp || this.state.inp.phase === 'done')) { this.startInput(TODAY); return; }
    this.setState({ tab: tab, sel: null });
  }
  shiftMonth(n) {
    let y = this.state.month.y, m = this.state.month.m + n;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    const v = y * 12 + m; const sp = START.split('-'), tp = TODAY.split('-'); if (v < (+sp[0]) * 12 + (+sp[1] - 1) || v > (+tp[0]) * 12 + (+tp[1] - 1) + 1) return;
    this.setState({ month: { y: y, m: m } });
  }
  // Scan: photo -> on-phone text reading -> review sheet -> to-dos on the right days.
  onScanFile(ev) {
    const f = ev && ev.target && ev.target.files && ev.target.files[0]; if (!f) return;
    try { ev.target.value = ''; } catch (e) {}
    const kind = this.state.pMode === 'work' ? 'work' : 'personal';
    const def = kind === 'work' ? this.state.wDate : this.state.pDate;
    this.setState({ scan: { step: 'reading', kind: kind, def: def, status: 'Getting ready…', pct: 0, rows: [] } });
    readPhoto(f, (st, p) => { if (!this.state.scan || this.state.scan.step !== 'reading') return; this.patchScan({ status: st === 'recognizing text' ? 'Reading your list…' : 'Getting ready… (first time takes a bit longer)', pct: Math.round(p * 100) }); })
      .then((txt) => { if (this.state.scan) this.showScan(txt); })
      .catch(() => { if (this.state.scan) this.patchScan({ step: 'error', msg: navigator.onLine === false ? 'The first scan needs internet to download the text reader. After that, scanning works offline.' : 'Couldn’t read that photo. Try again with the list flat, well lit and filling the frame.' }); });
  }
  showScan(txt) {
    const sc = this.state.scan; const rows = parseScan(txt, TODAY);
    let n = 0;
    this.setState({ scan: Object.assign({}, sc, { step: rows.length ? 'review' : 'error', msg: rows.length ? '' : 'No list found in that photo. Printed text works best; try a clearer, closer photo.',
      rows: rows.map(function (r) { return { id: ++n, on: true, text: r.text, date: r.date || sc.def, time: r.time, rep: r.rep, days: r.days, pillar: sc.kind === 'work' ? '' : r.pillar }; }) }) });
  }
  patchScan(p) { this.setState({ scan: Object.assign({}, this.state.scan, p) }); }
  patchScanRow(id, p) { this.patchScan({ rows: this.state.scan.rows.map(function (r) { return r.id === id ? Object.assign({}, r, p) : r; }) }); }
  scanRowOk(sc, r) { return !!r.text.trim() && !!r.date && (sc.kind === 'work' || !!r.pillar); }
  addScanned() {
    const sc = this.state.scan; let added = 0;
    sc.rows.forEach((r) => {
      if (!r.on || !this.scanRowOk(sc, r)) return;
      if (r.rep !== 'none') this.addSeries(sc.kind, r.text, r.pillar, { type: r.rep, days: r.rep === 'weekly' ? r.days : [] }, r.date, r.time);
      else if (sc.kind === 'work') this.addWorkItem(r.text, r.date, r.time);
      else this.addTask(r.text, r.date, null, r.pillar, r.time);
      added++;
    });
    if (added) this.setState({ scan: null });
  }
  // Jump the Planner to a date picked from the pop-up calendar (Personal opens that day's Day view).
  pickDate(k) {
    if (this.state.pick && this.state.pick.j) this.setState({ jDate: k, pick: null });
    else if (this.state.pMode === 'work') this.setState({ wDate: k, pick: null });
    else this.setState({ pView: 'day', pDate: k, pick: null });
  }
  toggle(id) { const o = Object.assign({}, this.state.open); o[id] = !o[id]; this.setState({ open: o }); }

  recsFor(e) {
    const sd = scoreDay(e, 'score');
    const items = FACTORS.filter(function (f) { return e.score[f.id] != null && e.score[f.id] < 7.0; })
      .map((f) => { const v = e.score[f.id]; const t = this.tipFor(f.id); return { name: f.name, score: scoreTxt(e, v), hasTip: !!t, tip: t ? t.tip : '', author: t ? t.author : '', work: t ? t.work : '', url: t ? t.url : '#', next: () => this.newTip(f.id), bg: gcol(v / maxPts(e) * 100), gap: (maxPts(e) - v) * wt(e, f.id) }; })
      .sort(function (a, b) { return b.gap - a.gap; });
    const pillars = PILLARS.filter(function (p) { return sd.pillars[p.id] != null && Math.round(sd.pillars[p.id]) < 70; })
      .map(function (p) { const v = sd.pillars[p.id]; return p.name + ' is at ' + Math.round(v) + '% (' + letter(v) + ')'; });
    const ov = sd.overall != null && Math.round(sd.overall) < 70 ? ['Overall day is at ' + Math.round(sd.overall) + '% (' + letter(sd.overall) + ')'] : [];
    const pl = ov.concat(pillars);
    return { has: items.length > 0 || pl.length > 0, items: items, pillars: pl, count: items.length + pl.length };
  }
  safetyFor(e) {
    const sd = scoreDay(e, 'score');
    if (sd.pillars.emotional != null && sd.pillars.emotional < 50) return true;
    return FACTORS.some(function (f) { return f.p === 'emotional' && e.score[f.id] != null && e.score[f.id] < 5.0; });
  }
  pillarsOf(sd) { return PILLARS.map(function (p) { return { name: p.name, b: badge(sd.pillars[p.id]) }; }); }

  renderVals() {
    const s = this.state; const days = s.days;
    const logged = Object.keys(days).sort();
    const sdOf = (k) => days[k] ? scoreDay(days[k], 'score') : null;
    const valf = (k) => { const sd = sdOf(k); if (!sd) return null; return s.filter === 'all' ? sd.overall : sd.pillars[s.filter]; };
    const avgOf = (fn, from, to) => { let t = 0, n = 0; for (let k = from; k <= to; k = addDays(k, 1)) { const v = fn(k); if (v != null) { t += v; n++; } } return { v: n ? t / n : null, n: n }; };

    // latest day
    const hasData = logged.length > 0; const lk = hasData ? logged[logged.length - 1] : addDays(TODAY, -1); const le = days[lk] || blankEntry(lk); const lsd = scoreDay(le, 'score');
    const pk = logged[logged.length - 2]; const psd = pk ? sdOf(pk) : null;
    const lat = {
      label: !hasData ? 'No Check-ins Yet' : lk === TODAY ? 'Today' : lk === addDays(TODAY, -1) ? 'Yesterday' : 'Last Logged Day',
      date: fmtShort(lk), b: badge(lsd.overall), d: delta(psd ? dR(psd.overall, lsd.overall) : null, false),
      pillars: this.pillarsOf(lsd), rings: rings(lsd, true)
    };
    if (!lat.d.txt) lat.d = { txt: '–', col: NEU };

    // vs. expected: the latest check-in compared with what was predicted for it the night before
    const lex = scoreDay(le, 'exp');
    const vdb = { show: hasData && lex.overall != null, title: lat.label + ' vs. Expected', rows: [], lines: [] };
    if (vdb.show) {
      const row = function (name, weight, act, exp) {
        const d = delta(dR(exp, act, true), true);
        return { name: name, weight: weight, b: badge(act), exp: exp == null ? 'no prediction' : 'expected ' + Math.round(exp) + '%', d: d.txt ? d : { txt: '–', col: NEU } };
      };
      vdb.rows = [row('Overall', 800, lsd.overall, lex.overall)].concat(PILLARS.map(function (p) { return row(p.name, 600, lsd.pillars[p.id], lex.pillars[p.id]); }));
      const fm = FACTORS.map(function (f) { const x = le.exp[f.id], a = le.score[f.id]; return { f: f, x: x, a: a, d: x != null && a != null ? dR(x, a, true) : null }; }).filter(function (m) { return m.d != null; });
      fm.sort(function (x, y) { return y.d - x.d; });
      if (fm.length && fm[0].d > 0) vdb.lines.push({ txt: fm[0].f.name + ' beat by ' + fm[0].d.toFixed(1) + ' (expected ' + scoreTxt(le, fm[0].x) + ', got ' + scoreTxt(le, fm[0].a) + ')', col: UP });
      const lo = fm[fm.length - 1]; if (lo && lo.d < 0) vdb.lines.push({ txt: lo.f.name + ' short by ' + Math.abs(lo.d).toFixed(1) + ' (expected ' + scoreTxt(le, lo.x) + ', got ' + scoreTxt(le, lo.a) + ')', col: DOWN });
      if (!vdb.lines.length) vdb.lines.push({ txt: 'Every factor landed right on expectations', col: NEU });
    }

    // previous 7 days strip
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const k = addDays(lk, -i); const sd = sdOf(k); const d = new Date(k + 'T12:00:00Z');
      week.push({ wd: WD1[d.getUTCDay()], rings: rings(sd, false), letter: sd ? letter(sd.overall) : '–', col: sd ? gcol(sd.overall) : '#8E8E93', aria: fmt(k) + (sd ? ', ' + Math.round(sd.overall) + '%' : ', missed'), pick: () => this.setState({ sel: k }) });
    }

    // highlights
    let streak = 0; for (let k = lk; days[k]; k = addDays(k, -1)) streak++;
    const fAvg = (id, from, to) => avgOf((k) => days[k] ? days[k].score[id] : null, from, to).v;
    const moves = FACTORS.map(function (f) { const c = fAvg(f.id, addDays(lk, -6), lk), p = fAvg(f.id, addDays(lk, -13), addDays(lk, -7)); return { f: f, c: c, d: dR(p, c, true) }; }).filter(function (m) { return m.d != null; });
    moves.sort(function (a, b) { return b.d - a.d; });
    let beat = 0, cnt = 0;
    for (let i = 0; i < 7; i++) { const e = days[addDays(lk, -i)]; if (!e) continue; const a = scoreDay(e, 'score').overall, x = scoreDay(e, 'exp').overall; if (a != null && x != null) { cnt++; if (Math.round(a * 10) >= Math.round(x * 10)) beat++; } }
    const highlights = hasData ? [{ txt: streak + '-day check-in streak', col: '#409CFF' }] : [{ txt: 'Highlights appear after your first few check-ins.', col: '#409CFF' }];
    if (moves.length && moves[0].d > 0) highlights.push({ txt: moves[0].f.name + ' is up ' + moves[0].d.toFixed(1) + ' from last week (avg ' + moves[0].c.toFixed(1) + ')', col: UP });
    const worst = moves[moves.length - 1]; if (worst && worst.d < 0) highlights.push({ txt: worst.f.name + ' is down ' + Math.abs(worst.d).toFixed(1) + ' from last week (avg ' + worst.c.toFixed(1) + ')', col: DOWN });
    if (cnt) highlights.push({ txt: 'Met or beat expectations on ' + beat + ' of the last ' + cnt + ' days', col: '#FFD60A' });

    // sections
    const fname = s.filter === 'all' ? 'overall' : PILLARS.filter(function (p) { return p.id === s.filter; })[0].name.toLowerCase();
    const mkPeriod = (id, n, title, trend, r) => {
      const from = addDays(lk, -(n - 1)); const keys = []; for (let i = 0; i < n; i++) keys.push(addDays(from, i));
      const curAll = avgOf((k) => { const sd = sdOf(k); return sd ? sd.overall : null; }, from, lk);
      const prevAll = avgOf((k) => { const sd = sdOf(k); return sd ? sd.overall : null; }, addDays(from, -n), addDays(from, -1));
      const open = !!s.open[id];
      return {
        title: title, sub: curAll.n + ' of ' + n + ' days logged', val: badge(curAll.v).pct + ' ' + badge(curAll.v).letter, valCol: gcol(curAll.v),
        d: delta(dR(prevAll.v, curAll.v), false),
        rot: open ? 90 : 0, openStr: open ? 'true' : 'false', toggle: () => this.toggle(id),
        openChart: open, openBig: false, openAttn: false,
        c: buildChart(keys, valf, 326, 96, trend, r),
        caption: 'Showing ' + fname + '. ' + (trend ? 'Dashed blue line is the trend. ' : 'Gaps are missed days. ') + 'Dotted line marks 70% (C).',
        pill: PILLARS.map(function (p) {
          const c = avgOf((k) => { const sd = sdOf(k); return sd ? sd.pillars[p.id] : null; }, from, lk).v;
          const pv = avgOf((k) => { const sd = sdOf(k); return sd ? sd.pillars[p.id] : null; }, addDays(from, -n), addDays(from, -1)).v;
          return { name: p.name, b: badge(c), d: delta(dR(pv, c), false) };
        })
      };
    };
    const big3 = focusFor(lk).map(function (id) {
      const f = FACTORS.filter(function (x) { return x.id === id; })[0];
      const cur = fAvg(id, addDays(lk, -6), lk); const prev = fAvg(id, addDays(lk, -13), addDays(lk, -7)); const m30 = fAvg(id, addDays(lk, -29), lk);
      return { name: f.name, pillar: PILLARS.filter(function (p) { return p.id === f.p; })[0].name, avg: f1(cur), avg30: f1(m30), b: badge(cur == null ? null : cur * 10), d: delta(dR(prev, cur, true), true) };
    });
    const latRecs = this.recsFor(le); const latSafety = this.safetyFor(le);
    const ob = !!s.open.big, oa = !!s.open.attn;
    const blank = { c: buildChart([], valf, 326, 96, false, 3), caption: '', pill: [] };
    const sections = [
      mkPeriod('w7', 7, '7-Day Score', false, 4.5),
      mkPeriod('w30', 30, '30-Day Score', true, 3),
      Object.assign({}, blank, { title: 'Big Three', sub: big3.map(function (b) { return b.name; }).join(' · '), val: '', valCol: '#FFFFFF', d: { txt: '', col: NEU }, rot: ob ? 90 : 0, openStr: ob ? 'true' : 'false', toggle: () => this.toggle('big'), openChart: false, openBig: ob })
    ];
    const attn = { title: 'Needs Attention', sub: latRecs.count ? 'Below 70% on ' + fmtShort(lk) : 'Nothing below 70%', val: String(latRecs.count), valCol: latRecs.count ? '#FF6961' : UP, rot: oa ? 90 : 0, openStr: oa ? 'true' : 'false', toggle: () => this.toggle('attn'), open: oa };

    const filters = [{ id: 'all', label: 'All' }].concat(PILLARS.map(function (p) { return { id: p.id, label: p.name }; })).map((c) => ({
      label: c.label, pick: () => this.setState({ filter: c.id }),
      style: s.filter === c.id ? 'background: #636366; color: #FFFFFF' : 'background: transparent; color: #C7C7CC'
    }));

    // check-in
    const inp = s.inp; let iv = { isQ: false, isNote: false, isDone: false, isReview: false, isPlan: false, linked: [] };
    let rv = { title: '', btn: '', start: () => {}, head: '', empty: true, groups: [] };
    let pn = { dateLabel: '', head: '', empty: true, tasks: [], draft: {} };
    let res = { date: '', b: badge(null), expLine: '', ed: { txt: '', col: NEU }, pillars: [], rings: [], recs: { has: false, items: [], pillars: [] }, safety: false };
    if (inp) {
      const f = FACTORS[inp.fi];
      iv = {
        isQ: inp.phase === 'q', isNote: inp.phase === 'note', isDone: inp.phase === 'done', isReview: inp.phase === 'review', isPlan: inp.phase === 'plan',
        pt: (() => {
          const ts = this.tasksForDay(inp.date, true).filter(function (t) { return t.pillar === f.p; });
          return { has: ts.length > 0, col: PCOL[f.p], head: pillarName(f.p) + ' to-dos · ' + ts.filter(function (t) { return t.done; }).length + ' of ' + ts.length + ' done',
            names: ts.map(function (t) { return (t.mark === 'done' ? '✓ ' : t.mark === 'not' ? '✗ ' : '') + t.text; }).join('  ·  ') };
        })(),
        dateLabel: inp.date === TODAY ? 'Today' : fmtShort(inp.date), dateShort: inp.date === TODAY ? 'today' : fmtShort(inp.date),
        backLabel: inp.act === 1 ? 'Today' : inp.fi > 0 ? FACTORS[inp.fi - 1].name : 'Check-in',
        pillar: PILLARS.filter(function (p) { return p.id === f.p; })[0].name, fnum: inp.fi + 1,
        prog: Math.round((inp.phase === 'q' ? inp.fi * 2 + inp.act : 30) / 30 * 100),
        name: f.name, focus: focusFor(inp.date).indexOf(f.id) >= 0, lo: f.lo, hi: f.hi,
        isTom: inp.act === 1, isToday: inp.act === 0,
        askLabel: inp.act === 0 ? (inp.date === TODAY ? 'How was it today?' : 'How was it on ' + fmtShort(inp.date) + '?') : 'Expected tomorrow',
        hasToday: inp.act === 1, todayAns: answerLabel(inp.a.score[f.id]), todayCol: (function (v) { return v === undefined || v === 'NA' ? '#98989F' : gcol(v / 9 * 100); })(inp.a.score[f.id]),
        prevAns: answerLabel(inp.act === 0 ? inp.a.score[f.id] : inp.a.expTom[f.id]), hasPrev: (inp.act === 0 ? inp.a.score[f.id] : inp.a.expTom[f.id]) !== undefined,
        impName: INAME[this.impPrefill(inp.date, f.id)],
        swDown: (ev) => this.swipeStart(ev), swMove: (ev) => this.swipeMove(ev), swUp: (ev) => this.swipeEnd(ev),
        good: () => this.choose('good'), okay: () => this.choose('okay'), bad: () => this.choose('bad'), na: () => this.answer('NA'), goBack: () => this.back(),
        naLabel: 'N/A ' + (inp.act === 0 ? 'today' : 'tomorrow'),
        note: inp.note
      };
      const dayT = this.tasksForDay(inp.date, true);
      const grp = PILLARS.map(function (p) { return { id: p.id, name: p.name }; }).concat([{ id: '', name: 'Other' }]).map((g) => {
        const ts = dayT.filter(function (t) { return (t.pillar || '') === g.id; });
        return { name: g.name, col: PCOL[g.id] || '#8E8E93', count: ts.filter(function (t) { return t.done; }).length + ' of ' + ts.length + ' done', tasks: ts.map((t) => this.taskRow(t, true)), n: ts.length };
      }).filter(function (g) { return g.n > 0; });
      const isToday = inp.date === TODAY;
      rv = { title: isToday ? 'Today' : fmt(inp.date), btn: (days[inp.date] ? 'Edit ' : 'Start ') + (isToday ? 'Today’s Check-in' : 'Check-in for ' + fmtShort(inp.date)),
        start: () => this.patchInp({ phase: 'q', fi: 0, act: 0 }),
        head: (isToday ? 'Due Today' : 'Due ' + fmtShort(inp.date)) + ' · ' + dayT.filter(function (t) { return t.done; }).length + ' of ' + dayT.length + ' done', empty: dayT.length === 0, groups: grp };
      const tom = addDays(inp.date, 1); const tomT = this.tasksForDay(tom, false); const dc = s.draftC;
      pn = {
        dateLabel: fmt(tom), head: 'Tomorrow · ' + tomT.length + (tomT.length === 1 ? ' task' : ' tasks'), empty: tomT.length === 0,
        tasks: tomT.map((t) => this.taskRow(t, false)),
        draft: {
          text: dc.text, pillars: this.pillarPicks(dc.pillar, (id) => this.setState({ draftC: Object.assign({}, this.state.draftC, { pillar: id }) })),
          addStyle: dc.text.trim() && dc.pillar ? 'background: #0A84FF; color: #FFFFFF' : 'background: #2C2C2E; color: #8E8E93',
          onText: (ev) => this.setState({ draftC: Object.assign({}, this.state.draftC, { text: ev.target.value }) }),
          onKey: (ev) => { if (ev.key === 'Enter') this.addFromCheckin(); },
          add: () => this.addFromCheckin()
        }
      };
      if (inp.phase === 'done' && days[inp.date]) {
        const e = days[inp.date]; const sd = scoreDay(e, 'score'); const ex = scoreDay(e, 'exp');
        res = {
          date: fmt(inp.date), b: badge(sd.overall), rings: rings(sd, true),
          expLine: ex.overall != null ? 'Expected ' + p1(ex.overall) + ' → actual ' + p1(sd.overall) : 'No expectations were set for this day.',
          ed: expDelta(sd.overall, ex.overall), pillars: this.pillarsOf(sd), recs: this.recsFor(e), safety: this.safetyFor(e)
        };
        res.tipsOffShow = res.recs.items.length > 0 && !s.online;
      }
    }

    // calendar
    const y = s.month.y, m = s.month.m;
    const first = new Date(Date.UTC(y, m, 1)); const off = (first.getUTCDay() + 6) % 7; const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const cells = []; let lc = 0, el = 0;
    for (let i = 0; i < off; i++) cells.push({ blank: true, real: false });
    for (let d = 1; d <= dim; d++) {
      const k = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      // Checked-in days are filled with their grade color; days with no check-in stay blank.
      const isL = !!days[k]; const isM = !isL && k >= START && k < TODAY; const isT = k === TODAY;
      if (isL) lc++; if (isL || isM) el++;
      const ov = isL ? scoreDay(days[k], 'score').overall : null;
      const ring = isT ? '#409CFF' : 'transparent';
      let style = 'background: transparent; color: #48484A; border: 2px solid transparent';
      if (isL && ov != null) { const c = rgbOf(ov); const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; style = 'background: ' + gcol(ov) + '; color: ' + (lum > 0.55 ? '#000000' : '#FFFFFF') + '; border: 2px solid ' + (isT ? '#409CFF' : gcol(ov)); }
      else if (isM || isT || isL) style = 'background: transparent; color: #C7C7CC; border: 2px solid ' + ring;
      const tappable = isL || isM || isT;
      cells.push({ blank: false, real: true, num: d, style: style, aria: fmt(k) + (isL ? (ov != null ? ', ' + Math.round(ov) + '% ' + letter(ov) : ', logged') : isM ? ', no check-in' : isT ? ', today, not logged yet' : ''), pick: tappable ? () => this.setState({ sel: k }) : () => {} });
    }
    const cal = { title: MONTHS[m] + ' ' + y, cells: cells, count: el ? lc + ' of ' + el + ' days logged' : 'No days to log yet' };

    // sheet
    let sheet = { open: false, logged: false, missed: false, date: '', edited: '', b: badge(null), rings: [], expLine: '', ed: { txt: '', col: NEU }, groups: [], note: '', tasks: [], taskCount: '', edit: () => {} };
    if (s.sel) {
      const e = days[s.sel]; const k = s.sel;
      sheet = { open: true, logged: !!e, missed: !e, date: fmt(k), edited: e && e.edited ? 'Edited on ' + e.edited : (e ? 'Logged' : (k === TODAY ? 'Not logged yet' : 'Missed')), b: badge(null), rings: [], expLine: '', ed: { txt: '', col: NEU }, groups: [], note: '', tasks: [], taskCount: '', edit: () => this.startInput(k) };
      if (e) {
        const sd = scoreDay(e, 'score'), ex = scoreDay(e, 'exp');
        sheet.b = badge(sd.overall); sheet.rings = rings(sd, true);
        sheet.expLine = ex.overall != null ? 'Expected ' + p1(ex.overall) + ' \u2192 actual ' + p1(sd.overall) : 'No expectations set';
        sheet.ed = expDelta(sd.overall, ex.overall);
        // Tap a section header to open or close it. Open state resets when another day is opened.
        const so = s.shOpen && s.shOpen.date === k ? s.shOpen.ids : {};
        // The note starts open; everything else starts collapsed.
        const dflt = { note: true };
        const isOpen = (ids, id) => (id in ids ? ids[id] : !!dflt[id]);
        const tg = (id) => { const cur = this.state.shOpen && this.state.shOpen.date === k ? Object.assign({}, this.state.shOpen.ids) : {}; cur[id] = !isOpen(cur, id); this.setState({ shOpen: { date: k, ids: cur } }); };
        const sec = (id) => { const o = isOpen(so, id); return { open: o, openStr: o ? 'true' : 'false', rot: o ? 90 : 0, toggle: () => tg(id) }; };
        sheet.groups = PILLARS.map(function (p) {
          return Object.assign(sec(p.id), { name: p.name, b: badge(sd.pillars[p.id]), rows: FACTORS.filter(function (f) { return f.p === p.id; }).map(function (f) {
            return { name: f.name + (focusFor(k).indexOf(f.id) >= 0 ? ' ★' : ''), imp: INAME[e.imp[f.id]], score: scoreTxt(e, e.score[f.id]), exp: scoreTxt(e, e.exp[f.id]) };
          }) });
        });
        sheet.note = e.note || 'No note'; sheet.noteSec = sec('note'); sheet.taskSec = sec('tasks');
        sheet.hasJournal = !!s.journal[k]; sheet.journal = s.journal[k] || ''; sheet.jSec = sec('journal');
        const st = this.tasksForDay(k, true);
        sheet.tasks = st.map((t) => this.taskRow(t, true));
        sheet.taskCount = st.length ? st.filter(function (t) { return t.done; }).length + ' of ' + st.length + ' done' : 'None planned';
      }
    }

    // planner
    const isDay = s.pView === 'day';
    const segOn = 'background: #636366; color: #FFFFFF', segOff = 'background: transparent; color: #C7C7CC';
    const wk = isDay ? weekKey(s.pDate) : s.pWeek;
    const wkTasks = s.tasks.filter(function (t) { return t.week === wk; });
    const dTasks = this.tasksForDay(s.pDate, false);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const k = addDays(wk, i); const ts = this.tasksForDay(k, false);
      weekDays.push({ label: fmt(k) + (k === TODAY ? ' · Today' : ''), col: k === TODAY ? '#409CFF' : '#FFFFFF', count: ts.length ? ts.filter(function (t) { return t.done; }).length + ' of ' + ts.length + ' done' : 'No tasks', tasks: ts.map((t) => this.taskRow(t, false)), open: () => this.setState({ pView: 'day', pDate: k }) });
    }
    let allWeek = s.tasks.filter(function (t) { return t.week === wk; }); for (let i = 0; i < 7; i++) allWeek = allWeek.concat(this.tasksForDay(addDays(wk, i), false));
    const pdE = days[s.pDate]; const pdSd = pdE ? scoreDay(pdE, 'score') : null;
    const ci = pdE
      ? { title: 'Checked in · ' + Math.round(pdSd.overall) + '% ' + letter(pdSd.overall), sub: 'Tap to see scores, notes and to-dos', action: 'View', col: gcol(pdSd.overall), rings: rings(pdSd, false), go: () => this.setState({ sel: this.state.pDate }) }
      : s.pDate <= TODAY
        ? { title: 'Not checked in yet', sub: 'Review these to-dos and rate the day', action: 'Start', col: '#409CFF', rings: rings(null, false), go: () => this.startInput(this.state.pDate) }
        : { title: 'Check-in opens that night', sub: 'Plan the to-dos now, rate the day later', action: '', col: '#409CFF', rings: rings(null, false), go: () => {} };
    const pl = {
      ci: ci,
      isDay: isDay, isWeek: !isDay, dayStyle: isDay ? segOn : segOff, weekStyle: isDay ? segOff : segOn,
      toDay: () => this.setState({ pView: 'day' }), toWeek: () => this.setState({ pView: 'week', pWeek: weekKey(this.state.pDate) }),
      kicker: isDay ? (s.pDate === TODAY ? 'Today' : s.pDate === addDays(TODAY, 1) ? 'Tomorrow' : s.pDate < TODAY ? 'Past day' : 'Upcoming') : 'Week of ' + fmtShort(wk),
      title: isDay ? fmt(s.pDate) : fmtShort(wk) + ' – ' + fmtShort(addDays(wk, 6)),
      count: isDay ? dTasks.filter(function (t) { return t.done; }).length + ' of ' + dTasks.length + ' done' : allWeek.filter(function (t) { return t.done; }).length + ' of ' + allWeek.length + ' done this week',
      prev: () => isDay ? this.setState({ pDate: addDays(this.state.pDate, -1) }) : this.setState({ pWeek: addDays(this.state.pWeek, -7) }),
      next: () => isDay ? this.setState({ pDate: addDays(this.state.pDate, 1) }) : this.setState({ pWeek: addDays(this.state.pWeek, 7) }),
      dayHead: s.pDate === TODAY ? 'Today' : fmtShort(s.pDate), dayEmpty: dTasks.length === 0,
      dayTasks: dTasks.map((t) => this.taskRow(t, false)), weekTasks: wkTasks.map((t) => this.taskRow(t, false)), weekDays: weekDays
    };

    // settings draft view
    const d = s.set; const segOn2 = 'background: #636366; color: #FFFFFF', segOff2 = 'background: transparent; color: #C7C7CC';
    const wTotal = d.w.physical + d.w.emotional + d.w.financial;
    const stepW = (id, n) => { const w = Object.assign({}, this.state.set.w); w[id] = Math.max(0, Math.min(100, w[id] + n)); this.setDraft({ w: w }); };
    const valid = wTotal === 100 && focusOk(d.focus);
    const fMiss = focusMissing(d.focus);
    const st = {
      save: () => { this.commitSettings('settings'); }, saveCol: valid ? '#409CFF' : '#636366',
      hasMsg: !!s.msg, msg: s.msg, msgCol: /^Saved|^No changes/.test(s.msg) ? '#30D158' : '#FF6961',
      weights: PILLARS.map(function (p, i) { return { name: p.name, val: d.w[p.id], sep: i ? 'border-top: 1px solid #38383A' : '', dec: () => stepW(p.id, -5), inc: () => stepW(p.id, 5), decAria: 'Lower ' + p.name + ' weight', incAria: 'Raise ' + p.name + ' weight' }; }),
      wNote: wTotal === 100 ? 'Total 100%. Changes apply from today on; past days keep their old weights.' : 'Total ' + wTotal + '%. Must add up to 100%.', wCol: wTotal === 100 ? '#98989F' : '#FF6961',
      // Focus: one per pillar. Tapping a factor replaces that pillar's pick.
      focusGroups: PILLARS.map((p) => ({ name: p.name, col: PCOL[p.id], opts: FACTORS.filter(function (f) { return f.p === p.id; }).map((f) => { const on = d.focus.indexOf(f.id) >= 0; return { name: f.name, selStr: on ? 'true' : 'false', style: on ? 'background: #0A84FF; color: #FFFFFF' : 'background: #2C2C2E; color: #C7C7CC', pick: () => { const cur = this.state.set.focus.filter(function (id) { return pillarOfFactor(id) !== p.id; }); cur.push(f.id); this.setDraft({ focus: PILLARS.map(function (q) { return cur.filter(function (id) { return pillarOfFactor(id) === q.id; })[0]; }).filter(Boolean) }); } }; }) })),
      focusNote: fMiss.length ? 'Still need: ' + fMiss.map(function (p) { return p.name; }).join(', ') + '.' : 'One from each pillar. Focus factors count 20% more this week.', focusNoteCol: fMiss.length ? '#FF6961' : '#98989F',
      factors: FACTORS.map((f, i) => ({
        name: d.names[f.id], label: f.name, inputId: 'fname-' + f.id, sep: i ? 'border-top: 1px solid #38383A' : '',
        onName: (ev) => { const n = Object.assign({}, this.state.set.names); n[f.id] = ev.target.value; this.setDraft({ names: n }); },
        opts: ['H', 'M', 'L'].map((k) => ({ label: INAME[k], short: k, sel: d.imp[f.id] === k ? 'true' : 'false', style: d.imp[f.id] === k ? segOn2 : segOff2, pick: () => { const m = Object.assign({}, this.state.set.imp); m[f.id] = k; this.setDraft({ imp: m }); } }))
      })),
      sources: FACTORS.map(function (f, i) { const a = []; (TIPLIB[f.id] || []).forEach(function (t) { if (a.indexOf(t.author) < 0) a.push(t.author); }); return { name: f.name, authors: a.join(', '), sep: i ? 'border-top: 1px solid #38383A' : '' }; }),
      hist: s.hist.map(function (h, i) { return { date: h.date, txt: h.txt, sep: i ? 'border-top: 1px solid #38383A' : '' }; }),
      makeCsv: () => {
        const csv = this.buildCsv(); const name = 'better-days-' + TODAY + '.csv';
        try { const file = new File([csv], name, { type: 'text/csv' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Better Days export' }).catch(function () {}); return; } } catch (e) {}
        this.setState({ csv: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })) });
      }, hasCsv: !!s.csv, csv: s.csv,
      delLabel: s.delStep === 0 ? 'Delete All Data' : 'Tap again to permanently delete everything',
      del: () => {
        if (this.state.delStep === 0) { this.setState({ delStep: 1 }); return; }
        START = TODAY; this.setState({ delStep: 0, days: {}, plans: {}, tasks: [], work: [], series: [], journal: {}, inp: null, tipPos: {}, csv: '', sel: null, hist: [{ date: fmtShort(TODAY), txt: 'All check-ins, plans, to-dos and journal pages deleted' }] });
      }
    };
    // setup flow
    const SU = [
      { title: 'Welcome', body: 'Rate each day across three pillars (Physical, Emotional and Financial), with five factors each. Every night you score today, plan tomorrow and review your to-dos. Setup takes about two minutes.' },
      { title: 'Pillar Weights', body: 'How much should each pillar count toward your overall day? They must add up to 100%. You can change this anytime in Settings.', isWeights: true },
      { title: 'Importance', body: 'How much does each factor matter to you? High counts 3×, Medium 2×, Low 1×. This applies every day; change it anytime in Settings (past days keep theirs).', isImp: true },
      { title: 'This Week’s Focus', body: 'Pick your Big Three: one factor from each pillar. They count 20% more this week, and you’ll be asked to pick again each Sunday night.', isFocus: true },
      { title: 'You\u2019re Set', body: 'Do your first check-in tonight from the Check-in tab. Since there was no night before, today has no expectations yet; they start tomorrow. Everything is saved on this phone.' }
    ];
    const sstep = s.setup ? s.setup.step : 0; const sd0 = SU[sstep];
    const canNext = sstep === 1 ? wTotal === 100 : sstep === 3 ? focusOk(d.focus) : true;
    const su = {
      open: !!s.setup, num: sstep + 1, total: SU.length, prog: Math.round((sstep + 1) / SU.length * 100), title: sd0.title, body: sd0.body,
      isWeights: !!sd0.isWeights, isImp: !!sd0.isImp, isFocus: !!sd0.isFocus,
      backLabel: sstep === 0 ? (s.setupDone ? 'Cancel' : '') : 'Back',
      back: () => { if (sstep === 0) { if (this.state.setupDone) this.setState({ setup: null, set: this.freshDraft() }); } else this.setState({ setup: { step: sstep - 1 } }); },
      nextLabel: sstep === SU.length - 1 ? 'Start Using the App' : sstep === 3 && !focusOk(d.focus) ? 'Pick ' + fMiss.map(function (p) { return p.name; }).join(', ') : sstep === 1 && wTotal !== 100 ? 'Weights must total 100%' : 'Continue',
      nextStyle: canNext ? 'background: #0A84FF; color: #FFFFFF' : 'background: #2C2C2E; color: #8E8E93',
      next: () => { if (!canNext) return; if (sstep === SU.length - 1) { if (this.commitSettings('setup')) this.setState({ tab: 'summary', setupDone: true }); } else this.setState({ setup: { step: sstep + 1 } }); }
    };
    // add-to-do sheet
    const A = s.add; const isW = A.kind === 'work'; const wdays = A.wdays || [];
    const chipOn = 'background: #0A84FF; color: #FFFFFF';
    const pickDay = (k) => {
      const a = this.state.add;
      if (a.rep === 'weekly') { const w = a.wdays.slice(); const i = w.indexOf(k); if (i >= 0) w.splice(i, 1); else w.push(k); this.patchAdd({ wdays: w, day: w.length ? w.slice().sort()[0] : a.day }); }
      else this.patchAdd({ day: k, wdays: [k] });
    };
    const startK = A.rep === 'weekly' ? (wdays.slice().sort()[0] || null) : (A.day === 'week' ? A.week : A.day);
    const repNote = A.rep === 'none' ? '' : A.rep === 'weekly' && !wdays.length ? 'Tap the days it repeats on.'
      : '↻ ' + repeatLabel({ type: A.rep, days: wdays.map(dow0) }) + ', starting ' + fmt(startK) + '. Tap × on one to skip it or stop repeating.';
    const ad = {
      open: A.open, text: A.text, addCol: this.addReady(A) ? '#409CFF' : '#636366',
      title: isW ? 'New Work To-Do' : 'New To-Do', isPersonal: !isW,
      pillars: this.pillarPicks(A.pillar, (id) => this.patchAdd({ pillar: id })),
      reps: [['none', 'Once'], ['daily', 'Daily'], ['weekdays', 'Weekdays'], ['weekly', 'Weekly']].map((r) => ({ label: r[1], selStr: A.rep === r[0] ? 'true' : 'false',
        style: A.rep === r[0] ? 'background: #636366; color: #FFFFFF' : 'background: transparent; color: #C7C7CC',
        pick: () => { const a = this.state.add; const d = a.day === 'week' ? a.week : a.day; this.patchAdd({ rep: r[0], day: d, wdays: [d] }); } })),
      hasRepNote: !!repNote, repNote: repNote,
      time: A.time || '', hasTime: !!A.time, timeOff: A.day === 'week' && A.rep === 'none',
      onTime: (ev) => this.patchAdd({ time: ev.target.value || '' }), clearTime: () => this.patchAdd({ time: '' }),
      wkLabel: 'Week of ' + fmtShort(A.week) + (A.week === weekKey(TODAY) ? ' (this week)' : ''),
      prevWk: () => { const a = this.state.add; this.patchAdd({ week: addDays(a.week, -7), day: a.day === 'week' ? 'week' : addDays(a.day, -7), wdays: a.wdays.map((k) => addDays(k, -7)) }); },
      nextWk: () => { const a = this.state.add; this.patchAdd({ week: addDays(a.week, 7), day: a.day === 'week' ? 'week' : addDays(a.day, 7), wdays: a.wdays.map((k) => addDays(k, 7)) }); },
      chips: [0, 1, 2, 3, 4, 5, 6].map((i) => { const k = addDays(A.week, i); const on = A.rep === 'weekly' ? wdays.indexOf(k) >= 0 : A.day === k; const dt = new Date(k + 'T12:00:00Z'); return { top: WD1[dt.getUTCDay()], sub: String(dt.getUTCDate()), aria: fmt(k), selStr: on ? 'true' : 'false', style: on ? chipOn : (k === TODAY ? 'background: #2C2C2E; color: #409CFF' : 'background: #2C2C2E; color: #FFFFFF'), pick: () => pickDay(k) }; })
        .concat(!isW && A.rep === 'none' ? [{ top: 'Week', sub: 'any', aria: 'Anytime this week', selStr: A.day === 'week' ? 'true' : 'false', style: A.day === 'week' ? chipOn : 'background: #2C2C2E; color: #FFFFFF', pick: () => this.patchAdd({ day: 'week', wdays: [] }) }] : []),
      chipCols: !isW && A.rep === 'none' ? 8 : 7,
      onText: (ev) => this.patchAdd({ text: ev.target.value }),
      onKey: (ev) => { if (ev.key === 'Enter') this.submitAdd(); },
      submit: () => this.submitAdd(), cancel: () => this.patchAdd({ open: false })
    };
    const da = s.delAsk;
    const dsheet = { open: !!da, text: da ? da.text : '', one: da ? 'Skip only ' + fmt(da.date) : '', skip: () => this.skipOne(), stop: () => this.stopSeries(), cancel: () => this.setState({ delAsk: null }) };

    // work
    const wItems = this.workForDay(s.wDate); const wOpen = wItems.filter(function (w) { return !w.done; }), wDone = wItems.filter(function (w) { return w.done; });
    const wk2 = {
      kicker: s.wDate === TODAY ? 'Today' : s.wDate === addDays(TODAY, 1) ? 'Tomorrow' : s.wDate === addDays(TODAY, -1) ? 'Yesterday' : s.wDate < TODAY ? 'Past day' : 'Upcoming',
      title: fmt(s.wDate), count: wItems.length ? wDone.length + ' of ' + wItems.length + ' done' : 'Nothing planned',
      prev: () => this.setState({ wDate: addDays(this.state.wDate, -1) }), next: () => this.setState({ wDate: addDays(this.state.wDate, 1) }),
      isOff: s.wDate !== TODAY, toToday: () => this.setState({ wDate: TODAY }),
      text: s.workText, ph: 'Add for ' + (s.wDate === TODAY ? 'today' : fmtShort(s.wDate)), onText: (ev) => this.setState({ workText: ev.target.value }), onKey: (ev) => { if (ev.key === 'Enter') this.addWork(); }, add: () => this.addWork(),
      addStyle: (s.workText || '').trim() ? 'background: #0A84FF; color: #FFFFFF' : 'background: #2C2C2E; color: #8E8E93',
      openAdd: () => this.openAdd('work'),
      empty: wItems.length === 0,
      items: wOpen.concat(wDone).map((w, i) => Object.assign(this.taskRow(w, false), { toggle: () => this.toggleWork(w), del: () => this.delWork(w), sep: i ? 'border-top: 1px solid #38383A' : '' }))
    };

    // planner: one tab, switch between personal and work
    const isWorkMode = s.pMode === 'work';
    const pm = {
      isPersonal: !isWorkMode, isWork: isWorkMode, kicker: isWorkMode ? wk2.kicker : pl.kicker,
      add: () => this.openAdd(isWorkMode ? 'work' : 'personal'), addAria: isWorkMode ? 'Add work to-do with options' : 'Add to-do',
      personalStr: isWorkMode ? 'false' : 'true', workStr: isWorkMode ? 'true' : 'false',
      personalStyle: isWorkMode ? 'background: transparent; color: #C7C7CC' : 'background: #0A84FF; color: #FFFFFF',
      workStyle: isWorkMode ? 'background: #0A84FF; color: #FFFFFF' : 'background: transparent; color: #C7C7CC',
      toPersonal: () => this.setState({ pMode: 'personal' }), toWork: () => this.setState({ pMode: 'work', wDate: this.state.pView === 'day' ? this.state.pDate : this.state.wDate })
    };
    // journal: one free-writing page per day
    const jt = s.journal[s.jDate] || ''; const words = jt.trim() ? jt.trim().split(/\s+/).length : 0;
    const jn = {
      kicker: s.jDate === TODAY ? 'Today' : s.jDate === addDays(TODAY, -1) ? 'Yesterday' : s.jDate < TODAY ? 'Past day' : 'Upcoming',
      title: fmt(s.jDate), count: words ? words + (words === 1 ? ' word' : ' words') : 'Blank page', text: jt,
      onText: (ev) => { const j = Object.assign({}, this.state.journal); const v = ev.target.value; if (v.trim()) j[this.state.jDate] = v; else delete j[this.state.jDate]; this.setState({ journal: j }); },
      prev: () => this.setState({ jDate: addDays(this.state.jDate, -1) }), next: () => this.setState({ jDate: addDays(this.state.jDate, 1) }),
      isOff: s.jDate !== TODAY, toToday: () => this.setState({ jDate: TODAY })
    };

    // pop-up calendar for jumping the Planner to any date (dots mark days with to-dos)
    const forJ = !!(s.pick && s.pick.j);
    const curDate = forJ ? s.jDate : isWorkMode ? s.wDate : (isDay ? s.pDate : s.pWeek);
    let dpk = { open: false, cells: [] };
    if (s.pick) {
      const py = s.pick.y, pmn = s.pick.m; const f1st = new Date(Date.UTC(py, pmn, 1)); const off0 = (f1st.getUTCDay() + 6) % 7; const dimN = new Date(Date.UTC(py, pmn + 1, 0)).getUTCDate();
      const cells2 = []; for (let i = 0; i < off0; i++) cells2.push({ blank: true, real: false });
      for (let d = 1; d <= dimN; d++) {
        const k = py + '-' + String(pmn + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        const n = forJ ? (s.journal[k] ? 1 : 0) : isWorkMode ? this.workForDay(k).length : this.tasksForDay(k, false).length;
        const sel = forJ || isWorkMode || isDay ? k === curDate : weekKey(k) === s.pWeek; const isT = k === TODAY;
        cells2.push({ blank: false, real: true, num: d, aria: fmt(k) + (n ? (forJ ? ', has an entry' : ', ' + n + (n === 1 ? ' to-do' : ' to-dos')) : ''), selStr: sel ? 'true' : 'false',
          style: sel ? 'background: #0A84FF; color: #FFFFFF; border: 2px solid #0A84FF' : 'background: transparent; color: ' + (isT ? '#409CFF' : '#FFFFFF') + '; border: 2px solid ' + (isT ? '#409CFF' : 'transparent'),
          dot: n ? (sel ? '#FFFFFF' : '#98989F') : 'transparent', pick: () => this.pickDate(k) });
      }
      const shiftM = (n) => { let y = this.state.pick.y, m = this.state.pick.m + n; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } this.setState({ pick: Object.assign({}, this.state.pick, { y: y, m: m }) }); };
      dpk = { open: true, title: MONTHS[pmn] + ' ' + py, cells: cells2, hint: forJ ? 'Dots mark days you wrote in' : isWorkMode ? 'Dots mark days with work to-dos' : 'Dots mark days with to-dos',
        prev: () => shiftM(-1), next: () => shiftM(1), today: () => this.pickDate(TODAY),
        close: (ev) => { if (ev && ev.target !== ev.currentTarget) return; this.setState({ pick: null }); } };
    }

    // scan sheet
    let scv = { open: false, rows: [] };
    if (s.scan) {
      const sc = s.scan; const ok = sc.rows.filter((r) => r.on && this.scanRowOk(sc, r)).length;
      const needP = sc.kind === 'personal' && sc.rows.some(function (r) { return r.on && !r.pillar; });
      scv = { open: true, reading: sc.step === 'reading', review: sc.step === 'review', error: sc.step === 'error', status: sc.status, pct: sc.pct || 0, msg: sc.msg || '',
        title: sc.kind === 'work' ? 'Scanned Work To-Dos' : 'Scanned To-Dos', isPersonal: sc.kind === 'personal',
        note: needP ? 'Tap a pillar for the ones marked “Pick a pillar.”' : 'Untick anything it misread. Tap a field to fix it.',
        addLabel: ok ? 'Add ' + ok + (ok === 1 ? ' to-do' : ' to-dos') : 'Nothing to add', addStyle: ok ? 'background: #0A84FF; color: #FFFFFF' : 'background: #2C2C2E; color: #8E8E93',
        add: () => this.addScanned(), cancel: () => this.setState({ scan: null }),
        rows: sc.rows.map((r, i) => ({
          on: r.on, notOn: !r.on, onStr: r.on ? 'true' : 'false', toggle: () => this.patchScanRow(r.id, { on: !r.on }), rowStyle: r.on ? '' : 'opacity: 0.45;', sep: i ? 'border-top: 1px solid #38383A;' : '',
          text: r.text, textId: 'scantext-' + r.id, dateId: 'scandate-' + r.id, timeId: 'scantime-' + r.id, date: r.date || '', time: r.time || '',
          onText: (ev) => this.patchScanRow(r.id, { text: ev.target.value }), onDate: (ev) => this.patchScanRow(r.id, { date: ev.target.value || r.date }), onTime: (ev) => this.patchScanRow(r.id, { time: ev.target.value || '' }),
          hasRep: r.rep !== 'none', rep: '↻ ' + repeatLabel({ type: r.rep, days: r.days }),
          needPillar: sc.kind === 'personal' && !r.pillar, aria: (r.on ? 'Skip: ' : 'Include: ') + r.text,
          pillars: sc.kind === 'personal' ? PILLARS.map((p) => { const onP = r.pillar === p.id; return { name: p.name, selStr: onP ? 'true' : 'false', style: onP ? 'background: ' + PCOL[p.id] + '; color: #000000' : 'background: #2C2C2E; color: ' + PCOL[p.id], pick: () => this.patchScanRow(r.id, { pillar: p.id }) }; }) : []
        }))
      };
    }

    const on = '#409CFF', off2 = '#8E8E93';
    return {
      show: { summary: s.tab === 'summary', input: s.tab === 'input', planner: s.tab === 'planner', journal: s.tab === 'journal', history: s.tab === 'history', settings: s.tab === 'settings' },
      showTabs: !(s.tab === 'input' && s.inp && s.inp.phase === 'q'), scrollPad: (s.tab === 'input' && s.inp && s.inp.phase === 'q') ? 'padding-bottom: env(safe-area-inset-bottom)' : '',
      st: st, su: su, ad: ad, dsheet: dsheet, openAdd: () => this.openAdd('personal'), hasData: hasData, noData: !hasData, wk: wk2, pm: pm, jn: jn, pk: dpk, scv: scv, onScanFile: (ev) => this.onScanFile(ev),
      openJPick: () => { const pp = this.state.jDate.split('-'); this.setState({ pick: { y: +pp[0], m: +pp[1] - 1, j: true } }); },
      openPick: () => { const st = this.state; const c = st.pMode === 'work' ? st.wDate : (st.pView === 'day' ? st.pDate : st.pWeek); const pp = c.split('-'); this.setState({ pick: { y: +pp[0], m: +pp[1] - 1 } }); }, vdb: vdb, attn: attn,
      goSettings: () => this.setState({ tab: 'settings', sel: null, msg: '', delStep: 0, set: this.freshDraft() }),
      runSetup: () => this.setState({ setup: { step: 0 }, set: this.freshDraft(), msg: '' }),
      tabc: { summary: s.tab === 'summary' ? on : off2, input: s.tab === 'input' ? on : off2, planner: s.tab === 'planner' ? on : off2, journal: s.tab === 'journal' ? on : off2, history: s.tab === 'history' ? on : off2 },
      pl: pl, rv: rv, pn: pn,
      tipsOn: s.online, tipsOff: !s.online && latRecs.items.length > 0,
      offlineLabel: s.simOff ? 'Demo: turn internet back on' : 'Demo: see it without internet',
      toggleOffline: () => this.setState({ simOff: !this.state.simOff }),
      goPlanner: () => this.go('planner'),
      toNote: () => this.patchInp({ phase: 'note' }),
      todayLabel: fmt(TODAY), lat: lat, week: week, highlights: highlights, sections: sections, filters: filters, big3: big3,
      latRecs: latRecs, latSafety: latSafety, openLatest: () => this.setState({ sel: lk }),
      iv: iv, res: res, cal: cal, sheet: sheet,
      goSummary: () => this.go('summary'), goInput: () => this.go('input'), goJournal: () => this.go('journal'), goHistory: () => this.go('history'),
      back: () => this.back(), save: () => this.save(),
      onNote: (ev) => this.patchInp({ note: ev.target.value }),
      prevMonth: () => this.shiftMonth(-1), nextMonth: () => this.shiftMonth(1), closeSheet: () => this.setState({ sel: null })
    };
  }
}
