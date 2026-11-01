import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {withBrowser,evidenceDirectory} from './chrome.mjs';
const root=path.resolve(import.meta.dirname,'../..'),chrome=process.env.CHROME||'/usr/bin/google-chrome',html=path.join(root,'dist/schemock-v0.1.0.html');
for(const kind of ['node-edge','spectrum'])test(kind+': repeated human/agent local and structural handoffs preserve every unrelated variant, deletion and reset',async()=>{
 const dir=path.join(root,'examples/roundtrip/'+kind),file=n=>path.join(dir,n+'.json'),read=n=>JSON.parse(fs.readFileSync(file(n))),out=evidenceDirectory('roundtrip-');
 await withBrowser({chrome,html,out},async b=>{
  const {js,click,load,select,fill,variant,downloaded}=b;await load(file('00-proposals'));await js('window.showSaveFilePicker=undefined');
  const check=async name=>{await click('#save');const saved=JSON.parse(fs.readFileSync(await downloaded('.json')));assert.deepEqual(saved.variants,read(name).variants,name);assert.equal(saved.base_revision,read(name).base_revision);fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(saved,null,2));};
  if(kind==='node-edge'){
   await select('process');await fill('#x','42.123456789');await fill('#width','666.666666667');await select('unused');await click('#delete');await select('input-text');await fill('#text','候補 α\nInput');await click('#fill-picker summary');await click('#fill-picker [data-value="green"]');
  }else{
   await select('guide');await click('#delete');await select('profile');const pts=read('00-proposals').variants[0].current.paths[0].points;pts[1].x=165.123456789;await fill('#points',pts.map(p=>p.x+', '+p.y).join('\n'));await select('profile-text');await fill('#text','定性形状\nProfile');await click('#fill-picker summary');await click('#fill-picker [data-value="blue"]');
  }
  await variant('b');await select(kind==='node-edge'?'input-text':'profile-text');await fill('#text','別案を保持\nKeep B');await variant('a');await check('01-human');
  await load(file('02-agent-local'),'#restore');await click('#discard');await check('02-agent-local');await click('#undo');await check('01-human');await click('#redo');
  if(kind==='node-edge'){await select('process');await fill('#y','63.987654321');}else{await select('band');await fill('#width','295.123456789');}await check('03-human');
  // An outdated handoff must not silently overwrite the post-handoff human edit.
  await load(file('02-agent-local'),'#restore');await click('#keep');await check('03-human');
  await load(file('04-agent-structure'),'#restore');assert.match(await js(`document.querySelector('#status').textContent`),/読込失敗/);await check('03-human');
  await load(file('04-agent-structure'));await click('#discard');assert.equal(await js(`document.querySelector('#undo').disabled`),true);
  if(kind==='node-edge'){await select('refine-text');await fill('#text','精査済\nRefine');}else{await select('transfer');const pts=read('04-agent-structure').variants[0].current.paths.at(-1).points;pts[2].y=280.123456789;await fill('#points',pts.map(p=>p.x+', '+p.y).join('\n'));}
  await check('05-resumed');await click('#png');fs.copyFileSync(await downloaded('.png'),path.join(out,'final.png'));
 });
});
