import {paint} from './colors.js';
import {anchor,worldElement,labelPosition} from './diagrams/node-edge.js';
import {pathData} from './diagrams/spectrum.js';
export function svgNode(tag,attrs={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
export function createSVG(doc,selected=null,handles=false){
 const n=svgNode,{width,height}=doc.coordinate_system,s=doc.variants.find(v=>v.id===doc.selected_variant_id).current;
 const svg=n('svg',{viewBox:`0 0 ${width} ${height}`,width,height,xmlns:'http://www.w3.org/2000/svg','aria-label':'模式図'}),defs=n('defs');
 svg.append(defs,n('rect',{width,height,fill:'white'}));
 const edges=doc.diagram_kind==='node-edge'?s.connections:s.paths;
 const kind=doc.diagram_kind==='node-edge'?'connections':'paths';
 const colors=[...new Set(edges.filter(e=>e.directed).map(e=>paint(e,'stroke',kind)))];
 for(const [i,color] of colors.entries()){
  const m=n('marker',{id:'arrow-'+i,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});
  m.append(n('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color}));defs.append(m);
 }
 const wrap=(id,node)=>{const g=n('g',handles?{'data-id':id,class:id===selected?'selected':''}:{});g.append(node);svg.append(g);};
 const marker=e=>e.directed?{'marker-end':'url(#arrow-'+colors.indexOf(paint(e,'stroke',kind))+')'}:{};
 if(doc.diagram_kind==='node-edge'){
  for(const g of s.groups)wrap(g.id,n('rect',{x:g.x,y:g.y,width:g.width,height:g.height,rx:12,fill:paint(g,'fill','groups'),stroke:paint(g,'stroke','groups'),'stroke-width':2,'stroke-dasharray':'8 5'}));
  for(const c of s.connections){
   const pts=[anchor(s,c.from),...c.waypoints,anchor(s,c.to)];
   wrap(c.id,n('polyline',{points:pts.map(p=>p.x+','+p.y).join(' '),fill:'none',stroke:paint(c,'stroke','connections'),'stroke-width':2.5,...marker(c)}));
  }
  for(const e of s.elements){const p=worldElement(s,e.id);wrap(e.id,n('rect',{x:p.x,y:p.y,width:p.width,height:p.height,rx:7,fill:paint(e,'fill','elements'),stroke:paint(e,'stroke','elements'),'stroke-width':2}));}
 }else{
  for(const r of s.regions)wrap(r.id,n('rect',{x:r.x,y:r.y,width:r.width,height:r.height,rx:2,fill:paint(r,'fill','regions')}));
  for(const p of s.paths)wrap(p.id,n('path',{d:pathData(p),fill:'none',stroke:paint(p,'stroke','paths'),'stroke-width':p.width,'stroke-linecap':'round','stroke-linejoin':'round',...(p.dash?{'stroke-dasharray':'7 5'}:{}),...marker(p)}));
 }
 for(const l of s.labels){
  const p=doc.diagram_kind==='node-edge'?labelPosition(s,l):l,lines=l.text.split('\n'),t=n('text',{x:p.x,y:p.y,'text-anchor':'middle','dominant-baseline':'middle','font-family':'system-ui, sans-serif','font-size':l.fontSize,fill:paint(l,'fill','labels',doc.diagram_kind)});
  lines.forEach((line,i)=>t.append(n('tspan',{x:p.x,dy:i===0?-(lines.length-1)*l.fontSize*.6:l.fontSize*1.2},line)));wrap(l.id,t);
 }
 if(handles){
  const p=edges.find(p=>p.id===selected),ps=p?.points??p?.waypoints;
  if(ps){
   if(p.type==='cubic')for(let i=1;i<ps.length;i+=3)for(const [a,b]of [[ps[i-1],ps[i]],[ps[i+1],ps[i+2]]])svg.append(n('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#9aaabb','stroke-dasharray':'3 3','pointer-events':'none','data-guide':''}));
   ps.forEach((v,i)=>svg.append(n('circle',{cx:v.x,cy:v.y,r:6.5,fill:'#dc8c54',stroke:'white','data-control':p.id,'data-point':i})));
  }
 }
 return svg;
}
