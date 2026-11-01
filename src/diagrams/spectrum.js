export function pathData(p){return 'M '+p.points[0].x+' '+p.points[0].y+(p.type==='cubic'?' C ':' L ')+p.points.slice(1).map(p=>p.x+' '+p.y).join(' ');}
export function translatePath(path,dx,dy){for(const p of path.points){p.x+=dx;p.y+=dy;}}
