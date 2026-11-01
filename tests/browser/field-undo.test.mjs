import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {withBrowser,evidenceDirectory} from './chrome.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const chrome=process.env.CHROME||'/usr/bin/google-chrome';
const html=path.join(root,'dist/schemock-v0.1.0.html');

test('numeric and point fields retain native undo after blur without rounding saved precision',async()=>{
 const input=path.join(root,'examples/node-edge.json');
 const original=JSON.parse(fs.readFileSync(input));
 const active=original.variants.find(v=>v.id===original.selected_variant_id);
 const label=active.current.labels[0],route=active.current.connections.find(c=>c.waypoints.length);
 const out=evidenceDirectory('field-undo-');
 await withBrowser({chrome,html,out},async b=>{
  const {js,load,select,fill,click,shortcut,downloaded}=b;
  await load(input);await js('window.showSaveFilePicker=undefined');await select(label.id);
  const initialX=await js('document.querySelector("#x").value');
  await fill('#x','123.456789');await click('h1');await click('#save');
  const saved=JSON.parse(fs.readFileSync(await downloaded('.json')));
  assert.equal(saved.variants.find(v=>v.id===active.id).current.labels.find(l=>l.id===label.id).x,123.456789);
  await click('#x');await shortcut('z');
  assert.equal(await js('document.querySelector("#x").value'),initialX,'blur must not destroy the numeric field’s native undo');
  await shortcut('y');
  assert.equal(await js('document.querySelector("#x").value'),'123.456789');
  await select(route.id);
  const initialPoints=await js('document.querySelector("#points").value');
  const entered=route.waypoints.map((p,i)=>`${i===0?'111.123456789':p.x}, ${p.y}`).join('\n');
  await fill('#points',entered);await click('h1');await click('#save');
  const routed=JSON.parse(fs.readFileSync(await downloaded('.json')));
  const actual=routed.variants.find(v=>v.id===active.id).current.connections.find(c=>c.id===route.id);
  assert.equal(actual.waypoints[0].x,111.123456789);
  assert.equal(actual.waypoints[0].y,route.waypoints[0].y);
  assert.deepEqual(actual.waypoints.slice(1),route.waypoints.slice(1));
  await click('#points');await shortcut('z');
  assert.equal(await js('document.querySelector("#points").value'),initialPoints,'blur must not destroy the point field’s native undo');
  await shortcut('y');
  assert.equal(await js('document.querySelector("#points").value'),entered);
 });
});
