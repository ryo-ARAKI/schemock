import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {withBrowser,evidenceDirectory} from './chrome.mjs';
const root=path.resolve(import.meta.dirname,'../..'),chrome=process.env.CHROME||'/usr/bin/google-chrome';
const html=path.join(root,'dist/schemock-v0.1.0.html');
const read=p=>JSON.parse(fs.readFileSync(p));
for(const kind of ['node-edge','spectrum'])test(kind+': public UI editing, offline downloads, restore, empty scene and failures',async()=>{
 const out=evidenceDirectory(kind+'-');fs.copyFileSync(html,path.join(out,'app.html'));
 const source=path.join(root,'examples/'+kind+'.json');fs.copyFileSync(source,path.join(out,'diagram.json'));const initial=read(source);
 await withBrowser({chrome,html:path.join(out,'app.html'),out},async b=>{
  const {js,call,click,fill,select,variant,load,downloaded,events}=b;
  const status=()=>js(`document.querySelector('#status').textContent`);
  const value=id=>js(`document.querySelector(${JSON.stringify('#'+id)}).value`);
  await js('window.showSaveFilePicker=undefined');await load(path.join(out,'diagram.json'));assert.match(await status(),/新しい図/);
  const exported=async()=>{await click('#save');try{return read(await downloaded('.json'));}catch(e){throw Error(e.message+'; status='+await status()+'; disabled='+await js(`document.querySelector('#save').disabled`));}};
  const id=initial.variants[0].initial.labels[0].id;
  await select(id);await fill('#text','日本語 <script> $&\n第二行');assert.equal(await js(`document.querySelector('[data-id="${id}"] text').textContent`),'日本語 <script> $&第二行');
  assert.equal(await js(`document.querySelectorAll('svg script').length`),0);
  await fill('#x','12.123456789');await fill('#y','-');assert.equal(await value('y'),'-');assert.equal(await js(`document.querySelector('#y').getAttribute('aria-invalid')`),'true');
  const edited=await exported();assert.equal(edited.variants[0].current.labels[0].x,12.123456789);assert.equal(edited.variants[0].current.labels[0].y,initial.variants[0].current.labels[0].y);assert.match(await status(),/入力途中/);
  const bad=path.join(out,'invalid.json');fs.writeFileSync(bad,'{}');await load(bad);assert.match(await status(),/読込失敗/);assert.equal(await value('y'),'-');
  await fill('#y','14.987654321');await click('#fill-picker summary');await click('#fill-picker [data-value="green"]');
  assert.equal(await js(`document.querySelector('[data-id="${id}"] text').getAttribute('fill')`),'#2ecc40');
  await click('#fill-picker summary');await click('#fill-picker [data-value=""]');const exact=await exported();
  assert.equal(Object.hasOwn(exact.variants[0].current.labels[0],'fill'),false);
  await load(source);assert.equal(await js(`document.querySelector('#discard-dialog').open`),true);await click('#keep');assert.equal(await value('text'),'日本語 <script> $&\n第二行');
  // Restore is a single undoable operation and rejects another structure atomically.
  const agent=structuredClone(exact);agent.variants[0].current.labels[0].text='エージェント局所調整';const agentFile=path.join(out,'agent.json');fs.writeFileSync(agentFile,JSON.stringify(agent));
  await load(agentFile,'#restore');await click('#discard');assert.match(await status(),/復元/);await select(id);assert.equal(await value('text'),'エージェント局所調整');
  await click('#undo');await select(id);assert.equal(await value('text'),'日本語 <script> $&\n第二行');await click('#redo');
  agent.base_revision+='-new';fs.writeFileSync(agentFile,JSON.stringify(agent));await load(agentFile,'#restore');assert.match(await status(),/読込失敗/);
  // Actual composition events: provisional text is retained and final text is reflected.
  await select(id);await js(`(()=>{const t=document.querySelector('#text');t.focus();t.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));t.value='未確定';t.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));})()`);
  await click('#save');assert.match(await status(),/変換を確定/);
  await js(`(()=>{const t=document.querySelector('#text');t.value=${JSON.stringify('変換確定\n行')};t.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));})()`);
  assert.equal((await exported()).variants[0].current.labels[0].text,'変換確定\n行');
  // Full control points and dimensions can be edited through the same forms.
  if(kind==='node-edge'){
   await select('cycle');await fill('#width','1400');await fill('#height','620');const d=await exported();assert.equal(d.variants[0].current.elements[0].x,60);assert.equal(d.variants[0].current.labels[0].fontSize,30.9);
   await select('return');await fill('#points','610.123456789, 400.987654321\n170.123456789, 400.123456789');await click('h1');
  }else{
   await select('spectrum');const ps=initial.variants[0].current.paths.find(p=>p.id==='spectrum').points;
   const text=ps.map((p,i)=>(i?String(Number(p.x.toFixed(2))):'123.123456789')+', '+String(Number(p.y.toFixed(2)))).join('\n');await fill('#points',text);
   const next=await exported();const changed=next.variants[0].current.paths.find(p=>p.id==='spectrum');assert.equal(changed.points[0].x,123.123456789);assert.deepEqual(changed.points.slice(1),ps.slice(1));
  }
  // Native write failures and cancel never mark the diagram saved. Close is part of success.
  for(const failure of ['picker','create','write','close','cancel']){
   await js(`window.showSaveFilePicker=async()=>{${failure==='picker'?"throw Error('picker')":failure==='cancel'?"throw new DOMException('cancel','AbortError')":`return {createWritable:async()=>{${failure==='create'?"throw Error('create')":`return {write:async()=>{${failure==='write'?"throw Error('write')":''}},close:async()=>{${failure==='close'?"throw Error('close')":''}},abort:async()=>{}}`}}}`}}`);
   await click('#save');assert.match(await status(),failure==='cancel'?/キャンセル/:/保存失敗/);assert.match(await js(`document.querySelector('#dirty').textContent`),/未保存/);
  }
  await js(`window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async()=>{},close:()=>new Promise(r=>window.finishSave=r),abort:async()=>{}})})`);
  await click('#save');assert.equal(await js(`document.querySelector('#save').disabled`),true);await select(id);await fill('#x','42.123456789');await js('window.finishSave()');await b.delay(60);assert.match(await js(`document.querySelector('#dirty').textContent`),/未保存/);
  await js('window.showSaveFilePicker=undefined');const final=await exported();
  await click('#png');const png=await downloaded('.png'),bytes=fs.readFileSync(png);assert.equal(bytes.readUInt32BE(16),1920);assert.equal(bytes.readUInt32BE(20),1080);
  fs.copyFileSync(png,path.join(out,'edited.png'));
  // Save/new/open round trip uses actual downloaded bytes, no internal document access.
  await load(source);await click('#discard');const savedFile=path.join(out,'roundtrip.json');fs.writeFileSync(savedFile,JSON.stringify(final));await load(savedFile);assert.equal(await js(`document.querySelector('#undo').disabled`),true);
  assert.deepEqual((await exported()).variants,final.variants);
  await variant(initial.variants[1].id);await select(initial.variants[1].initial.labels[0].id);await fill('#text','別案の編集');await variant(initial.variants[0].id);
  await click('#reset');const reset=await exported();assert.deepEqual(reset.variants[0].current,reset.variants[0].initial);assert.equal(reset.variants[1].current.labels[0].text,'別案の編集');
  if(kind==='node-edge'){await select('cycle');assert.match(await js(`document.querySelector('#delete-hint').textContent`),/flow-12/);await click('#delete');const d=await exported();assert.equal(d.variants[0].current.connections.length,0);assert.ok(d.variants[0].current.labels.some(l=>l.id==='edge-label'));}
  // Separate burst: Chrome limits repeated fallback downloads from one frame.
  const emptySeed=await exported(),emptyFile=path.join(out,'empty-seed.json');fs.writeFileSync(emptyFile,JSON.stringify(emptySeed));await b.open(path.join(out,'app.html'));await js('window.showSaveFilePicker=undefined');await load(emptyFile);
  while(await js(`!document.querySelector('#selection').disabled`))await click('#delete');
  assert.equal(await js(`document.querySelector('#delete').disabled`),true);await click('#png');await downloaded('.png');assert.ok((await exported()).variants[0].initial.labels.length);
  await click('#undo');assert.equal(await js(`document.querySelector('#selection').disabled`),false);await click('#reset');
  fs.writeFileSync(path.join(out,'wide.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await call('Emulation.setDeviceMetricsOverride',{width:560,height:1000,deviceScaleFactor:1,mobile:false});assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true);
  fs.writeFileSync(path.join(out,'narrow.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
  const remote=events.filter(e=>e.method==='Network.requestWillBeSent'&&/^https?:/.test(e.params.request.url));assert.equal(remote.length,0);
  fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({browser:await call('Browser.getVersion',{},null),offline:true,remoteRequests:remote,checks:'public UI, real JSON/PNG downloads and reload, unsafe labels, precision, IME events, restore, save failures, native write stub concurrency, dependencies, empty/reset, wide/narrow'},null,2));
 });
});
