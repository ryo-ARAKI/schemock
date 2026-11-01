import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
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
fs.writeFileSync(path.join(out,name),html);
fs.writeFileSync(path.join(out,'SHA256SUMS'),createHash('sha256').update(html).digest('hex')+'  '+name+'\n');
console.log('Built '+name+' ('+Buffer.byteLength(html)+' bytes)');
