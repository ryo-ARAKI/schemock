import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {withBrowser,evidenceDirectory} from './chrome.mjs';
const root=path.resolve(import.meta.dirname,'../..'),chrome=process.env.CHROME||'/usr/bin/google-chrome',html=path.join(root,'dist/schemock-v0.1.0.html');
test('JSON and PNG capture start state while editing and switching variants; old save does not mark new document',async()=>{
 const out=evidenceDirectory('snapshots-');
 await withBrowser({chrome,html,out},async b=>{
  const {js,load,click,select,fill,variant,downloaded}=b;await load(path.join(root,'examples/spectrum.json'));await js('window.showSaveFilePicker=undefined');
  await click('#png');const baseline=fs.readFileSync(await downloaded('.png'));
  await js(`window.decodeImage=Image.prototype.decode;Image.prototype.decode=function(){return new Promise((resolve,reject)=>{window.finishImage=()=>window.decodeImage.call(this).then(resolve,reject)})}`);
  await click('#png');await variant('callouts');await select('label-law');await fill('#text','保存中の追加編集');await js('window.finishImage()');const pending=fs.readFileSync(await downloaded('.png'));assert.deepEqual(pending,baseline);
  await js('Image.prototype.decode=window.decodeImage');
  await js(`window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async blob=>{window.savedPayload=await blob.text()},close:()=>new Promise(r=>window.finishWrite=r),abort:async()=>{}})})`);
  await click('#save');await b.waitFor('typeof window.finishWrite==="function"');await variant('bands');await select('label-law');await fill('#text','保存開始後');await js('window.finishWrite()');await b.waitFor(`!document.querySelector('#save').disabled`);
  const saved=JSON.parse(await js('window.savedPayload'));assert.equal(saved.selected_variant_id,'callouts');assert.equal(saved.variants[1].current.labels.find(l=>l.id==='label-law').text,'保存中の追加編集');assert.match(await js(`document.querySelector('#dirty').textContent`),/未保存/);
  // Complete another pending save after a new document was opened.
  await click('#save');await load(path.join(root,'examples/node-edge.json'));await click('#discard');await select('label-1');await fill('#text','新文書の追加編集');await js('window.finishWrite()');await b.waitFor(`!document.querySelector('#save').disabled`);assert.match(await js(`document.querySelector('#dirty').textContent`),/未保存/);
 });
});
