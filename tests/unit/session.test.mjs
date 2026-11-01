import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Session, fingerprint} from '../../src/session.js';
import {deleteSelection,resizeGroup} from '../../src/diagrams/node-edge.js';
import {enteredPoints,displayPoints} from '../../src/forms.js';
const example=k=>JSON.parse(fs.readFileSync(new URL('../../examples/'+k+'.json',import.meta.url)));
test('continuous edits, noops, chronological variants, undo/redo and restoration',()=>{
 const s=new Session();s.open(example('node-edge'));const before=structuredClone(s.doc);
 s.edit(d=>d.variants[0].current.labels[0].text='a','field');s.edit(d=>d.variants[0].current.labels[0].text='ab','field');
 assert.equal(s.undoStack.length,1);s.undo();assert.deepEqual(s.doc,before);s.redo();
 s.edit(()=>{});assert.equal(s.undoStack.length,1);s.undo();s.edit(()=>{});assert.equal(s.redoStack.length,1);
 s.redo();s.switchVariant(s.doc.variants[1].id);s.undo();assert.equal(s.doc.selected_variant_id,before.selected_variant_id);
 const agent=structuredClone(s.doc);agent.variants[0].current.labels[0].text='agent';const old=fingerprint(s.doc);s.restore(agent);s.undo();assert.equal(fingerprint(s.doc),old);
 const token=s.readToken();s.edit(d=>d.variants[0].current.labels[0].x++);assert.equal(s.isCurrent(token),false);
});
test('dependency deletion and group affine scaling keep reset and independent labels',()=>{
 const s=new Session();s.open(example('node-edge'));const initial=structuredClone(s.doc.variants[0].initial);
 s.edit(d=>resizeGroup(d.variants[0].current,'cycle',1400,620));const c=s.doc.variants[0].current;
 assert.equal(c.elements[0].x,60);assert.equal(c.labels[0].fontSize,30.9);assert.equal(c.labels[0].x,180);
 s.edit(d=>deleteSelection(d.variants[0].current,'cycle',initial));assert.equal(s.doc.variants[0].current.connections.length,0);assert.ok(s.doc.variants[0].current.labels.some(l=>l.id==='edge-label'));
 assert.deepEqual(s.doc.variants[0].initial,initial);s.reset();assert.deepEqual(s.doc.variants[0].current,initial);
});
test('point editing preserves unchanged displayed components at full precision',()=>{
 const p=[{x:1.123456789,y:4.987654321},{x:7.123456789,y:8.123456789}];
 assert.deepEqual(enteredPoints(displayPoints(p).replace('4.99','6'),p,false),[{x:p[0].x,y:6},p[1]]);
 assert.throws(()=>enteredPoints('1,',p,false));
});
test('arbitrary IDs produce bounded filenames without changing document identity',async()=>{
 const {safeStem}=await import('../../src/io.js');assert.equal(safeStem('../a/b:<x>\u0000'), '_a_b__x__');assert.equal(safeStem('...'),'diagram');assert.ok(safeStem('a'.repeat(10000)).length<=100);
});
test('output filename components stay bounded in UTF-8 for accepted Unicode IDs',async()=>{
 const {safeStem}=await import('../../src/io.js');assert.ok(Buffer.byteLength(safeStem('図'.repeat(10000)))<=64);
});
