import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateDocument, assertRestorable} from '../../src/document.js';
import {migrateLegacy, extractInitial} from '../../src/migrate.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const example=k=>read('../examples/'+k+'.json');
for(const kind of ['node-edge','spectrum']) {
 test(kind+': arbitrary documents, deletion and precision survive validation',()=>{
  for(const d of [example(kind),read('fixtures/independent/'+kind+'.json')]) {
   d.variants[0].current.labels.pop(); d.variants[0].current.labels[0].x=1.234567890123;
   const before=structuredClone(d); assert.deepEqual(validateDocument(d),before); assert.deepEqual(d,before);
  }
 });
 test(kind+': exact restoration identity; new documents accepted independently',()=>{
  const d=example(kind);
  for(const mutate of [x=>x.figure_id+='x',x=>x.base_revision+='x',x=>x.coordinate_system.width++,x=>x.variants[0].initial.labels[0].x++,x=>x.variants[0].initial.labels.reverse()]){
   const x=structuredClone(d); mutate(x); assert.throws(()=>assertRestorable(d,x));
  }
  const x=structuredClone(d); x.variants[0].current.labels[0].text='途中'; assert.doesNotThrow(()=>assertRestorable(d,x));
 });
 test(kind+': invalid fields and retained structure rejected without mutation',()=>{
  const mutations=[x=>x.schema_version=99,x=>x.diagram_kind='unknown',x=>x.extra=true,x=>x.variants[0].current.labels[0].extra=true,x=>x.variants[0].current.labels[0].x=Infinity,x=>x.variants[0].current.labels[0].fill='url(https://example.org)',x=>x.variants[0].current.labels[0].id='unknown',x=>x.variants[0].initial.labels.push(x.variants[0].initial.labels[0])];
  mutations.push(kind==='node-edge'?x=>x.variants[0].current.connections[0].directed=false:x=>x.variants[0].current.paths[0].points.pop());
  mutations.push(x=>x.variants[0].current.labels[0].fontSize=0,x=>x.selected_variant_id='unknown',x=>x.coordinate_system.origin='center',x=>x.variants[1].id=x.variants[0].id);
  if(kind==='node-edge')mutations.push(x=>x.variants[0].current.elements[0].width=0,x=>x.variants[0].current.labels[0].owner_id='stage-2',x=>x.variants[0].current.elements[0].group_id=null,x=>x.variants[0].initial.connections[0].from.anchor='unknown',x=>x.variants[0].current.constraints.pop(),x=>x.variants[0].current.elements.shift());
  else mutations.push(x=>x.variants[0].current.regions[0].height=0,x=>x.variants[0].current.paths[0].width++,x=>x.variants[0].current.paths[0].dash=!x.variants[0].current.paths[0].dash,x=>x.variants[0].initial.paths[0].points.splice(1,2));
  for(const mutate of mutations){const x=example(kind);mutate(x);const before=structuredClone(x);assert.throws(()=>validateDocument(x),/\$/);assert.deepEqual(x,before);}
 });
 test(kind+': explicit v1 migration preserves every state and requires missing base',()=>{
  for(const mode of ['','-edited','-deleted','-empty','-needs-base']){
   const old=read('fixtures/legacy-v1/'+kind+mode+'.json'),before=structuredClone(old),base=read('fixtures/legacy-v1/'+kind+'.json');
   if(mode==='-needs-base')assert.throws(()=>migrateLegacy(old,kind));
   const next=migrateLegacy(old,kind,base); assert.equal(next.schema_version,2); assert.equal(next.diagram_kind,kind);
   assert.deepEqual(old,before); assert.deepEqual(next.variants.map(v=>v.current),old.variants.map(v=>v.current));
   assert.deepEqual(next.variants.map(v=>v.initial),base.variants.map(v=>v.initial));
   assert.throws(()=>migrateLegacy(old,kind==='node-edge'?'spectrum':'node-edge',base));
  }
 });
}
test('HTML initial extractor reads a JSON literal without executing code',()=>{
 const d=example('node-edge'); assert.deepEqual(extractInitial('<script>const INITIAL = '+JSON.stringify(d)+';throw Error("never execute")</script>'),d);
 assert.throws(()=>extractInitial('const INITIAL = (()=>alert(1))()'));
});
test('legacy default label ink remains family-specific without inserting overrides',async()=>{
 const {paint}=await import('../../src/colors.js');assert.equal(paint({},'fill','labels','spectrum'),'#203e50');assert.equal(paint({},'fill','labels','node-edge'),'#192d40');
});
test('migration rejects a base with mismatched variant titles',()=>{
 const old=read('fixtures/legacy-v1/node-edge-needs-base.json'),base=read('fixtures/legacy-v1/node-edge.json');base.variants[0].title='different';assert.throws(()=>migrateLegacy(old,'node-edge',base),/title/);
});
test('fixed invalid fixtures report the expected path and preserve the input',()=>{
 for(const c of read('fixtures/invalid/cases.json')){
  const d=read('fixtures/invalid/'+c.file),before=structuredClone(d);
  assert.throws(()=>validateDocument(d),e=>e.message.startsWith(c.reason_path+':'));assert.deepEqual(d,before);
  if(c.file.includes('unknown-field'))delete d.variants[0].current.labels[0].unexpected;
  else d.variants[0].current.labels.splice(1,1);
  assert.doesNotThrow(()=>validateDocument(d),'fixture must have only the stated defect: '+c.file);
 }
});
