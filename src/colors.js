// Fixed Typst RGB mapping; CSS names do not share these values.
export const TYPST_COLORS={black:'#000000',gray:'#aaaaaa',silver:'#dddddd',white:'#ffffff',navy:'#001f3f',blue:'#0074d9',aqua:'#7fdbff',teal:'#39cccc',eastern:'#239dad',purple:'#b10dc9',fuchsia:'#f012be',maroon:'#85144b',red:'#ff4136',orange:'#ff851b',yellow:'#ffdc00',olive:'#3d9970',green:'#2ecc40',lime:'#01ff70'};
export const DEFAULTS={elements:{fill:'#e0f0ef',stroke:'#267b79'},groups:{fill:'#f2f7fa',stroke:'#8cabb9'},connections:{stroke:'#23566b'},paths:{stroke:'#203e50'},regions:{fill:'#edf2f5'},labels:{fill:'#192d40'}};
export const namedColor=x=>typeof x==='string'&&Object.hasOwn(TYPST_COLORS,x);
export const safeColor=x=>namedColor(x)||typeof x==='string'&&/^#[0-9a-fA-F]{6}$/.test(x);
export const cssColor=x=>namedColor(x)?TYPST_COLORS[x]:x;
export const defaultColors=(kind,diagramKind)=>kind==='labels'&&diagramKind==='spectrum'?{fill:'#203e50'}:DEFAULTS[kind];
export const paint=(o,key,kind,diagramKind)=>cssColor(o[key]??defaultColors(kind,diagramKind)[key]);
