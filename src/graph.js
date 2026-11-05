export function validateGraph(locations, paths) {
  if (!Array.isArray(locations) || !locations.length || !Array.isArray(paths)) throw new Error('Invalid campus dataset.');
  const ids = new Set();
  for (const n of locations) {
    if (!n.id || ids.has(n.id) || typeof n.name !== 'string' || typeof n.category !== 'string' || typeof n.description !== 'string' || !Array.isArray(n.facilities) || !Array.isArray(n.aliases) || ![n.x,n.y,n.width,n.height].every(Number.isFinite) || n.width <= 0 || n.height <= 0 || n.x < 0 || n.x > 1000 || n.y < 0 || n.y > 760) throw new Error('Invalid campus location.');
    ids.add(n.id);
  }
  for (const e of paths) {
    if (!ids.has(e.from) || !ids.has(e.to) || !Number.isFinite(e.distance) || e.distance <= 0) throw new Error('Invalid campus connection.');
    if(e.points!==undefined&&e.points!==null){
      if(!Array.isArray(e.points)||e.points.length<2||!e.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))throw new Error('Invalid walkway geometry.');
      const a=locations.find(n=>n.id===e.from),b=locations.find(n=>n.id===e.to),first=e.points[0],last=e.points.at(-1);
      if(first[0]!==a.x||first[1]!==a.y||last[0]!==b.x||last[1]!==b.y)throw new Error('Walkway endpoints do not match locations.');
    }
  }
}
export function findRoute(locations, paths, start, end, algorithm='dijkstra') {
  validateGraph(locations, paths);
  const graph = new Map(locations.map(n=>[n.id,[]]));
  for (const p of paths) { graph.get(p.from).push({id:p.to,distance:p.distance,verified:p.distance_verified===true}); graph.get(p.to).push({id:p.from,distance:p.distance,verified:p.distance_verified===true}); }
  if (!graph.has(start) || !graph.has(end)) throw new Error('Select valid campus locations.');
  if (!['bfs','dfs','dijkstra'].includes(algorithm)) throw new Error('Unknown algorithm.');
  const frontier=[start], discovered=new Set([start]), visited=[], parent=new Map(), cost=new Map([[start,0]]);
  while (frontier.length) {
    if (algorithm==='dijkstra') frontier.sort((a,b)=>cost.get(a)-cost.get(b));
    const current=algorithm==='dfs'?frontier.pop():frontier.shift();
    visited.push(current);
    if (current===end) {
      const route=[end]; while (route[0]!==start) route.unshift(parent.get(route[0]));
      const distance=route.slice(1).reduce((sum,id,i)=>sum+graph.get(route[i]).find(e=>e.id===id).distance,0);
      const distanceVerified=route.slice(1).every((id,i)=>graph.get(route[i]).find(e=>e.id===id).verified);
      return {route,distance,distanceVerified,minutes:distanceVerified?Math.ceil(distance/80):null,visited};
    }
    for (const next of graph.get(current)) {
      const candidate=cost.get(current)+next.distance;
      if (algorithm==='dijkstra' ? candidate<(cost.get(next.id)??Infinity) : !discovered.has(next.id)) {
        parent.set(next.id,current); cost.set(next.id,candidate);
        if (!frontier.includes(next.id)) frontier.push(next.id);
        discovered.add(next.id);
      }
    }
  }
  return {route:[],distance:0,distanceVerified:false,minutes:null,visited};
}
export function routeCoordinates(locations,paths,route){
  const lookup=new Map(locations.map(n=>[n.id,n]));
  if(!route.length)return [];
  const result=[[lookup.get(route[0]).x,lookup.get(route[0]).y]];
  for(let i=1;i<route.length;i++){
    const from=route[i-1],to=route[i],edge=paths.find(e=>e.from===from&&e.to===to||e.to===from&&e.from===to);
    if(!edge)throw new Error('Route has an invalid connection.');
    const a=lookup.get(edge.from),b=lookup.get(edge.to);
    const line=edge.points??[[a.x,a.y],[b.x,b.y]];
    result.push(...(edge.from===from?line:[...line].reverse()).slice(1));
  }
  return result;
}
