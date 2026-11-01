import {APP_VERSION,validateDocument,assertRestorable,categories,clone,same} from './document.js';
import {Session,fingerprint} from './session.js';
import {DEFAULTS,TYPST_COLORS,namedColor,cssColor,defaultColors} from './colors.js';
import {displayNumber,displayPoints,enteredNumber,enteredPoints} from './forms.js';
import {createSVG} from './render.js';
import {resizeGroup,deleteSelection,deletionScope} from './diagrams/node-edge.js';
import {translatePath} from './diagrams/spectrum.js';
import {pickSave,writeBlob,pngBlob,safeStem} from './io.js';
import {migrateLegacy,extractInitial} from './migrate.js';
const $=id=>document.getElementById(id),session=new Session();
const typeNames={elements:'図形',groups:'グループ',labels:'ラベル',connections:'接続',paths:'パス',regions:'領域'};
let epoch=0,documentSerial=0,saving=false,composing=false,drag=null;
const variant=(d=session.doc)=>d?.variants.find(v=>v.id===d.selected_variant_id);
const scene=(d=session.doc)=>variant(d)?.current;
const cats=()=>session.doc?categories(session.doc.diagram_kind):[];
const find=(id=session.selected,d=session.doc)=>d?categories(d.diagram_kind).flatMap(k=>scene(d)[k]).find(o=>o.id===id):null;
const kind=()=>cats().find(k=>scene()[k].some(o=>o.id===session.selected));
const invalid=()=>!!$('editor').querySelector('[aria-invalid="true"]');
const hasUnsaved=()=>session.dirty||invalid()||composing;
const status=message=>{$('status').textContent=message;};
function buttons(){
 const on=!!session.doc;
 for(const id of ['reset','variant'])$(id).disabled=!on||!!drag;
 for(const id of ['save','png'])$(id).disabled=!on||saving||!!drag;
 $('undo').disabled=!!drag||!session.undoStack.length;$('redo').disabled=!!drag||!session.redoStack.length;
 $('delete').disabled=!!drag||!find();$('migrate').disabled=saving;
 $('dirty').textContent=!on?'図を開いてください':hasUnsaved()?'未保存の変更あり':'開いたJSON／保存済みの状態';
}
function render(d=session.doc){
 if(!d)return;
 const svg=createSVG(d,session.selected,true),canvas=$('canvas');canvas.setAttribute('viewBox',svg.getAttribute('viewBox'));canvas.replaceChildren(...svg.childNodes);canvas.classList.remove('hidden');$('empty').classList.add('hidden');
}
function options(){
 if(!session.doc)return;
 $('variant').replaceChildren(...session.doc.variants.map(v=>new Option(v.title,v.id)));$('variant').value=session.doc.selected_variant_id;
 if(!find())session.selected=cats().flatMap(k=>scene()[k])[0]?.id??null;
 $('selection').replaceChildren(...cats().flatMap(k=>scene()[k].map(o=>new Option(typeNames[k]+' · '+(o.text?.split('\n')[0]||o.id),o.id))));
 $('selection').value=session.selected??'';$('selection').disabled=session.selected===null;
}
function colorForm(o,k){
 const base=variant().initial[k].find(x=>x.id===o.id);$('colors').replaceChildren();
 for(const key of Object.keys(DEFAULTS[k])){
  const group=document.createElement('div');group.className='color-field';
  const title=document.createElement('span');title.textContent=key==='fill'?(k==='labels'?'文字の色':'塗りの色'):'線の色';title.id=key+'-title';
  const picker=document.createElement('details');picker.className='color-picker';picker.id=key+'-picker';
  const summary=document.createElement('summary');summary.setAttribute('aria-labelledby',title.id+' '+key+'-name');
  const swatch=document.createElement('span');swatch.className='color-swatch';swatch.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.id=key+'-name';
  const menu=document.createElement('div');menu.className='color-options';menu.setAttribute('role','group');menu.setAttribute('aria-labelledby',title.id);
  const initial=cssColor(base[key]??defaultColors(k,session.doc.diagram_kind)[key]);
  const update=()=>{const value=find()?.[key];swatch.style.backgroundColor=cssColor(value??defaultColors(k,session.doc.diagram_kind)[key]);name.textContent=namedColor(value)?value:'初期色';for(const b of menu.children)b.setAttribute('aria-pressed',String(b.dataset.value===(namedColor(value)?value:'')));};
  for(const [value,label,color] of [['','初期色',initial],...Object.entries(TYPST_COLORS).map(([v,c])=>[v,v,c])]){
   const button=document.createElement('button');button.type='button';button.className='color-option';button.dataset.value=value;
   const chip=document.createElement('span');chip.className='color-swatch';chip.style.backgroundColor=color;chip.setAttribute('aria-hidden','true');button.append(chip,document.createTextNode(label));
   button.onclick=()=>{epoch++;session.endField();session.edit(d=>{const target=find(session.selected,d);if(value)target[key]=value;else if(Object.hasOwn(base,key))target[key]=base[key];else delete target[key];});render();buttons();update();picker.open=false;summary.focus();status('色を反映しました。');};menu.append(button);
  }
  picker.onkeydown=e=>{
   if(e.key==='Escape'){e.preventDefault();picker.open=false;summary.focus();return;}
   if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();picker.open=true;
   const bs=[...menu.children],i=bs.indexOf(document.activeElement);bs[e.key==='Home'?0:e.key==='End'?bs.length-1:e.key==='ArrowDown'?(i+1)%bs.length:i<0?bs.length-1:(i-1+bs.length)%bs.length].focus();
  };
  summary.append(swatch,name);picker.append(summary,menu);group.append(title,picker);$('colors').append(group);update();
 }
}
function form(){
 const o=find(),k=kind();$('editor').classList.toggle('hidden',!o);
 if(!o){$('delete-hint').textContent=session.doc?'要素がありません。リセットで復元できます。':'';return;}
 for(const control of $('editor').querySelectorAll('[aria-invalid]'))control.removeAttribute('aria-invalid');
 const removed=session.doc.diagram_kind==='node-edge'?[...deletionScope(scene(),o.id)]:[o.id];
 $('delete-hint').textContent='削除予定 '+removed.length+'件: '+removed.join(', ');
 for(const [id,on]of [['position',!['connections','paths'].includes(k)],['dimensions',['elements','groups','regions'].includes(k)],['label-fields',k==='labels'],['point-fields',['connections','paths'].includes(k)]]){
  $(id).classList.toggle('hidden',!on);for(const field of $(id).querySelectorAll('input,textarea'))field.disabled=!on;
 }
 for(const id of ['x','y','width','height','fontSize'])$(id).value=displayNumber(o[id]??1);
 $('text').value=o.text??'';$('points').value=displayPoints(o.points??o.waypoints??[]);$('point-title').textContent=k==='connections'?'経由点 (各行 X, Y)':'端点・全制御点 (各行 X, Y)';colorForm(o,k);
}
function refresh(){
 session.endField();options();render();form();buttons();
 if(session.doc){const d=session.doc,c=d.coordinate_system;$('identity').textContent=d.figure_id+' / '+d.base_revision+' / '+d.diagram_kind+' / 形式v2';$('coordinates').textContent=`左上原点、右向きX・下向きY。${c.width} × ${c.height} draft-unit。PNGは縦横2倍。`;}
}
function reflect(e){
 const control=e.target;if(!control.matches('input,textarea')||control.disabled)return;epoch++;
 if(e.isComposing||composing){buttons();return;}
 const id=control.id,k=kind();if(!find())return;
 try{
  session.edit(d=>{
   const o=find(session.selected,d);
   if(id==='text')o.text=control.value;
   else if(id==='points'){const key=k==='connections'?'waypoints':'points';o[key]=enteredPoints(control.value,o[key],k==='connections');}
   else if(k==='groups'&&['width','height'].includes(id)){
    const value=enteredNumber(control.value,o[id]);resizeGroup(scene(d),o.id,id==='width'?value:o.width,id==='height'?value:o.height);
   }else o[id]=enteredNumber(control.value,o[id]);
  },session.selected+':'+id);
  control.removeAttribute('aria-invalid');render();buttons();status(invalid()?'有効な変更を反映しました。入力途中の項目は図・JSONに未反映です。':'編集を反映しました。');
 }catch(error){control.setAttribute('aria-invalid','true');buttons();status('入力途中: '+error.message+'。図・JSONは最後の有効値を保持します。');}
}
$('editor').onsubmit=e=>e.preventDefault();$('editor').addEventListener('input',reflect);
$('editor').addEventListener('compositionstart',()=>{composing=true;epoch++;buttons();});
$('editor').addEventListener('compositionend',e=>{composing=false;reflect(e);});
$('editor').addEventListener('focusout',e=>{
 session.endField();const c=e.target,o=find();if(!o||composing||c.getAttribute('aria-invalid')==='true')return;
 if(['x','y','width','height','fontSize'].includes(c.id))c.value=displayNumber(o[c.id]??1);
 if(c.id==='points')c.value=displayPoints(o.points??o.waypoints??[]);
});
$('selection').onchange=()=>{epoch++;session.endField();session.selected=$('selection').value;render();form();buttons();};
$('variant').onchange=()=>{epoch++;session.switchVariant($('variant').value);refresh();};
for(const action of ['undo','redo','reset'])$(action).onclick=()=>{if(drag)return;epoch++;session[action]();refresh();status(action==='reset'?'選択案をリセットしました。':'履歴を反映しました。');};
$('delete').onclick=()=>{
 if(!find()||drag)return;epoch++;
 session.edit(d=>{if(d.diagram_kind==='node-edge')deleteSelection(scene(d),session.selected,variant(d).initial);else{const k=kind();scene(d)[k]=scene(d)[k].filter(o=>o.id!==session.selected);}});refresh();status('依存範囲を含めて削除しました。戻るで復元できます。');
};
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.isComposing||composing||!e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.target?.closest('input,textarea,select')||e.target?.isContentEditable)return;
 const id={z:'undo',y:'redo'}[e.key.toLowerCase()];if(id&&!$(id).disabled){e.preventDefault();$(id).click();}
});
document.addEventListener('pointerdown',e=>{for(const p of $('colors').querySelectorAll('details'))if(!p.contains(e.target))p.open=false;});
function point(e){const p=$('canvas').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('canvas').getScreenCTM().inverse());}
$('canvas').onpointerdown=e=>{
 const target=e.target.closest('[data-control],[data-id]');if(!target||e.button!==0)return;epoch++;session.endField();
 const id=target.dataset.control??target.dataset.id;session.selected=id;options();form();
 if(kind()==='connections'&&!target.dataset.control){render();return;}
 drag={id,index:target.dataset.point===undefined?null:Number(target.dataset.point),start:point(e),before:clone(session.doc),next:clone(session.doc)};render();buttons();$('canvas').setPointerCapture(e.pointerId);
};
$('canvas').onpointermove=e=>{
 if(!drag)return;const p=point(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;drag.next=clone(drag.before);const o=find(drag.id,drag.next);
 if(drag.index!==null)(o.points??o.waypoints)[drag.index]={x:p.x,y:p.y};else if(o.points)translatePath(o,dx,dy);else{o.x+=dx;o.y+=dy;}
 render(drag.next);
};
$('canvas').onpointerup=()=>{
 if(!drag)return;const next=drag.next;drag=null;
 try{session.edit(d=>{d.variants=next.variants;});status('移動を反映しました。');}catch(error){status('移動失敗: '+error.message);}refresh();
};
$('canvas').onpointercancel=()=>{if(drag){drag=null;refresh();}};
function allowDiscard(){
 if(!hasUnsaved())return Promise.resolve(true);
 return new Promise(resolve=>{
  const dialog=$('discard-dialog');dialog.showModal();
  const finish=value=>{dialog.close();$('keep').onclick=null;$('discard').onclick=null;dialog.oncancel=null;resolve(value);};
  $('keep').onclick=()=>finish(false);$('discard').onclick=()=>finish(true);dialog.oncancel=e=>{e.preventDefault();finish(false);};
 });
}
async function readInput(input,mode){
 const file=input.files[0];input.value='';if(!file)return;
 if(drag||$('discard-dialog').open){status('現在の操作を終えてから再試行してください。');return;}
 const token=session.readToken(),startEpoch=epoch;
 try{
  const candidate=validateDocument(JSON.parse(await file.text()));
  if(mode==='restore'){if(!session.doc)throw Error('先に図を開いてください');assertRestorable(session.doc,candidate);}
  if(!session.isCurrent(token)||epoch!==startEpoch){status('読込中に操作が進んだため採用しませんでした。再試行してください。');return;}
  const adopt=await allowDiscard();
  if(!adopt){status('読込をキャンセルしました。現在の編集をJSON保存できます。');return;}
  if(!session.isCurrent(token)||epoch!==startEpoch){status('古い読込結果は採用しませんでした。');return;}
  if(mode==='restore')session.restore(candidate);else{session.open(candidate);documentSerial++;}epoch++;refresh();status(mode==='restore'?'全案の保存状態を1履歴で復元しました。':'新しい図を開きました。');
 }catch(error){status('読込失敗: '+error.message+'。現在の編集と入力を保持しています。');}
}
$('open').onchange=()=>readInput($('open'),'open');$('restore').onchange=()=>readInput($('restore'),'restore');
async function save(type){
 if(saving||drag||!session.doc)return;
 if(composing){status('日本語入力の変換を確定してから保存してください。');return;}
 saving=true;buttons();status(type==='json'?'JSONを保存中…':'PNGを保存中…');const doc=validateDocument(session.doc),saved=fingerprint(doc),serial=documentSerial,unfinished=invalid();
 doc.snapshot={id:crypto.randomUUID(),exported_at:new Date().toISOString(),app_version:APP_VERSION};
 const name=safeStem(doc.figure_id)+'-'+safeStem(doc.base_revision)+'-'+(type==='json'?doc.snapshot.id:safeStem(doc.selected_variant_id))+'.'+type;
 try{
  const handle=await pickSave(name,type),blob=type==='json'?new Blob([JSON.stringify(doc,null,2)+'\n'],{type:'application/json'}):await pngBlob(doc);
  const result=await writeBlob(blob,name,handle);
  if(type==='json'&&result==='written'&&serial===documentSerial)session.saved=saved;
  status((result==='written'?(type==='json'?'JSONを保存しました。ファイルを手動でエージェントへ渡してください。':'PNGを保存しました。'):(type==='json'?'JSON':'PNG')+'ダウンロードを要求しました。保存結果を確認してください。')+(unfinished?' 入力途中の項目は含めず、最後の有効値を出力しました。':'')+(type==='json'&&fingerprint(session.doc)!==saved?' 保存開始後の追加編集は未保存です。':''));
 }catch(error){status(error.name==='AbortError'?'保存をキャンセルしました。編集は保持しています。':'保存失敗: '+error.message+'。編集は保持しています。');}
 finally{saving=false;buttons();}
}
$('save').onclick=()=>save('json');$('png').onclick=()=>save('png');
$('migrate').onclick=async()=>{
 if(saving)return;
 const old=$('legacy').files[0],base=$('legacy-base').files[0],kind=$('legacy-kind').value;
 if(!old||!kind){$('migration-status').textContent='旧JSONと系統を明示してください。';return;}
 saving=true;buttons();
 try{
  const input=JSON.parse(await old.text());let original;
  if(base){const text=await base.text();original=/^\s*\{/.test(text)?JSON.parse(text):extractInitial(text);}
  const result=migrateLegacy(input,kind,original),name=old.name.replace(/\.json$/i,'')+'-v2.json';
  const handle=await pickSave(name,'json');
  const protectedNames=[old.name,base?.name].filter(Boolean).map(name=>name.normalize('NFC').toLowerCase());
  if(handle&&protectedNames.includes(handle.name.normalize('NFC').toLowerCase()))throw Error('原本とは別のファイル名を指定してください');
  await writeBlob(new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'}),name,handle);
  $('migration-status').textContent=(handle?'移行JSONを別名で保存しました。':'移行JSONの別名ダウンロードを要求しました。保存を確認してください。')+'「新しい図を開く」で開いてください。';
 }catch(error){$('migration-status').textContent='移行失敗: '+error.message+'。原本と編集中の図は変更していません。';}
 finally{saving=false;buttons();}
};
window.addEventListener('beforeunload',e=>{if(hasUnsaved()){e.preventDefault();e.returnValue='';}});
document.body.dataset.ready='true';
