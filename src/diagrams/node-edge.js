import {retainedConstraints} from '../document.js';
export function worldElement(scene,id){const e=scene.elements.find(o=>o.id===id),g=scene.groups.find(o=>o.id===e.group_id);return {...e,x:e.x+(g?.x??0),y:e.y+(g?.y??0)};}
export function anchor(scene,a){const e=worldElement(scene,a.element_id),f={north:[.5,0],south:[.5,1],east:[1,.5],west:[0,.5],center:[.5,.5]}[a.anchor];return {x:e.x+f[0]*e.width,y:e.y+f[1]*e.height};}
export function labelPosition(scene,l){if(l.owner_id===null)return l;const e=scene.elements.find(e=>e.id===l.owner_id),p=e?worldElement(scene,e.id):scene.groups.find(g=>g.id===l.owner_id);return {x:p.x+l.x,y:p.y+l.y};}
export function resizeGroup(scene,id,width,height){
 const g=scene.groups.find(g=>g.id===id),sx=width/g.width,sy=height/g.height;
 for(const e of scene.elements.filter(e=>e.group_id===id)){
  e.x*=sx;e.y*=sy;e.width*=sx;e.height*=sy;
  for(const l of scene.labels.filter(l=>l.owner_id===e.id)){l.x*=sx;l.y*=sy;}
 }
 for(const l of scene.labels.filter(l=>l.owner_id===id)){l.x*=sx;l.y*=sy;}g.width=width;g.height=height;
}
export function deletionScope(scene,id){
 const removed=new Set([id]);
 for(const e of scene.elements)if(removed.has(e.group_id))removed.add(e.id);
 for(const l of scene.labels)if(removed.has(l.owner_id))removed.add(l.id);
 for(const c of scene.connections)if(removed.has(c.from.element_id)||removed.has(c.to.element_id))removed.add(c.id);
 return removed;
}
export function deleteSelection(scene,id,initial){
 const removed=deletionScope(scene,id);
 for(const k of ['elements','groups','labels','connections'])scene[k]=scene[k].filter(o=>!removed.has(o.id));
 scene.constraints=retainedConstraints(scene,initial);
}
