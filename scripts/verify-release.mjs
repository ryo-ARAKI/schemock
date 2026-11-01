import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {preview} from './preview.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const lines=fs.readFileSync(path.join(dist,'SHA256SUMS'),'utf8').trim().split('\n');
const expected=['schemock-v0.1.0.html','schemock-v0.1.0-data.tar.gz'];
if(lines.length!==2||!expected.every(name=>lines.some(line=>line.split('  ')[1]===name)))throw Error('incomplete release manifest');
for(const line of lines){
 const [hash,name]=line.split('  ');if(createHash('sha256').update(fs.readFileSync(path.join(dist,name))).digest('hex')!==hash)throw Error('checksum mismatch '+name);
}
const html=fs.readFileSync(path.join(dist,'schemock-v0.1.0.html'),'utf8');
if(/<script[^>]+src=|<link[^>]+href=|\bfetch\s*\(|\bimport\s*\(|\blocalStorage\b|\bsessionStorage\b/.test(html))throw Error('runtime dependency in artifact');
for(const kind of ['node-edge','spectrum']){
 const out=path.join(root,'artifacts/release-'+kind);fs.mkdirSync(out,{recursive:true});const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'schemock-release-'));const app=path.join(isolated,'app.html'),input=path.join(isolated,'diagram.json');fs.copyFileSync(path.join(dist,'schemock-v0.1.0.html'),app);fs.copyFileSync(path.join(root,'tests/fixtures/independent/'+kind+'.json'),input);await preview(input,out,app);console.log('Isolated HTML + JSON: '+isolated);
}
console.log(JSON.stringify({version:'0.1.0',schema:2,node:process.version,os:os.platform()+' '+os.release(),chrome:execFileSync(process.env.CHROME||'google-chrome',['--version'],{encoding:'utf8'}).trim(),checksum:'verified',independentPreviews:'both families, offline'},null,2));
