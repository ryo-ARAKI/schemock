import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {withBrowser,evidenceDirectory} from './chrome.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const chrome=process.env.CHROME||'/usr/bin/google-chrome';
const html=path.join(root,'dist/schemock-v0.1.0.html');
const nativeSave=`window.showSaveFilePicker=async()=>({createWritable:async()=>({
 write:async blob=>{window.savedJSON=await blob.text()},close:async()=>{},abort:async()=>{}
})})`;

for(const kind of ['node-edge','spectrum'])test(kind+': unfinished points survive target and variant changes until corrected or reset',async()=>{
 const input=path.join(root,'examples/'+kind+'.json');
 const original=JSON.parse(fs.readFileSync(input));
 const active=original.variants.find(v=>v.id===original.selected_variant_id);
 const route=kind==='node-edge'?active.current.connections.find(c=>c.waypoints.length):active.current.paths[0];
 const other=active.current.labels[0];
 const out=evidenceDirectory('unfinished-');
 await withBrowser({chrome,html,out},async b=>{
  const {js,load,select,fill,click,variant}=b;
  await load(input);await select(route.id);
  const valid=await js('document.querySelector("#points").value');
  const unfinished='111.25, 222.5\n333.75,';
  await fill('#points',unfinished);
  await select(other.id);
  await load(input);
  assert.equal(await js('document.querySelector("#discard-dialog").open'),true,'hidden unfinished input must require an explicit discard');
  await click('#keep');
  await js(nativeSave);await click('#save');
  await b.waitFor('!document.querySelector("#save").disabled');
  const saved=JSON.parse(await js('window.savedJSON'));
  assert.deepEqual(saved.variants,original.variants,'only the last valid values may be exported');
  assert.match(await js('document.querySelector("#status").textContent'),/入力途中/);
  assert.match(await js('document.querySelector("#dirty").textContent'),/未保存/);
  await variant(original.variants.find(v=>v.id!==active.id).id);
  await select(other.id);
  await fill('#x','-');
  await variant(active.id);await select(route.id);
  assert.equal(await js('document.querySelector("#points").value'),unfinished);
  assert.equal(await js('document.querySelector("#points").getAttribute("aria-invalid")'),'true');
  await fill('#points',valid);
  await select(other.id);await select(route.id);
  assert.equal(await js('document.querySelector("#points").getAttribute("aria-invalid")'),null);
  await fill('#points',unfinished);await click('#reset');await select(route.id);
  assert.notEqual(await js('document.querySelector("#points").value'),unfinished,'reset clears only this variant’s unfinished fields');
  await variant(original.variants.find(v=>v.id!==active.id).id);await select(other.id);
  assert.equal(await js('document.querySelector("#x").value'),'-','another variant’s draft must survive reset');
 });
});

test('deleting the last object clears its unfinished fields and allows a completed save to be clean',async()=>{
 const original=JSON.parse(fs.readFileSync(path.join(root,'examples/spectrum.json')));
 original.variants=original.variants.slice(0,1);
 original.selected_variant_id=original.variants[0].id;
 for(const state of ['initial','current']){
  const scene=original.variants[0][state];scene.paths=[];scene.regions=[];scene.labels=scene.labels.slice(0,1);
 }
 const out=evidenceDirectory('unfinished-empty-'),input=path.join(out,'single.json');
 fs.writeFileSync(input,JSON.stringify(original));
 await withBrowser({chrome,html,out},async b=>{
  const {js,load,fill,click}=b;
  await load(input);await fill('#x','-');await click('#delete');
  assert.equal(await js('document.querySelector("#editor").classList.contains("hidden")'),true);
  assert.equal(await js('document.querySelectorAll("#editor [aria-invalid]").length'),0);
  await js(nativeSave);await click('#save');
  await b.waitFor('!document.querySelector("#save").disabled');
  assert.doesNotMatch(await js('document.querySelector("#dirty").textContent'),/未保存/);
  assert.doesNotMatch(await js('document.querySelector("#status").textContent'),/入力途中/);
  const saved=JSON.parse(await js('window.savedJSON'));
  assert.equal(saved.variants[0].current.labels.length,0);
  assert.equal(saved.variants[0].initial.labels.length,1);
  await load(input);
  assert.equal(await js('document.querySelector("#discard-dialog").open'),false);
 });
});
