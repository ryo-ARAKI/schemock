import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateDocument,assertRestorable} from '../../src/document.js';
for(const kind of ['node-edge','spectrum'])test(kind+': fixture deltas preserve every unrelated value in every variant',()=>{
 const read=n=>validateDocument(JSON.parse(fs.readFileSync(new URL('../../examples/roundtrip/'+kind+'/'+n+'.json',import.meta.url))));
 const names=['00-proposals','01-human','02-agent-local','03-human','04-agent-structure','05-resumed'],ds=names.map(read);
 const [seed,human,local,continued,structural,resumed]=ds;
 for(const d of [human,local,continued]){assertRestorable(seed,d);assert.deepEqual(d.variants.map(v=>v.initial),seed.variants.map(v=>v.initial));}
 const expected=structuredClone(human);expected.variants[0].current.labels[0].x=kind==='node-edge'?90.123456789:440.123456789;assert.deepEqual(local,expected);
 assert.deepEqual(structural.variants[1],continued.variants[1]);assert.equal(structural.figure_id,continued.figure_id);assert.notEqual(structural.base_revision,continued.base_revision);assert.throws(()=>assertRestorable(continued,structural));
 for(const key of Object.keys(continued.variants[0].initial)){
  const old=continued.variants[0],next=structural.variants[0];
  for(const state of ['initial','current'])assert.deepEqual(next[state][key].filter(o=>old.initial[key].some(b=>b.id===o.id)),old[state][key]);
  const missing=old.initial[key].filter(o=>!old.current[key].some(c=>c.id===o.id)).map(o=>o.id);
  assert.ok(missing.every(id=>!next.current[key].some(o=>o.id===id)));
 }
 assertRestorable(structural,resumed);
});
