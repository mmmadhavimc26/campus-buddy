import {project,places as referencePlaces} from './data.js';
import {routeCoordinates} from './graph.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const points=coordinates=>coordinates.map(point=>project(point).join(',')).join(' ');
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
// Manually reconstructed outlines, derived from the 2012 signboard photo.
// Adapted geometry licensed CC BY-SA 3.0 (assets/ATTRIBUTION.md).
export const footprints=[
  {id:'1',location:'firstyear',label:['First Year'],shape:[[785,686],[910,671],[915,698],[790,720]]},
  {id:'2',location:'production',label:['Production'],shape:rect(939,652,86,60)},
  {id:'3',location:'mechanical',label:['Mechanical','& Workshop'],shape:[[1025,643],[1210,643],[1210,631],[1246,631],[1246,643],[1268,643],[1268,713],[1258,713],[1258,827],[1222,827],[1222,713],[1170,713],[1170,825],[1136,825],[1136,713],[1058,713],[1058,851],[1025,851]]},
  {id:'4',location:'chemistry',label:['Applied','Chemistry'],shape:[[858,786],[924,757],[914,742],[964,720],[981,750],[963,759],[1007,881],[948,904],[938,923],[893,901]]},
  {id:'5',location:'bungalow',label:['Director’s','Bungalow'],shape:[[1208,863],[1239,863],[1239,881],[1255,881],[1255,919],[1238,919],[1238,934],[1199,934],[1199,892],[1208,892]]},
  {id:'6',location:'textile',label:['Textile'],shape:rect(1335,590,172,337)},
  {id:'6A',location:'gymkhana',label:[],shape:rect(1343,594,27,24)},
  {id:'7',location:'maintenance',label:['Structural'],shape:[[1518,590],[1600,590],[1600,924],[1540,924],[1540,608],[1518,608]]},
  {id:'8',location:'civil',label:['Civil & Environmental'],shape:[[1600,615],[1787,615],[1787,605],[1820,605],[1820,615],[1988,615],[1988,586],[2060,586],[2060,661],[1990,661],[1990,646],[1742,646],[1742,672],[1700,672],[1700,661],[1600,661]]},
  {id:'9',location:'canteen',label:['Canteen'],shape:rect(1608,662,47,166)},
  {id:'10',location:'director',label:[],shape:rect(1608,834,47,71)},
  {id:'11',location:'main',label:['Security · Auditorium','Administration (1F)'],shape:[[1666,814],[1715,814],[1715,873],[1795,873],[1795,839],[1826,839],[1826,873],[1903,873],[1903,815],[1955,815],[1955,924],[1666,924]]},
  {id:'12',location:'library',label:['Library','CCF (GF)'],shape:rect(1908,698,46,97)},
  {id:'13',location:'electrical',label:['Electrical'],shape:rect(1990,661,70,149)},
  {id:'14',location:'computer',label:['Computer','& MCA'],shape:rect(1990,814,70,107)},
  {id:'15',location:null,label:['Proposed hostel','(2012)'],shape:rect(2098,636,104,48)},
  {id:'16',location:'hostel-a',label:['A Block'],shape:[[2098,698],[2180,698],[2180,692],[2230,692],[2230,698],[2300,698],[2300,765],[2098,765]]},
  {id:'17',location:'gym',label:['Gym'],shape:rect(2297,637,52,46)},
  {id:'18',location:'hostel-b',label:['B Block'],shape:[[2340,699],[2550,699],[2550,764],[2485,764],[2485,771],[2410,771],[2410,764],[2340,764]]},
  {id:'19',location:'mess',label:['Mess'],shape:rect(2443,637,105,46)},
  {id:'20',location:null,label:['Quarters'],shape:[[2605,582],[2822,582],[2822,588],[2835,588],[2835,610],[2824,610],[2824,604],[2605,604]]},
  {id:'21',location:'hostel-d',label:['D Block'],shape:[[2777,656],[2915,656],[2957,614],[2957,602],[2974,590],[2987,604],[3060,604],[3060,626],[2988,626],[2943,681],[2777,681]]},
  {id:'23',location:'hostel-nri',label:['NRI'],shape:[[3095,706],[3139,724],[3125,765],[3083,749]]},
  {id:'24',location:'hostel-c',label:['C Block'],shape:[[3077,805],[3120,826],[3060,985],[3018,967]]}
];
const grounds=[
  {location:'ground',label:'Football ground',shape:rect(2105,798,260,155)},
  {location:'basketball',label:'Basketball',shape:rect(2558,787,80,129)},
  {location:'tennis',label:'Tennis',shape:rect(2397,929,130,68)},
  {location:null,label:'Kho-kho',shape:rect(2648,752,77,127)},
  {location:null,label:'Kabaddi',shape:rect(2650,892,75,49)}
];
function attrs(node,selected,visibleIds){return `class="map-node ${selected===node.id?'selected':''} ${visibleIds&&!visibleIds.has(node.id)?'map-dimmed':''}" data-location="${esc(node.id)}" role="button" tabindex="0" aria-label="${esc(node.name)}" aria-pressed="${selected===node.id}"`;}
export function renderCampusMap({locations,paths,route=[],selected=null,visibleIds=null}){
  const lookup=new Map(locations.map(n=>[n.id,n])),selectedNode=lookup.get(selected);
  if(visibleIds){
    const buildings=new Set(locations.filter(n=>visibleIds.has(n.id)&&n.building_id).map(n=>n.building_id));
    visibleIds=new Set([...visibleIds,...locations.filter(n=>n.building_id&&buildings.has(n.building_id)).map(n=>n.id)]);
  }
  let html=`<rect x="-3000" y="-3000" width="7000" height="7000" fill="#f3f1eb"/>
  <path d="M65 240 Q35 160 120 135 L305 93 L915 82 Q963 85 954 160 L922 568 Q918 598 870 593 L125 582 Q98 580 88 544 Z" fill="#e2e7d7" stroke="#b4bba8" stroke-width="2"/>
  <path d="M15 220 L63 228 Q93 184 165 171 L324 113 L930 102 Q980 108 965 173 L935 610" fill="none" stroke="#dedbd2" stroke-width="27"/>
  <path d="M85 268 L133 625 L930 640 M451 640 V726" fill="none" stroke="#dedbd2" stroke-width="29"/>
  <text x="565" y="87" text-anchor="middle" class="road-label">NATHALAL PARIKH MARG</text>
  <text x="515" y="674" text-anchor="middle" class="road-label">H. R. MAHAJANI ROAD</text>
  <text x="29" y="468" transform="rotate(-82 29 468)" class="road-label">ROAD NO. 31</text>
  <text x="979" y="430" transform="rotate(-82 979 430)" class="road-label">LADY JEHANGIR ROAD</text>
  <text x="479" y="728" class="road-label">VJTI ROAD</text>
  <text x="86" y="43" class="map-section-label">Academic blocks</text><text x="704" y="43" class="map-section-label">Hostels & sports</text>`;
  for(const e of paths){const a=lookup.get(e.from),b=lookup.get(e.to),line=e.points??[[a.x,a.y],[b.x,b.y]];html+=`<polyline class="campus-walkway" points="${line.map(p=>p.join(',')).join(' ')}"/>`;}
  for(const f of grounds){const n=lookup.get(f.location),center=project([f.shape.reduce((s,p)=>s+p[0],0)/f.shape.length,f.shape.reduce((s,p)=>s+p[1],0)/f.shape.length]);html+=`<g ${n?attrs(n,selected,visibleIds):'class="map-ground"'}><polygon class="ground-shape" points="${points(f.shape)}"/><text class="ground-label" text-anchor="middle" x="${center[0]}" y="${center[1]}">${esc(n?.name??f.label)}</text>${n?`<title>${esc(n.name)}</title>`:''}</g>`;}
  const cricket=lookup.get('cricket'),[cx,cy]=project([2875,852]);html+=`<g ${cricket?attrs(cricket,selected,visibleIds):''}><ellipse class="ground-shape cricket-field" cx="${cx}" cy="${cy}" rx="56" ry="143"/><rect x="${cx-6}" y="${cy-33}" width="12" height="66" fill="#d8d2b6"/><text class="ground-label" x="${cx}" y="${cy+64}" text-anchor="middle">${esc(cricket?.name??'Cricket ground')}</text></g>`;
  for(const f of footprints){const node=lookup.get(f.location),related=selectedNode?.building_id===f.id,labelNode=related?selectedNode:node;
    const pos=labelNode?[labelNode.x,labelNode.y]:project([f.shape.reduce((s,p)=>s+p[0],0)/f.shape.length,f.shape.reduce((s,p)=>s+p[1],0)/f.shape.length]);
    const baseline=referencePlaces.find(n=>n.id===labelNode?.id);
    let labels=f.label;
    if(labelNode&&labelNode.name!==baseline?.name){
      labels=[''];for(const word of labelNode.name.split(/\s+/)){const last=labels.length-1;if(labels[last]&&(labels[last]+' '+word).length>21)labels.push(word);else labels[last]+=(labels[last]?' ':'')+word;}
      labels=labels.slice(0,3).map(line=>line.length>24?line.slice(0,23)+'…':line);
    }
    html+=`<g ${node?attrs(related?selectedNode:node,selected,visibleIds):'class="reference-footprint"'}><polygon class="building-shape ${related?'building-selected':''}" points="${points(f.shape)}"/><title>${esc(labelNode?.name??f.label.join(' '))} · Signboard ${esc(f.id)}</title><circle class="building-number" cx="${pos[0]}" cy="${pos[1]-5}" r="12"/><text class="number-label" x="${pos[0]}" y="${pos[1]-1}" text-anchor="middle">${esc(f.id)}</text>${labels.map((line,i)=>`<text class="building-label" x="${pos[0]}" y="${pos[1]+21+i*12}" text-anchor="middle">${esc(line)}</text>`).join('')}</g>`;
  }
  for(const id of ['gate','gate-south']){const n=lookup.get(id);if(n)html+=`<g ${attrs(n,selected,visibleIds)}><rect class="gate-symbol" x="${n.x-8}" y="${n.y-5}" width="16" height="10"/><text class="gate-label" text-anchor="middle" x="${n.x}" y="${n.y+22}">${esc(n.name)}</text></g>`;}
  if(route.length){html+=`<polyline class="selected-route" points="${routeCoordinates(locations,paths,route).map(p=>p.join(',')).join(' ')}"/>`;for(const [index,id] of [[0,route[0]],[1,route.at(-1)]]){const n=lookup.get(id);html+=`<g class="route-marker"><circle cx="${n.x}" cy="${n.y}" r="12"/><text x="${n.x}" y="${n.y+4}" text-anchor="middle">${index?'B':'A'}</text></g>`;}}
  return html;
}
