import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {withBrowser,evidenceDirectory} from './chrome.mjs';import {TYPST_COLORS} from '../../src/colors.js';import {validateDocument} from '../../src/document.js';
const root=path.resolve(import.meta.dirname,'../..'),chrome=process.env.CHROME||'/usr/bin/google-chrome',html=path.join(root,'dist/schemock-v0.1.0.html');
for(const kind of ['node-edge','spectrum'])test(kind+': arbitrary identity/frame, every color role, drag, native field undo and SVG/PNG equivalence',async()=>{
 const input=path.join(root,'tests/fixtures/independent/'+kind+'.json'),initial=JSON.parse(fs.readFileSync(input)),out=evidenceDirectory('contracts-');
 await withBrowser({chrome,html,out},async b=>{
  const {js,call,click,select,fill,load,mouse,shortcut,downloaded}=b;await load(input);await js('window.showSaveFilePicker=undefined');
  assert.equal(await js(`document.querySelector('#canvas').getAttribute('viewBox')`),'0 0 731.125 463.5');
  const targets=kind==='node-edge'?[['unrelated-stage-1','fill','rect'],['unrelated-stage-1','stroke','rect'],['unrelated-cycle','fill','rect'],['unrelated-cycle','stroke','rect'],['unrelated-label-1','fill','text'],['unrelated-flow-12','stroke','polyline']]:[['unrelated-spectrum','stroke','path'],['unrelated-region-energy','fill','rect'],['unrelated-label-law','fill','text'],['unrelated-axis-x','stroke','path']];
  for(const [id,key,tag]of targets){
   await select(id);assert.equal(await js(`document.querySelectorAll('#${key}-picker button').length`),19);
   for(const [name,hex]of Object.entries(TYPST_COLORS)){
    await click('#'+key+'-picker summary');await click('#'+key+'-picker [data-value="'+name+'"]');
    assert.equal(await js(`document.querySelector('[data-id="${id}"] ${tag}').getAttribute('${key}')`),hex);
    if(id.includes('flow-12')||id.includes('axis-x'))assert.equal(await js(`(()=>{const p=document.querySelector('[data-id="${id}"] ${tag}');return document.querySelector(p.getAttribute('marker-end').slice(4,-1)+' path').getAttribute('fill')})()`),hex);
   }
   await click('#undo');assert.equal(await js(`document.querySelector('#${key}-name').textContent`),'green');await click('#redo');
   await click('#'+key+'-picker summary');await click('#'+key+'-picker [data-value=""]');
  }
  const boxId=kind==='node-edge'?'unrelated-stage-1':'unrelated-region-energy';await select(boxId);await click('#fill-picker summary');await click('#fill-picker [data-value="red"]');await click('#png');
  const red=fs.readFileSync(await downloaded('.png')),state=initial.variants[0].current,box=(kind==='node-edge'?state.elements:state.regions).find(o=>o.id===boxId),group=kind==='node-edge'?state.groups.find(g=>g.id===box.group_id):null;
  const pixel=await js(`(async()=>{const i=new Image();i.src=${JSON.stringify('data:image/png;base64,'+red.toString('base64'))};await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);return Array.from(ctx.getImageData(${(box.x+(group?.x??0)+10)*1462/731.125},${(box.y+(group?.y??0)+10)*2},1,1).data)})()`);assert.deepEqual(pixel,[255,65,54,255]);
  const id=initial.variants[0].current.labels[0].id;await select(id);await fill('#text','native undo');await click('h1');await shortcut('z');
  assert.equal(await js(`document.querySelector('[data-id="${id}"] text').textContent`),initial.variants[0].current.labels[0].text.replaceAll('\n',''));
  await shortcut('y');await click('#text');await call('Input.insertText',{text:' added'});const typed=await js(`document.querySelector('#text').value`);await shortcut('z');assert.notEqual(await js(`document.querySelector('#text').value`),typed);await shortcut('y');assert.equal(await js(`document.querySelector('#text').value`),typed);
  const dragId=kind==='node-edge'?'unrelated-stage-1':'unrelated-eddy-large';
  const start=await js(`(()=>{const n=document.querySelector('[data-id="${dragId}"] ${kind==='node-edge'?'rect':'path'}');${kind==='node-edge'?"const b=n.getBoundingClientRect();return {x:b.x+12,y:b.y+12}":"const p=n.getPointAtLength(n.getTotalLength()*.7),q=new DOMPoint(p.x,p.y).matrixTransform(n.getScreenCTM());return {x:q.x,y:q.y}"}})()`);
  await mouse('mousePressed',start,1);await mouse('mouseMoved',{x:start.x+11,y:start.y+9},1);await mouse('mouseReleased',{x:start.x+11,y:start.y+9},1);
  await click('#save');const d=JSON.parse(fs.readFileSync(await downloaded('.json')));validateDocument(d);
  const collection=kind==='node-edge'?'elements':'paths',old=initial.variants[0].current[collection].find(o=>o.id===dragId),next=d.variants[0].current[collection].find(o=>o.id===dragId);
  if(kind==='node-edge'){assert.notEqual(old.x,next.x);assert.equal(next.y>old.y,true);}else{const dx=next.points[0].x-old.points[0].x,dy=next.points[0].y-old.points[0].y;assert.ok(dx>1&&dy>1);next.points.forEach((p,i)=>{assert.ok(Math.abs(p.x-old.points[i].x-dx)<1e-8);assert.ok(Math.abs(p.y-old.points[i].y-dy)<1e-8);});}
  await click('#undo');await click('#redo');
  const controlId=kind==='node-edge'?'unrelated-return':'unrelated-spectrum';await select(controlId);const count=await js(`document.querySelectorAll('[data-control="${controlId}"]').length`);
  assert.equal(count,kind==='node-edge'?2:initial.variants[0].current.paths.find(p=>p.id===controlId).points.length);
  const pt=await js(`(()=>{const b=document.querySelector('[data-control="${controlId}"][data-point="1"]').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);await mouse('mousePressed',pt,1);await mouse('mouseMoved',{x:pt.x+8,y:pt.y+5},1);await mouse('mouseReleased',{x:pt.x+8,y:pt.y+5},1);
  // PNG must be bit-identical whether handles/selection are visible or not.
  await click('#png');const a=fs.readFileSync(await downloaded('.png'));await select(id);await click('#png');const c=fs.readFileSync(await downloaded('.png'));assert.deepEqual(a,c);assert.equal(c.readUInt32BE(16),1462);assert.equal(c.readUInt32BE(20),927);
  fs.writeFileSync(path.join(out,'control-free.png'),c);
 });
});
test('stale/read failures, PNG failures, IME and native save completion preserve work',async()=>{
 const out=evidenceDirectory('transactions-'),input=path.join(root,'examples/node-edge.json');
 await withBrowser({chrome,html,out},async b=>{
  const {js,call,load,fill,select,click,downloaded}=b;await load(input);await select('label-1');await fill('#text','KEEP');await fill('#y','-');
  const status=()=>js(`document.querySelector('#status').textContent`);
  await js(`window.originalText=File.prototype.text;File.prototype.text=function(){return new Promise((resolve,reject)=>{window.releaseRead=()=>window.originalText.call(this).then(resolve,reject)})}`);
  const setFile=async(selector,file)=>{const d=await call('DOM.getDocument'),i=await call('DOM.querySelector',{nodeId:d.root.nodeId,selector});await call('DOM.setFileInputFiles',{nodeId:i.nodeId,files:[file]});};
  await setFile('#open',input);await fill('#text','NEWER');await js('window.releaseRead()');await b.delay(50);assert.match(await status(),/採用しません/);assert.equal(await js(`document.querySelector('#text').value`),'NEWER');assert.equal(await js(`document.querySelector('#y').value`),'-');
  await js(`File.prototype.text=async()=>{throw Error('read denied')}`);await load(input);assert.match(await status(),/読込失敗/);assert.equal(await js(`document.querySelector('#y').value`),'-');
  await js('File.prototype.text=window.originalText;window.showSaveFilePicker=undefined');
  // PNG creation failures do not affect the document or history.
  await js(`window.originalDecode=Image.prototype.decode;Image.prototype.decode=async()=>{throw Error('decode denied')}`);await click('#png');await b.waitFor(`!document.querySelector('#png').disabled`);assert.match(await status(),/保存失敗/);await js('Image.prototype.decode=window.originalDecode');
  await js(`window.originalBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(cb){cb(null)}`);await click('#png');await b.waitFor(`!document.querySelector('#png').disabled`);assert.match(await status(),/保存失敗/);await js('HTMLCanvasElement.prototype.toBlob=window.originalBlob');
  await click('#save');const saved=JSON.parse(fs.readFileSync(await downloaded('.json')));assert.equal(saved.variants[0].current.labels[0].text,'NEWER');
  await fill('#y','22');await js(`window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async()=>{},close:async()=>{},abort:async()=>{}})})`);await click('#save');assert.match(await status(),/JSONを保存しました/);assert.doesNotMatch(await js(`document.querySelector('#dirty').textContent`),/未保存/);
  await fill('#x','24');await click('#png');assert.match(await js(`document.querySelector('#dirty').textContent`),/未保存/);
 });
});
for(const kind of ['node-edge','spectrum'])test(kind+': explicit migration UI saves separate data and keeps working document',async()=>{
 const out=evidenceDirectory('migration-');
 await withBrowser({chrome,html,out},async b=>{
  const {js,call,load,click,downloaded}=b;await load(path.join(root,'examples/'+kind+'.json'));await js('window.showSaveFilePicker=undefined');await click('#migration summary');
  await js(`document.querySelector('#legacy-kind').value=${JSON.stringify(kind)}`);
  for(const [selector,file]of [['#legacy',kind+'-needs-base.json'],['#legacy-base',kind+'.json']]){const d=await call('DOM.getDocument'),n=await call('DOM.querySelector',{nodeId:d.root.nodeId,selector});await call('DOM.setFileInputFiles',{nodeId:n.nodeId,files:[path.join(root,'tests/fixtures/legacy-v1/'+file)]});}
  await click('#migrate');const result=JSON.parse(fs.readFileSync(await downloaded('.json')));assert.equal(result.diagram_kind,kind);validateDocument(result);assert.match(await js(`document.querySelector('#migration-status').textContent`),/別名/);
  assert.equal(await js(`document.querySelector('#undo').disabled`),true);assert.match(await js(`document.querySelector('#identity').textContent`),new RegExp(kind));
  for(const originalName of [kind+'.json',(kind+'.json').toUpperCase()]){
   await js(`window.showSaveFilePicker=async()=>({name:${JSON.stringify(originalName)},createWritable:async()=>{throw Error('MUST NOT WRITE ORIGINAL')}})`);await click('#migrate');await b.waitFor(`!document.querySelector('#migrate').disabled`);assert.match(await js(`document.querySelector('#migration-status').textContent`),/原本とは別/,originalName);
  }
  await js('window.showSaveFilePicker=undefined');
  // Supplemental known HTML is data only, and is protected as an original too.
  const legacyBase=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/legacy-v1/'+kind+'.json')));
  const htmlName='元図-é-'+kind+'.html',htmlFile=path.join(out,htmlName);
  fs.writeFileSync(htmlFile,'<script>const INITIAL = '+JSON.stringify(legacyBase)+'; window.legacyExecuted=true;</script>');
  const doc=await call('DOM.getDocument'),baseInput=await call('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#legacy-base'});
  await call('DOM.setFileInputFiles',{nodeId:baseInput.nodeId,files:[htmlFile]});await click('#migrate');
  assert.deepEqual(JSON.parse(fs.readFileSync(await downloaded('.json'))).variants,result.variants);
  assert.equal(await js('window.legacyExecuted===undefined'),true);
  for(const originalName of [kind+'-needs-base.json',(kind+'-needs-base.json').toUpperCase(),htmlName,htmlName.toUpperCase().normalize('NFD')]){

   await js(`window.showSaveFilePicker=async()=>({name:${JSON.stringify(originalName)},createWritable:async()=>{throw Error('MUST NOT WRITE ORIGINAL')}})`);await click('#migrate');await b.waitFor(`!document.querySelector('#migrate').disabled`);assert.match(await js(`document.querySelector('#migration-status').textContent`),/原本とは別/,originalName);
  }
 });
});
