import fs from 'node:fs';import path from 'node:path';import {gzipSync} from 'node:zlib';
// Minimal deterministic POSIX ustar: regular data files only, no links or executables.
export function createArchive(root){
 const chunks=[];
 function visit(dir){for(const name of fs.readdirSync(dir).sort()){
  const file=path.join(dir,name),stat=fs.lstatSync(file);
  if(stat.isDirectory()){visit(file);continue;}
  if(!stat.isFile())throw Error('archive only accepts regular files: '+file);
  const rel=path.relative(root,file).split(path.sep).join('/');if(Buffer.byteLength(rel)>100)throw Error('archive path too long: '+rel);
  const body=fs.readFileSync(file),header=Buffer.alloc(512);
  const put=(value,offset,length)=>header.write(String(value),offset,length,'ascii');
  const oct=(value,offset,length)=>put(value.toString(8).padStart(length-1,'0')+'\0',offset,length);
  put(rel,0,100);oct(0o644,100,8);oct(0,108,8);oct(0,116,8);oct(body.length,124,12);oct(0,136,12);
  header.fill(32,148,156);put('0',156,1);put('ustar\0',257,6);put('00',263,2);
  const sum=header.reduce((a,b)=>a+b,0);put(sum.toString(8).padStart(6,'0')+'\0 ',148,8);
  chunks.push(header,body,Buffer.alloc((512-body.length%512)%512));
 }}
 visit(root);chunks.push(Buffer.alloc(1024));return gzipSync(Buffer.concat(chunks),{level:9});
}
