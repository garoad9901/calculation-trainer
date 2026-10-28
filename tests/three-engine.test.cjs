/* 【ChatGPT】【FileName】tests/three-engine.test.cjs
【作成日時】2026-10-28
【概要】3数の出題全候補を、両方の計算順序について独立に検証する。
【使い方】node tests/three-engine.test.cjs
【仕様】2916候補を総当たり。例示された禁止問題・ゼロ・2桁・全符号・候補の完全性を検証。 */
const assert=require('node:assert/strict');
const {pool,question}=require('../three-engine.js');
const qs=pool(), key=q=>[q.a,q.sign,q.b,q.secondSign,q.c].join(':');
const actual=new Set(qs.map(key));assert.equal(actual.size,qs.length);
let expectedCount=0;
for(let a=1;a<=9;a++) for(let b=1;b<=9;b++) for(let c=1;c<=9;c++) for(const x of ['+','−']) for(const y of ['+','−']) {
 const l=x==='+'?a+b:a-b, r=y==='+'?b+c:b-c;
 const total=y==='+'?l+c:l-c, alternative=x==='+'?a+r:a-r;
 const subtractionFirstOK = x === '+' && y === '−' ? a >= c && b >= c : x === '−' && y === '+' ? a >= b && c >= b : true;
 const valid=subtractionFirstOK && l>=0 && r>=0 && total>=0 && alternative>=0;
 assert.equal(actual.has(key({a,b,c,sign:x,secondSign:y})),valid);
 if(valid){expectedCount++;assert.equal(question(a,b,c,x,y).answer,total);}
 else assert.throws(()=>question(a,b,c,x,y),RangeError);
}
assert.equal(qs.length,expectedCount);
assert.throws(()=>question(4,9,7,'+','−'));
assert.throws(()=>question(9,4,2,'−','+'));
assert.throws(()=>question(5,2,3,'+','−'));
assert.throws(()=>question(3,5,1,'−','+'));
assert.throws(()=>question(5,3,4,'−','+')); // right-first would also end negative
assert.throws(()=>question(9,2,3,'−','−')); // right pair 2−3 is negative
assert.equal(question(5,3,2,'+','−').answer,6);
assert.equal(question(9,5,4,'−','−').answer,0);
assert.equal(question(9,9,9,'+','+').answer,27);
assert.equal(new Set(qs.map(q=>q.sign+q.secondSign)).size,4);
assert.throws(()=>question(0,2,3,'+','+'));assert.throws(()=>question(2.5,2,3,'+','+'));
const copy=pool();copy.pop();assert.equal(pool().length,expectedCount);
console.log(`PASS: ${expectedCount} allowed questions out of 2916; both computation orders nonnegative; 5+2−3 excluded; all four patterns; zero and two-digit answers.`);
