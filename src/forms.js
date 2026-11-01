export const displayNumber=value=>String(Number(value.toFixed(2)));
export const displayPoints=points=>points.map(p=>displayNumber(p.x)+', '+displayNumber(p.y)).join('\n');
export function enteredNumber(value,original){
 if(!value.trim()||!Number.isFinite(Number(value)))throw Error('有限数を入力してください');
 const n=Number(value);return Number.isFinite(original)&&n===Number(displayNumber(original))?original:n;
}
export function enteredPoints(value,original,allowEmpty){
 if(!value.trim()&&allowEmpty)return [];
 return value.trim().split('\n').map((line,i)=>{
  const pair=line.split(',').map(x=>x.trim());if(pair.length!==2||pair.some(x=>!x))throw Error('各行は X, Y');
  return {x:enteredNumber(pair[0],original[i]?.x),y:enteredNumber(pair[1],original[i]?.y)};
 });
}
