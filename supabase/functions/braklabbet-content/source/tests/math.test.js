import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,compare,simplify,lcm,mixed} from '../math.js';
test('olika nämnare, heltal, negativa resultat och noll',()=>{
 assert.deepEqual(calculate({n:1,d:3},{n:1,d:4},'add'),{n:7,d:12});
 assert.deepEqual(calculate({n:1,d:3},{n:3,d:4},'sub'),{n:-5,d:12});
 assert.deepEqual(calculate({n:2,d:3},{n:3,d:4},'mul'),{n:1,d:2});
 assert.deepEqual(calculate({n:3,d:4},{n:2,d:3},'div'),{n:9,d:8});
 assert.deepEqual(calculate({n:1,d:2},{n:1,d:4},'div'),{n:2,d:1});
 assert.equal(calculate({n:1,d:2},{n:0,d:4},'div'),null);
 assert.deepEqual(calculate({n:0,d:3},{n:1,d:4},'div'),{n:0,d:1});
 assert.deepEqual(simplify({n:0,d:12}),{n:0,d:1});
 assert.throws(()=>simplify({n:1,d:0}),RangeError);
 assert.equal(compare({n:7,d:6},{n:6,d:5}),-1);
 assert.equal(compare({n:2,d:4},{n:1,d:2}),0);
 assert.equal(lcm(8,12),24);
 assert.deepEqual(mixed({n:9,d:8}),{sign:1,whole:1,remainder:1,d:8});
});
test('alla tillåtna bråk ger exakt jämförelse och förkortade resultat',()=>{
 for(let ad=1;ad<=12;ad++)for(let bd=1;bd<=12;bd++)for(let an=0;an<=2*ad;an++)for(let bn=0;bn<=2*bd;bn++){
  const a={n:an,d:ad},b={n:bn,d:bd};
  assert.equal(compare(a,b),Math.sign(an*bd-bn*ad));
  for(const op of ['add','sub','mul','div']){
   const r=calculate(a,b,op);if(op==='div'&&bn===0){assert.equal(r,null);continue}
   const [num,den]=op==='add'?[an*bd+bn*ad,ad*bd]:op==='sub'?[an*bd-bn*ad,ad*bd]:op==='mul'?[an*bn,ad*bd]:[an*bd,ad*bn];
   assert.equal(r.n*den,num*r.d);assert.ok(r.d>0);assert.deepEqual(simplify(r),r);
  }
 }
});
