import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';import {validateDocument} from '../src/document.js';import {withBrowser} from '../tests/browser/chrome.mjs';
export async function preview(input,output,artifactHtml){
 const d=validateDocument(JSON.parse(fs.readFileSync(input,'utf8')));fs.mkdirSync(output,{recursive:true});
 const chrome=process.env.CHROME||execFileSync('sh',['-c','command -v google-chrome || command -v chromium || command -v chromium-browser'],{encoding:'utf8'}).trim();
 if(!chrome)throw Error('Desktop Chrome required; previews cannot be skipped');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'schemock-preview-')),html=artifactHtml??path.resolve(import.meta.dirname,'../dist/schemock-v0.1.0.html');
 await withBrowser({chrome,html,out:tmp},async ({js,load,variant,click,downloaded,events})=>{
  await js('window.showSaveFilePicker=undefined');await load(path.resolve(input));
  const message=await js(`document.querySelector('#status').textContent`);if(!message.includes('新しい図'))throw Error(message);
  for(const [i,v]of d.variants.entries()){
   await variant(v.id);await click('#png');const file=await downloaded('.png');const target=path.join(output,String(i+1).padStart(2,'0')+'.png');fs.copyFileSync(file,target);console.log(v.id+' -> '+target);
  }
  if(events.some(e=>e.method==='Network.requestWillBeSent'&&/^https?:/.test(e.params.request.url)))throw Error('Unexpected network request');
 });
 fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),input=args[args.indexOf('--input')+1],output=args[args.indexOf('--output-dir')+1];
 if(!args.includes('--input')||!args.includes('--output-dir'))throw Error('Usage: npm run preview -- --input diagram.json --output-dir /tmp/previews');
 await preview(path.resolve(input),path.resolve(output));
}
