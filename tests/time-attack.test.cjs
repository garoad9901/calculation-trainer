/* 【ChatGPT】【FileName】tests/time-attack.test.cjs
【作成日時】2026-10-21
【概要】タイムアタック・自己ベスト・演出確認の回帰テスト。
【使い方】TZ=Asia/Tokyo node tests/time-attack.test.cjs
【仕様】DOM・時計・端末保存を模擬し、アプリ本体のイベントを通して検証する。 */
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
class Element {
  constructor(data = {}) {
    this.dataset = data; this.textContent = ''; this.children = []; this.value = ''; this.attrs = {}; this.events = {};
    this.disabled = false; this.open = false; this.checked = false; this.clientWidth = 350; this.scrollLeft = 0; this.isConnected = true;
    this.style = { setProperty(key, value) { this[key] = value; } }; this.classes = new Set();
    this.classList = { add: key => this.classes.add(key), remove: key => this.classes.delete(key), contains: key => this.classes.has(key), toggle: (key, value) => value ? this.classes.add(key) : this.classes.delete(key) };
  }
  addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
  fire(type, extra = {}) { for (const fn of this.events[type] || []) fn({ target: this, preventDefault() {}, stopPropagation() {}, ...extra }); }
  click() { if (!this.disabled) this.fire('click'); }
  showModal() { this.open = true; } close() { this.open = false; this.fire('close'); }
  focus() {} closest() { return null; }
  append(el) { this.children.push(el); } replaceChildren() { this.children = []; this.textContent = ''; }
  setAttribute(key, value) { this.attrs[key] = value; } removeAttribute(key) { delete this.attrs[key]; }
  scrollTo(options) { this.scrollLeft = options.left; this.fire('scroll'); }
}
const storage = new Map(); let now = Date.parse('2026-10-21T10:00:00+09:00');
class FakeDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
function boot(code = source, search = "?debug=1") {
  const ids = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  ids.practice.classes.add('hidden'); ids.finish.classes.add('hidden'); ids.timeAttack.checked = true;
  const keys = Array.from({ length: 10 }, (_, n) => new Element({ digit: String(n) }));
  const utilities = ['clear', 'back'].map(action => new Element({ action })); const keypad = new Element();
  const operations = ['add', 'sub', 'carry'].map(op => new Element({ op })), modes = ['all', 'random'].map(mode => new Element({ mode })), periods = ['today', 'week', 'month'].map(period => new Element({ period }));
  const debug = [new Element(), new Element()];
  const groups = { '[data-op]': operations, '[data-mode]': modes, '[data-period]': periods, '.key': [...keys, ...utilities], '.key.utility': utilities, '[data-digit]': keys, '.debug-only': debug };
  const document = { hidden: false, events: {}, createElement: () => new Element(), querySelector: s => s === '.keypad' ? keypad : s === '[data-digit="1"]' ? keys[1] : ids[s.slice(1)] || utilities.find(el => s === `[data-action="${el.dataset.action}"]`), querySelectorAll: s => groups[s] || [], addEventListener(type, fn) { (this.events[type] ||= []).push(fn); } };
  const pending = new Map(); let sequence = 0;
  const context = vm.createContext({ CarryPractice: require('../carry-engine.js'), document, window: Object.assign(new Element(), { location: { search } }), URLSearchParams, Math, Date: FakeDate, crypto, performance: { now: () => now }, requestAnimationFrame: fn => fn(), setInterval: () => 999, clearInterval() {}, setTimeout: fn => { pending.set(++sequence, fn); return sequence; }, clearTimeout: id => pending.delete(id), localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } });
  vm.runInContext(code, context);
  return { ids, keys, operations, modes, periods, document, debug, pending, state: expr => vm.runInContext(expr, context), flush() { assert.equal(pending.size, 1); const [id, fn] = pending.entries().next().value; pending.delete(id); fn(); } };
}
let app = boot();
const finishRun = (delay, wrong = false) => {
  app.ids.start.click(); assert.equal(app.state('pool.length'), 55);
  for (let i = 0; i < 55; i++) {
    now += delay;
    if (wrong && i === 0) {
      app.keys[(app.state('current.answer') + 1) % 10].click();
      assert(app.ids.mistakeDialog.open); assert.equal(app.pending.size, 0);
      const paused = app.state('currentAttackMs()'); now += 60000; assert.equal(app.state('currentAttackMs()'), paused);
      app.ids.understood.click();
    } else { app.keys[app.state('current.answer')].click(); app.flush(); }
  }
  if (wrong) { assert(app.state('reviewing')); now += delay; app.keys[app.state('current.answer')].click(); app.flush(); }
};
finishRun(1000); assert(app.ids.celebrationDialog.open); assert.equal(app.ids.celebrationTitle.textContent, 'はじめての きろく！'); assert.equal(app.state('bestFor(selectedProfile()).timeMs'), 55000); assert.equal(app.ids.attackTime.textContent, '0:55.00');
assert(app.ids.finish.classes.has('hidden') === false); app.ids.closeCelebration.click(); app.ids.again.click();
finishRun(2000); assert(!app.ids.celebrationDialog.open); assert.equal(app.state('bestFor(selectedProfile()).timeMs'), 55000); app.ids.again.click();
finishRun(1000); assert(!app.ids.celebrationDialog.open); app.ids.again.click();
finishRun(500, true); assert(app.ids.celebrationDialog.open); assert.equal(app.ids.celebrationTitle.textContent, 'じこベスト こうしん！'); assert.equal(app.state('bestFor(selectedProfile()).timeMs'), 28000); app.ids.closeCelebration.click(); app.ids.again.click();
const history = JSON.stringify(app.state('learning')), saved = [...storage.values()][0];
app.ids.debugCelebrate.click(); assert(app.ids.celebrationDialog.open); assert.equal(JSON.stringify(app.state('learning')), history); assert.equal([...storage.values()][0], saved); assert(!app.ids.celebrationPreview.classes.has('hidden')); app.ids.closeCelebration.click();
app.ids.start.click(); now += 1000; app.ids.debugCelebrate.click(); now += 300000; assert.equal(app.state('currentAttackMs()'), 1000); app.ids.closeCelebration.click();
now += 1000; app.ids.openParent.click(); now += 300000; assert.equal(app.state('currentAttackMs()'), 2000); app.ids.closeParent.click();
now += 1000; app.document.hidden = true; app.document.events.visibilitychange[0](); now += 300000; assert.equal(app.state('currentAttackMs()'), 3000); app.document.hidden = false; app.document.events.visibilitychange[0]();
now += 1000; app.keys[app.state('current.answer')].click(); assert.equal(app.state('currentAttackMs()'), 4000); now += 10000; assert.equal(app.state('currentAttackMs()'), 4000); app.flush(); app.ids.stop.click();
assert.equal(app.state('bestFor(selectedProfile()).timeMs'), 28000); assert(!app.ids.celebrationDialog.open); app.ids.again.click();
app.ids.timeAttack.checked = false; finishRun(100); assert(!app.ids.celebrationDialog.open); assert.equal(app.state('bestFor(selectedProfile()).timeMs'), 28000); app.ids.again.click();
app.operations[1].click(); app.ids.timeAttack.checked = true; assert.equal(app.state('bestFor(selectedProfile())'), null); finishRun(100); assert.equal(app.state('bestFor(selectedProfile()).timeMs'), 5500); assert.equal(app.state('bestFor(selectedProfile(),"add").timeMs'), 28000); app.ids.closeCelebration.click();
app = boot(); assert.equal(app.state('bestFor(selectedProfile(),"add").timeMs'), 28000); assert.equal(app.state('bestFor(selectedProfile(),"sub").timeMs'), 5500);
app.ids.openParent.click(); app.ids.profileName.value = '別の子'; app.ids.addProfile.click(); app.ids.closeParent.click(); assert.equal(app.state('bestFor(selectedProfile())'), null);
app.modes[1].click(); app.ids.start.click(); assert.equal(app.state('sessionTimed'), false); now += 1000; app.keys[app.state('current.answer')].click(); app.flush(); app.ids.stop.click(); assert.equal(app.state('bestFor(selectedProfile())'), null);
const release = boot(source, ''); release.ids.debugCelebrate.click(); assert(!release.ids.celebrationDialog.open); assert(release.debug.every(el => el.classes.has('hidden'))); assert(release.ids.appVersion.textContent.includes('正式版'));
console.log('PASS: 55 questions + review; first/faster/equal/slower best; celebrations; preview has no stored side effects; pause/resume and feedback timing; incomplete/untimed/random excluded; operation/child isolation; reload persistence; release debug switch.');

for (const search of ['', '?debug=0', '?debug=false', '?debug', '?v=1.0']) {
  const normal = boot(source, search);
  assert.equal(normal.state('APP_CONFIG.debug'), false);
  assert(normal.debug.every(el => el.classes.has('hidden')));
}
for (const search of ['?debug=1', '?v=1.0&debug=1']) {
  const debugging = boot(source, search);
  assert.equal(debugging.state('APP_CONFIG.debug'), true);
  assert(debugging.debug.every(el => !el.classes.has('hidden')));
  const before = JSON.stringify(debugging.state('learning')); debugging.ids.debugCelebrate.click();
  assert(debugging.ids.celebrationDialog.open); assert.equal(JSON.stringify(debugging.state('learning')), before);
}
console.log('PASS: normal URL is release mode; only debug=1 enables preview; both URL modes share the existing learning records.');

// Integrated carry practice: settings, progress, retry, clocks and storage isolation.
app = boot(source, '');
app.ids.openParent.click(); app.ids.carryMinimum.value = '8'; app.ids.carryMinimum.fire('change'); app.ids.closeParent.click();
assert.equal(app.state('selectedProfile().carryMinFirst'), 8);
app.operations[2].click(); assert(app.ids.modeHint.textContent.includes('15問'));
app.ids.start.click(); assert.equal(app.state('pool.length'), 15); assert(app.state('current.a >= 8 && current.rest > 0'));
assert(app.ids.problem.classes.has('hidden')); assert(!app.ids.carryWork.classes.has('hidden'));
const beforeAttempts = app.state('dayRecord(activeSessionProfile()).attempts');
now += 1000; app.keys[app.state('carrySession.expected()')].click();
assert.equal(app.state('carrySession.stage'), 0); assert(!app.ids.carryCorrect.open); assert.equal(app.state('dayRecord(activeSessionProfile()).attempts'), beforeAttempts);
const pausedCarry = app.state('currentAttackMs()'); now += 30000; assert.equal(app.state('currentAttackMs()'), pausedCarry); app.flush();
assert.equal(app.state('carrySession.stage'), 1);
// Wrong remainder waits for acknowledgement, retains the correct first part.
now += 1000; app.keys[0].click(); assert(app.ids.mistakeDialog.open); const firstPart = app.state('carrySession.values[0]');
now += 30000; app.ids.understood.click(); assert.equal(app.state('carrySession.stage'), 1); assert.equal(app.state('carrySession.values[0]'), firstPart);
now += 1000; app.keys[app.state('carrySession.expected()')].click(); app.flush();
assert.equal(app.state('carrySession.stage'), 2); assert(!app.ids.carryCorrect.open);
assert(!app.ids.carryWork.classes.has('hidden')); assert.equal(app.state('document.querySelector(".keypad").classList.contains("single-digit")'), false);
const totalDigits = String(app.state('carrySession.expected()'));
now += 1000; app.keys[Number(totalDigits[0])].click(); assert(!app.ids.carryCorrect.open); assert.equal(app.state('locked'), false);
app.state('checkAnswer()'); assert(!app.ids.carryCorrect.open); // Enter cannot submit one digit.
app.keys[Number(totalDigits[1])].click(); assert(app.ids.carryCorrect.open); assert.equal(app.state('solved'), 0); assert.equal(app.state('carrySession.review.length'), 1);
const correctPaused = app.state('currentAttackMs()'); now += 60000; assert.equal(app.state('currentAttackMs()'), correctPaused);
assert.equal(app.ids.feedback.textContent, ''); app.ids.carryNext.click(); assert.equal(app.state('carrySession.stage'), 0);
// Changing settings in flight applies on next session, keeping the current best category stable.
app.ids.openParent.click(); app.ids.carryMinimum.value = '9'; app.ids.carryMinimum.fire('change'); app.ids.closeParent.click();
assert.equal(app.state('carryMinimum'), 8); assert.equal(app.state('attackKey()'), 'v1:carry:ten-making:min8');
let safety = 0;
while (app.state('sessionRunning')) {
 assert(++safety < 100);
 for (let stage = 0; stage < 3; stage++) {
  now += 100;
  for (const digit of String(app.state('carrySession.expected()'))) app.keys[Number(digit)].click();
  if (stage < 2) { assert(!app.ids.carryCorrect.open); app.flush(); }
  else { assert(app.ids.carryCorrect.open); app.ids.carryNext.click(); }
 }
}
assert.equal(app.state('carrySession.mastered.size'), 15); assert(app.ids.celebrationDialog.open);
assert(app.ids.celebrationWho.textContent.includes('15もん')); assert(app.state('activeSessionProfile().bests["v1:carry:ten-making:min8"]'));
assert.equal(app.state('activeSessionProfile().bests["v1:carry:ten-making:min9"]'), undefined);
assert(app.state('Object.keys(dayRecord(activeSessionProfile()).problems).some(key => key.startsWith("carry:"))'));
assert.equal(app.state('bestFor(learning.profiles[0], "add").timeMs'), 28000);
app.ids.closeCelebration.click(); app.ids.again.click(); app.ids.start.click(); assert.equal(app.state('pool.length'), 8); assert.equal(app.state('carryMinimum'), 9);
app.ids.stop.click();
const carryReload = boot(source, ''); assert.equal(carryReload.state('selectedProfile().carryMinFirst'), 9);
carryReload.operations[2].click(); carryReload.modes[1].click(); carryReload.ids.start.click();
assert.equal(carryReload.state('sessionTimed'), false); assert(carryReload.state('current.a === 9 && current.rest > 0'));
carryReload.ids.stop.click();
// Child-specific setting does not leak to another profile.
carryReload.ids.openParent.click(); carryReload.ids.profileName.value = '繰上りの別の子'; carryReload.ids.addProfile.click(); carryReload.ids.closeParent.click();
assert.equal(carryReload.state('selectedProfile().carryMinFirst || 2'), 2);
carryReload.ids.again.click(); carryReload.ids.start.click(); assert.equal(carryReload.state('pool.length'), 36);
console.log('PASS: integrated carry practice; child settings and reload; no zero remainders; auto steps and final-only popup; same-step retry and deferred review; pause clocks; per-range bests; existing records preserved; random mode.');
