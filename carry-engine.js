/*
【ChatGPT】
【FileName】carry-engine.js
【作成日時】2026-10-24
【概要】繰上りのある足し算を「10を作る・残り・答え」の3段階で練習する状態管理。
【使い方】ブラウザはCarryPractice.Session、Node.jsはrequireで利用。
【仕様】1〜9の2数、和が11〜18となる36通り。最初の数の下限を2〜9で指定。全問・ランダム・指定例。誤答は同じ段階を再試行し、全問モードは後でも復習。保存・本番連携なし。
*/
(function (root) {
  'use strict';
  const key = q => `${q.a}:${q.b}`;
  function question(a, b) {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || a > 9 || b < 1 || b > 9 || a + b <= 10) throw new RangeError('繰上りのある1桁の足し算を指定してください。');
    return { a, b, need: 10 - a, rest: b - (10 - a), answer: a + b };
  }
  function pool(minFirst = 2) {
    if (!Number.isInteger(minFirst) || minFirst < 2 || minFirst > 9) throw new RangeError('最初の数は2〜9で指定してください。');
    const result = [];
    for (let a = minFirst; a <= 9; a++) for (let b = 1; b <= 9; b++) if (a + b > 10) result.push(question(a, b));
    return result;
  }
  function shuffle(items, random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  class Session {
    constructor({ mode = 'all', example = { a: 8, b: 7 }, random = Math.random, minFirst = 2 } = {}) {
      if (!['all', 'random', 'example'].includes(mode)) throw new RangeError('Unknown mode');
      this.mode = mode; this.random = random; this.pool = mode === 'example' ? [question(example.a, example.b)] : pool(minFirst);
      this.queue = mode === 'random' ? [] : shuffle(this.pool, random); this.review = []; this.mastered = new Set();
      this.round = 1; this.completed = 0; this.attempts = 0; this.mistakes = 0; this.current = null;
      this.status = 'idle'; this.stage = 0; this.values = [null, null, null]; this.hadMistake = false;
    }
    next() {
      if (!['idle', 'complete'].includes(this.status)) return false;
      if (this.mode === 'random') {
        const choices = this.pool.filter(q => !this.current || key(q) !== key(this.current));
        this.current = choices[Math.floor(this.random() * choices.length)];
      } else {
        if (!this.queue.length && this.review.length) { this.queue = shuffle(this.review, this.random); this.review = []; this.round++; }
        if (!this.queue.length) { this.status = 'finished'; return false; }
        this.current = this.queue.shift();
      }
      this.stage = 0; this.values = [null, null, null]; this.hadMistake = false; this.status = 'answering'; return true;
    }
    expected() { return this.current ? [this.current.need, this.current.rest, this.current.answer][this.stage] : null; }
    explanation() {
      const q = this.current;
      return [
        `${q.a}は、あと${q.need}で10になるよ。`,
        `${q.b}を${q.need}と${q.rest}にわけるよ。${q.need}をつかうと、のこりは${q.rest}だね。`,
        `${q.a}と${q.need}で10。10と${q.rest}で${q.answer}になるよ。`
      ][this.stage];
    }
    submit(input) {
      if (this.status !== 'answering' || !/^\d+$/.test(String(input))) return { ignored: true };
      const entered = Number(input), expected = this.expected(); this.attempts++;
      if (entered !== expected) {
        this.mistakes++; this.hadMistake = true; this.status = 'wrong';
        return { correct: false, entered, expected, explanation: this.explanation() };
      }
      this.values[this.stage] = entered;
      if (this.stage < 2) this.status = 'step-complete';
      else {
        this.status = 'complete'; this.completed++;
        if (!this.hadMistake) this.mastered.add(key(this.current));
        else if (this.mode === 'all') this.review.push(this.current);
      }
      return { correct: true, completed: this.status === 'complete' };
    }
    advance() { if (this.status !== 'step-complete') return false; this.stage++; this.status = 'answering'; return true; }
    retry() { if (this.status !== 'wrong') return false; this.status = 'answering'; return true; }
    stop() { this.status = 'finished'; }
    get remaining() { return this.mode === 'random' ? Infinity : this.queue.length + this.review.length; }
  }
  const api = { Session, pool, question };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CarryPractice = api;
})(typeof window === 'undefined' ? globalThis : window);
