import {validateDocument,clone,same,fail} from './document.js';
// Only decode JSON. Never evaluate or insert the supplied HTML into a DOM.
export function extractInitial(text){
 const match=/\bconst\s+INITIAL\s*=\s*/.exec(text);if(!match)fail('$','known INITIAL declaration not found');
 const start=match.index+match[0].length;if(text[start]!=='{')fail('$','INITIAL must be a JSON object literal');
 let depth=0,quoted=false,escaped=false;
 for(let i=start;i<text.length;i++){
  const c=text[i];
  if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(text.slice(start,i+1));
 }
 fail('$','incomplete INITIAL JSON');
}
export function migrateLegacy(input,kind,original){
 if(!['node-edge','spectrum'].includes(kind))fail('$','explicit legacy diagram kind required');
 if(!input||input.schema_version!==1||input.format!==undefined)fail('$','expected legacy schema_version 1 without format');
 const d=clone(input),base=original===undefined?null:clone(original);
 if(!Array.isArray(d.variants)||!d.variants.length)fail("$.variants","complete variants required");
 if(base&&(!Array.isArray(base.variants)||!base.variants.length))fail("$.variants","complete original variants required");
 if(base){
  for(const key of ['schema_version','figure_id','base_revision','coordinate_system'])if(!same(d[key],base[key]))fail('$.'+key,'original identity mismatch');
  if(!same(d.variants.map(v=>v.id).sort(),base.variants.map(v=>v.id).sort()))fail('$.variants','original variant set mismatch');
 }
 for(const v of d.variants){
  const b=base?.variants.find(x=>x.id===v.id);
  if(b&&v.title!==b.title)fail('$.variants.'+v.id+'.title','original variant title mismatch');
  if(v.initial===undefined){if(!b?.initial)fail('$.variants.'+v.id+'.initial','complete original JSON/known HTML INITIAL required');v.initial=clone(b.initial);}
  else if(b&&!same(v.initial,b.initial))fail('$.variants.'+v.id+'.initial','original reset state mismatch');
  if(v.current===undefined)fail('$.variants.'+v.id+'.current','current state required; do not infer edits');
 }
 if(d.snapshot){
  // These are the only fields used by both original exporters.
  if(Object.keys(d.snapshot).some(k=>!['id','exported_at'].includes(k)))fail('$.snapshot','unsupported legacy snapshot field');
  d.snapshot.app_version='legacy-v1';
 }
 d.format='schemock';d.schema_version=2;d.diagram_kind=kind;
 return validateDocument(d);
}
