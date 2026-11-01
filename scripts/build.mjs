import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import os from 'node:os';import {createArchive} from './archive.mjs';
const root=path.resolve(import.meta.dirname,'..');
const modules=new Map();
function bundle(file){
 const id=path.relative(root,file);if(modules.has(id))return id;
 let code=fs.readFileSync(file,'utf8');const deps=[];
 code=code.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?$/gm,(_,names,rel)=>{const dep=bundle(path.resolve(path.dirname(file),rel));deps.push(`const {${names}}=__modules[${JSON.stringify(dep)}];`);return '';});
 if(/^import\s/m.test(code))throw Error('unsupported import in '+id);
 const exports=[];code=code.replace(/\bexport\s+(const|let|function|class|async function)\s+(\w+)/g,(_,type,name)=>{exports.push(name);return type+' '+name;});
 modules.set(id,`__modules[${JSON.stringify(id)}]=(()=>{\n${deps.join('\n')}\n${code}\nreturn {${exports.join(',')}};\n})();`);return id;
}
bundle(path.join(root,'src/app.js'));
const script='const __modules=Object.create(null);\n'+[...modules.values()].join('\n');
if(/<\/script/i.test(script))throw Error('script closing tag in bundle');
const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8').replace('/* STYLES */',()=>fs.readFileSync(path.join(root,'src/styles.css'),'utf8')).replace('/* APPLICATION */',()=>script);
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});const name='schemock-v0.1.0.html';


// Reproducible data/specification archive, distinct from the runtime HTML.
const stage=fs.mkdtempSync(path.join(os.tmpdir(),'schemock-data-'));
for(const dir of ['schemas','examples','tests/fixtures'])fs.cpSync(path.join(root,dir),path.join(stage,dir),{recursive:true});
fs.mkdirSync(path.join(stage,'docs'),{recursive:true});
for(const name of ['data-format-v2.md','agent-workflow.md','migration-v1.md','releasing.md','release-notes-v0.1.0.md'])fs.copyFileSync(path.join(root,'docs',name),path.join(stage,'docs',name));
const list=[];
function checks(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){const file=path.join(dir,entry.name);if(entry.isDirectory())checks(file);else list.push(createHash('sha256').update(fs.readFileSync(file)).digest('hex')+'  '+path.relative(stage,file));}}
checks(stage);fs.writeFileSync(path.join(stage,'SHA256SUMS'),list.join('\n')+'\n');
const archive='schemock-v0.1.0-data.tar.gz',archiveBytes=createArchive(stage);
fs.writeFileSync(path.join(out,name),html);fs.writeFileSync(path.join(out,archive),archiveBytes);
fs.writeFileSync(path.join(out,'SHA256SUMS'),createHash('sha256').update(html).digest('hex')+'  '+name+'\n');
fs.appendFileSync(path.join(out,'SHA256SUMS'),createHash('sha256').update(fs.readFileSync(path.join(out,archive))).digest('hex')+'  '+archive+'\n');fs.rmSync(stage,{recursive:true,force:true});console.log('Built '+name+' ('+Buffer.byteLength(html)+' bytes) and '+archive);
