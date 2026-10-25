/*
【ChatGPT】
【FileName】tests/carry-engine.test.cjs
【作成日時】2026-10-24
【概要】繰上り練習の分解・段階遷移・誤答復習を検証。
【使い方】node tests/carry-engine.test.cjs
【仕様】写真の8+7、全36通り、残り0の除外、下限設定、誤答の再試行、複数回復習、ランダム、途中終了。
*/
const assert = require('node:assert/strict');
const { Session, pool, question } = require('../carry-engine.js');
const all = pool();
assert.equal(all.length, 36); assert.equal(new Set(all.map(q => `${q.a}:${q.b}`)).size, 36);
for (const q of all) {
 assert.equal(q.a + q.need, 10); assert.equal(q.need + q.rest, q.b); assert.equal(10 + q.rest, q.answer);
 assert(q.need >= 1 && q.need <= 9); assert(q.rest >= 1 && q.rest <= 8); assert(q.answer >= 11 && q.answer <= 18);
 const s = new Session({ mode: 'example', example: q }); assert(s.next());
 assert.equal(s.expected(), q.need); assert(s.submit(q.need).correct); assert(s.advance());
 assert.equal(s.expected(), q.rest); assert(s.submit(q.rest).correct); assert(s.advance());
 assert.equal(s.expected(), q.answer); assert(s.submit(q.answer).completed); assert.equal(s.completed, 1); assert.equal(s.next(), false); assert.equal(s.status, 'finished');
}
assert.throws(() => question(3, 4)); assert.throws(() => question(10, 5)); assert.throws(() => question(8, -1));
assert.throws(() => question(8, 2)); assert.throws(() => question(1, 9));
for (let minFirst = 2; minFirst <= 9; minFirst++) {
 const expected = all.filter(q => q.a >= minFirst);
 assert.deepEqual(pool(minFirst), expected);
 const filtered = new Session({ minFirst });
 assert.equal(filtered.pool.length, expected.length);
 while (filtered.next()) { assert(filtered.current.a >= minFirst); solve(filtered); }
 assert.equal(filtered.mastered.size, expected.length);
 const randomFiltered = new Session({ mode: 'random', minFirst });
 for (let i = 0; i < 30; i++) { assert(randomFiltered.next()); assert(randomFiltered.current.a >= minFirst); assert(randomFiltered.current.rest > 0); solve(randomFiltered); }
}
for (const invalid of [0, 1, 10, 2.5, '8', null]) { assert.throws(() => pool(invalid)); assert.throws(() => new Session({ minFirst: invalid })); }
const photo = new Session({ mode: 'example' }); photo.next(); assert.equal(photo.expected(), 2); assert.equal(photo.submit(1).correct, false); assert.equal(photo.status, 'wrong'); assert.equal(photo.next(), false); assert(photo.retry());
assert(photo.submit(2).correct); assert(photo.submit(2).ignored); assert(photo.advance()); assert.equal(photo.expected(), 5); assert.equal(photo.values[0], 2);
assert.equal(photo.submit(4).correct, false); assert(photo.retry()); assert.deepEqual(photo.values, [2, null, null]); assert.equal(photo.stage, 1);
photo.submit(5); photo.advance(); assert.equal(photo.expected(), 15); assert.equal(photo.submit(14).correct, false); photo.retry(); assert(photo.submit(15).completed); assert.deepEqual(photo.values, [2, 5, 15]); assert.equal(photo.mistakes, 3);
function solve(s, mistake = false) {
 if (mistake) { assert.equal(s.submit(0).correct, false); assert(s.retry()); }
 for (let i = 0; i < 3; i++) { const result = s.submit(s.expected()); assert(result.correct); if (i < 2) assert(s.advance()); }
}
const complete = new Session(); const seen = new Set();
while (complete.next()) { const q = complete.current; assert(!seen.has(`${q.a}:${q.b}`)); seen.add(`${q.a}:${q.b}`); solve(complete); }
assert.equal(complete.mastered.size, 36); assert.equal(complete.completed, 36); assert.equal(complete.attempts, 108);
const review = new Session(); const missed = [];
for (let i = 0; i < 36; i++) { assert(review.next()); if (i === 0 || i === 8) missed.push(`${review.current.a}:${review.current.b}`); solve(review, i === 0 || i === 8); }
assert.equal(review.mastered.size, 34); assert.equal(review.review.length, 2); assert(review.next()); assert.equal(review.round, 2); assert(missed.includes(`${review.current.a}:${review.current.b}`)); solve(review, true);
assert(review.next()); solve(review); assert(review.next()); assert.equal(review.round, 3); solve(review); assert.equal(review.next(), false); assert.equal(review.mastered.size, 36); assert.equal(review.completed, 39);
const random = new Session({ mode: 'random' }); let previous = '';
for (let i = 0; i < 100; i++) { assert(random.next()); const key = `${random.current.a}:${random.current.b}`; assert.notEqual(key, previous); previous = key; solve(random); }
assert.equal(random.completed, 100); random.stop(); assert.equal(random.next(), false); assert(random.submit(10).ignored);
const stopped = new Session(); stopped.next(); stopped.submit(stopped.expected()); stopped.stop(); assert.equal(stopped.advance(), false); assert.equal(stopped.completed, 0);
console.log('PASS: all 36 decompositions; 8+7 => 2/5/15; no zero remainder; configurable lower bound; same-stage retries; duplicate-answer guard; full completion; repeated review; random/stop.');
