import {validateDocument,assertRestorable,clone,same} from './document.js';
export const fingerprint=doc=>doc?JSON.stringify([doc.figure_id,doc.base_revision,doc.selected_variant_id,doc.variants]):'';
export class Session {
 constructor(){this.doc=null;this.selected=null;this.undoStack=[];this.redoStack=[];this.generation=0;this.readSequence=0;this.saved='';this.field=null;}
 get dirty(){return !!this.doc&&fingerprint(this.doc)!==this.saved;}
 open(input){this.doc=validateDocument(input);this.selected=null;this.undoStack=[];this.redoStack=[];this.field=null;this.saved=fingerprint(this.doc);this.generation++;}
 readToken(){return {generation:this.generation,sequence:++this.readSequence};}
 isCurrent(token){return token.generation===this.generation&&token.sequence===this.readSequence;}
 edit(mutate,group=null){
  // Edits only mutate a draft; committed documents can also serve as history snapshots.
  const before=this.doc,draft=clone(before);mutate(draft);const next=validateDocument(draft);
  if(same(before,next))return false;
  const entry=this.undoStack.at(-1);
  if(!group||this.field?.key!==group||this.field?.entry!==entry||this.redoStack.length){
   this.undoStack.push({doc:before,selected:this.selected});this.field=group?{key:group,entry:this.undoStack.at(-1)}:null;
  }
  this.redoStack=[];delete next.snapshot;this.doc=next;this.generation++;
  // Returning to the starting value is a no-op in diagram history.
  if(this.field&&fingerprint(this.field.entry.doc)===fingerprint(next)){this.undoStack.pop();this.field=null;}
  return true;
 }
 endField(){this.field=null;}
 restore(input){const next=assertRestorable(this.doc,input);return this.edit(d=>{d.variants=clone(next.variants);d.selected_variant_id=next.selected_variant_id;});}
 switchVariant(id){return this.edit(d=>{d.selected_variant_id=id;});}
 reset(){return this.edit(d=>{const v=d.variants.find(v=>v.id===d.selected_variant_id);v.current=clone(v.initial);});}
 travel(from,to){if(!from.length)return false;const next=from.pop();to.push({doc:clone(this.doc),selected:this.selected});this.doc=next.doc;this.selected=next.selected;this.field=null;this.generation++;return true;}
 undo(){return this.travel(this.undoStack,this.redoStack);}
 redo(){return this.travel(this.redoStack,this.undoStack);}
}
