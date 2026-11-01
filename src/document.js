import {safeColor,namedColor,DEFAULTS} from './colors.js';
export const APP_VERSION='0.1.0';
export const clone=x=>structuredClone(x);
// JSON value equality: object key order is irrelevant; array order is significant.
export function same(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a);
 return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
}
export const categories=kind=>kind==='node-edge'?['elements','groups','labels','connections']:['paths','regions','labels'];
export const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e7;
const positive=n=>finite(n)&&n>0;
export function fail(path,message){throw Error(path+': '+message);}
function object(o,path,required,optional=[]){
 if(!o||typeof o!=='object'||Array.isArray(o))fail(path,'object required');
 for(const key of required)if(!Object.hasOwn(o,key))fail(path+'.'+key,'required');
 for(const key of Object.keys(o))if(![...required,...optional].includes(key))fail(path+'.'+key,'unsupported field');
}
const string=(s,p)=>{if(typeof s!=='string'||!s.length||s.length>10000)fail(p,'nonempty string up to 10000 characters required');};
const number=(n,p,pos=false)=>{if(!(pos?positive(n):finite(n)))fail(p,pos?'positive bounded number required':'finite number with absolute value < 1e7 required');};
function points(ps,p,min=0,max=1000){
 if(!Array.isArray(ps)||ps.length<min||ps.length>max)fail(p,'invalid point count');
 ps.forEach((v,i)=>{object(v,p+'['+i+']',['x','y']);number(v.x,p+'['+i+'].x');number(v.y,p+'['+i+'].y');});
}
export function retainedConstraints(scene,base){return base.constraints.filter(c=>c.ids.every(id=>scene.elements.some(e=>e.id===id))&&(c.kind!=='inside'||scene.groups.some(g=>g.id===c.group_id)));}
function validateScene(s,kind,p,base){
 const cats=categories(kind);object(s,p,kind==='node-edge'?[...cats,'constraints']:cats);
 const ids=new Set();
 for(const k of [...cats,...(kind==='node-edge'?['constraints']:[])]){
  if(!Array.isArray(s[k]))fail(p+'.'+k,'array required');
  for(const [i,o] of s[k].entries()){
   const at=p+'.'+k+'['+i+']';
   const required={elements:['id','group_id','x','y','width','height'],groups:['id','x','y','width','height'],labels:['id',...(kind==='node-edge'?['owner_id']:[]),'x','y','text','fontSize'],connections:['id','from','to','waypoints','directed'],paths:['id','type','points','width','directed','dash'],regions:['id','x','y','width','height'],constraints:['id','kind','ids']}[k];
   object(o,at,required,k==='constraints'?['group_id']:Object.keys(DEFAULTS[k]));string(o.id,at+'.id');
   if(ids.has(o.id))fail(at+'.id','duplicate ID');ids.add(o.id);
   const b=base?.[k].find(x=>x.id===o.id);if(base&&!b)fail(at+'.id','not in initial');
   if(k==='constraints'){
    if(!['align-x','align-y','equal-size','equal-gap','inside'].includes(o.kind))fail(at+'.kind','unsupported constraint');
    if(!Array.isArray(o.ids)||!o.ids.length||new Set(o.ids).size!==o.ids.length||o.ids.some(id=>!s.elements.some(e=>e.id===id)))fail(at+'.ids','invalid element references');
    if(o.kind==='inside'){if(!s.groups.some(g=>g.id===o.group_id))fail(at+'.group_id','invalid group reference');}else if(Object.hasOwn(o,'group_id'))fail(at+'.group_id','only inside permits group_id');
    continue;
   }
   for(const color of Object.keys(DEFAULTS[k]))if(Object.hasOwn(o,color)){
    if(!safeColor(o[color]))fail(at+'.'+color,'safe hex or Typst color name required');
    if(base&&o[color]!==b[color]&&!namedColor(o[color]))fail(at+'.'+color,'only named color or initial color allowed');
   }
   // An omitted color may only be restored if it was also absent initially.
   if(base)for(const color of Object.keys(DEFAULTS[k]))if(!Object.hasOwn(o,color)&&Object.hasOwn(b,color))fail(at+'.'+color,'initial color cannot be dropped');
   if(!['connections','paths'].includes(k)){number(o.x,at+'.x');number(o.y,at+'.y');}
   if(['elements','groups','regions'].includes(k)){number(o.width,at+'.width',true);number(o.height,at+'.height',true);}
   if(k==='elements'){
    if(o.group_id!==null&&!s.groups.some(g=>g.id===o.group_id))fail(at+'.group_id','missing group');
    if(base&&o.group_id!==b.group_id)fail(at+'.group_id','structure differs from initial');
   }
   if(k==='labels'){
    if(typeof o.text!=='string'||o.text.length>10000)fail(at+'.text','text up to 10000 characters required');number(o.fontSize,at+'.fontSize',true);
    if(kind==='node-edge'){
     if(o.owner_id!==null&&![...s.elements,...s.groups].some(x=>x.id===o.owner_id))fail(at+'.owner_id','missing owner');
     if(base&&o.owner_id!==b.owner_id)fail(at+'.owner_id','structure differs from initial');
    }
   }
   if(k==='connections'){
    for(const end of ['from','to']){
     object(o[end],at+'.'+end,['element_id','anchor']);
     if(!s.elements.some(e=>e.id===o[end].element_id)||!['north','south','east','west','center'].includes(o[end].anchor))fail(at+'.'+end,'invalid endpoint');
    }
    if(typeof o.directed!=='boolean')fail(at+'.directed','boolean required');points(o.waypoints,at+'.waypoints');
    if(base&&(!same(o.from,b.from)||!same(o.to,b.to)||o.directed!==b.directed))fail(at,'structure differs from initial');
   }
   if(k==='paths'){
    if(!['cubic','polyline'].includes(o.type))fail(at+'.type','unsupported path');number(o.width,at+'.width',true);
    if(typeof o.directed!=='boolean'||typeof o.dash!=='boolean')fail(at,'boolean direction/dash required');
    points(o.points,at+'.points',o.type==='cubic'?4:2);
    if(o.type==='cubic'&&(o.points.length-1)%3!==0)fail(at+'.points','cubic needs start plus groups of three');
    if(base&&(!same([o.type,o.width,o.directed,o.dash],[b.type,b.width,b.directed,b.dash])||o.points.length!==b.points.length))fail(at,'structure differs from initial');
   }
  }
 }
 if(kind==='node-edge'&&base&&!same(s.constraints,retainedConstraints(s,base)))fail(p+'.constraints','expected exactly initial constraints with surviving references');
}
export function validateDocument(input){
 object(input,'$',['format','schema_version','diagram_kind','figure_id','base_revision','coordinate_system','selected_variant_id','variants'],['snapshot']);
 if(input.format!=='schemock'||input.schema_version!==2)fail('$','unsupported format/schema_version');
 if(!['node-edge','spectrum'].includes(input.diagram_kind))fail('$.diagram_kind','unsupported kind');
 for(const k of ['figure_id','base_revision','selected_variant_id'])string(input[k],'$.'+k);
 const c=input.coordinate_system;object(c,'$.coordinate_system',['origin','x_axis','y_axis','width','height','unit']);
 if(c.origin!=='top-left'||c.x_axis!=='right'||c.y_axis!=='down'||c.unit!=='draft-unit')fail('$.coordinate_system','unsupported coordinates');
 number(c.width,'$.coordinate_system.width',true);number(c.height,'$.coordinate_system.height',true);
 if(!Array.isArray(input.variants)||!input.variants.length)fail('$.variants','nonempty array required');
 const ids=new Set();
 for(const [i,v] of input.variants.entries()){
  const p='$.variants['+i+']';object(v,p,['id','title','initial','current']);string(v.id,p+'.id');string(v.title,p+'.title');
  if(ids.has(v.id))fail(p+'.id','duplicate variant');ids.add(v.id);
  validateScene(v.initial,input.diagram_kind,p+'.initial');validateScene(v.current,input.diagram_kind,p+'.current',v.initial);
 }
 if(!ids.has(input.selected_variant_id))fail('$.selected_variant_id','unknown variant');
 if(Object.hasOwn(input,'snapshot')){
  object(input.snapshot,'$.snapshot',['id','exported_at','app_version']);
  for(const k of ['id','exported_at','app_version'])string(input.snapshot[k],'$.snapshot.'+k);
  if(!Number.isFinite(Date.parse(input.snapshot.exported_at)))fail('$.snapshot.exported_at','invalid timestamp');
 }
 return clone(input);
}
export function assertRestorable(active,input){
 const candidate=validateDocument(input);
 for(const key of ['format','schema_version','diagram_kind','figure_id','base_revision','coordinate_system'])if(!same(active[key],candidate[key]))fail('$.'+key,'restoration identity mismatch; open as a new document instead');
 if(!same(active.variants.map(v=>v.id).sort(),candidate.variants.map(v=>v.id).sort()))fail('$.variants','variant set mismatch');
 for(const v of active.variants){const next=candidate.variants.find(n=>n.id===v.id);if(!same(v.initial,next.initial)||v.title!==next.title)fail('$.variants.'+v.id+'.initial','reset state/title mismatch');}
 return candidate;
}
