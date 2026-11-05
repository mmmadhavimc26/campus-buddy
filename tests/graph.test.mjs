import test from 'node:test';
import assert from 'node:assert/strict';
import {findRoute,validateGraph,routeCoordinates} from '../src/graph.js';
import {locations,paths} from '../src/data.js';
import {distancePresentation} from '../src/distance.js';
test('every demo location pair has a valid route for each algorithm',()=>{
  for(const method of ['bfs','dfs','dijkstra'])for(const start of locations)for(const end of locations){
    const result=findRoute(locations,paths,start.id,end.id,method);
    assert.equal(result.route[0],start.id);assert.equal(result.route.at(-1),end.id);
    let total=0;for(let i=1;i<result.route.length;i++){const a=result.route[i-1],b=result.route[i];const edge=paths.find(e=>e.from===a&&e.to===b||e.from===b&&e.to===a);assert.ok(edge);total+=edge.distance;}
    assert.equal(result.distance,total);assert.equal(result.minutes,start.id===end.id?0:null);
  }
});
test('unverified and mixed weights never produce walking-time claims',()=>{
  const result=findRoute(locations,paths,'gate','library');
  assert.equal(result.distanceVerified,false);assert.equal(result.minutes,null);
  assert.equal(distancePresentation(result).unit,'units');
  assert.equal(distancePresentation(result).time,'—');
  const edges=paths.map(e=>({...e,distance_verified:true}));
  const verified=findRoute(locations,edges,'gate','library');
  assert.equal(verified.distanceVerified,true);assert.equal(verified.minutes,Math.ceil(verified.distance/80));
  assert.equal(distancePresentation(verified).unit,'m');
  edges.find(e=>e.from==='gate').distance_verified=false;
  assert.equal(findRoute(locations,edges,'gate','library').minutes,null);
});
test('highlighted path preserves intermediate bends in either direction',()=>{
  const edge=paths.find(e=>e.points.length>2),a=locations.find(n=>n.id===edge.from),b=locations.find(n=>n.id===edge.to);
  assert.deepEqual(routeCoordinates(locations,paths,[a.id,b.id]),edge.points);
  assert.deepEqual(routeCoordinates(locations,paths,[b.id,a.id]),[...edge.points].reverse());
});
test('BFS minimizes edges while Dijkstra minimizes weighted distance',()=>{
  const nodes=locations.slice(0,3),[a,b,c]=nodes.map(n=>n.id),edges=[{from:a,to:b,distance:100},{from:a,to:c,distance:10},{from:c,to:b,distance:10}];
  assert.deepEqual(findRoute(nodes,edges,a,b,'bfs').route,[a,b]);
  assert.equal(findRoute(nodes,edges,a,b,'dijkstra').distance,20);
});
test('same location, disconnected graph and invalid input',()=>{
  assert.equal(findRoute(locations,paths,'gate','gate').distance,0);
  assert.deepEqual(findRoute(locations,[],'gate','main').route,[]);
  assert.throws(()=>findRoute(locations,paths,'missing','gate'));
  assert.throws(()=>validateGraph(locations,[{from:'gate',to:'main',distance:-1}]));
  assert.throws(()=>validateGraph([...locations,locations[0]],paths));
});
