/*
【ChatGPT】【FileName】three-engine.js
【作成日時】2026-10-28
【概要】途中の計算でも負の数にならない3つの数の足し算・引き算。
【使い方】ThreePractice.pool()で出題候補、question(a,b,c,firstSign,secondSign)で検証。
【仕様】各数は1〜9。符号は＋＋・＋−・−＋・−−。左の2数から、右の2数からの両方で途中と最後を非負に限定。混合式はどちらの正の項から先に引いても非負に限定。答えは元の式を左から計算した値。
*/
(function(root) {
 'use strict';
 const apply = (a, sign, b) => sign === '+' ? a + b : a - b;
 function question(a,b,c,firstSign,secondSign) {
  if (![a,b,c].every(n => Number.isInteger(n) && n >= 1 && n <= 9) || !['+','−'].includes(firstSign) || !['+','−'].includes(secondSign)) throw new RangeError('1〜9の数と＋・−を指定してください。');
  const left = apply(a,firstSign,b), right = apply(b,secondSign,c);
  const answer = apply(left,secondSign,c), alternate = apply(a,firstSign,right);
  const negativeOnReorder = firstSign === '+' && secondSign === '−' ? a < c || b < c : firstSign === '−' && secondSign === '+' ? a < b || c < b : false;
  if (negativeOnReorder || [left,right,answer,alternate].some(n => n < 0)) throw new RangeError('途中または結果が負の数になる式は出題しません。');
  return { a,b,c,sign:firstSign,secondSign,answer };
 }
 let cached;
 function pool() {
  if (!cached) {
   cached=[];
   for(let a=1;a<=9;a++) for(let b=1;b<=9;b++) for(let c=1;c<=9;c++) for(const first of ['+','−']) for(const second of ['+','−']) {
    try { cached.push(Object.freeze(question(a,b,c,first,second))); } catch(error) { if (!(error instanceof RangeError)) throw error; }
   }
  }
  return [...cached];
 }
 const api={question,pool};
 if (typeof module === 'object' && module.exports) module.exports=api; else root.ThreePractice=api;
})(typeof window === 'undefined' ? globalThis : window);
