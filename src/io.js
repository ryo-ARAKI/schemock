import {createSVG} from './render.js';
export function safeStem(value){
 const clean=String(value).replace(/[\/\\<>:"|?*\x00-\x1f]/g,'_').replace(/^[. ]+|[. ]+$/g,'');
 let result='',bytes=0;const encoder=new TextEncoder();
 for(const character of clean){const size=encoder.encode(character).length;if(bytes+size>64)break;result+=character;bytes+=size;}
 return result||'diagram';
}
export function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);
 try{a.click();}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
export async function pngBlob(doc){
 const svg=createSVG(doc),{width,height}=doc.coordinate_system;
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
 try{
  const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=Math.round(width*2);canvas.height=Math.round(height*2);
  if(canvas.width<1||canvas.height<1)throw Error('PNG寸法が小さすぎます');
  const context=canvas.getContext('2d');if(!context)throw Error('PNG canvas作成に失敗');context.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('PNG生成に失敗');return blob;
 }finally{URL.revokeObjectURL(url);}
}
export async function pickSave(name,type){
 if(!window.showSaveFilePicker)return null;
 return window.showSaveFilePicker({suggestedName:name,types:[{description:type==='json'?'図JSON':'PNG画像',accept:type==='json'?{'application/json':['.json']}:{'image/png':['.png']}}]});
}
export async function writeBlob(blob,name,handle){
 if(!handle){download(blob,name);return 'requested';}
 const writer=await handle.createWritable();
 try{await writer.write(blob);await writer.close();return 'written';}
 catch(error){try{await writer.abort();}catch{}throw error;}
}
