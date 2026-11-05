import test from 'node:test';
import assert from 'node:assert/strict';
import {locations,places,paths} from '../src/data.js';
import {footprints,renderCampusMap} from '../src/campus-map.js';
import {findRoute} from '../src/graph.js';
test('every named place is tied to a traced footprint, gate or ground',()=>{
  const other=new Set(['GN','GS','F','C','B','T']);
  for(const n of places)assert.ok(other.has(n.building_id)||footprints.some(f=>f.id===n.building_id),n.id);
  const svg=renderCampusMap({locations,paths});
  assert.ok(!svg.includes('<image'));
  assert.match(svg,/Mechanical/);assert.match(svg,/Cricket Ground/);assert.match(svg,/NATHALAL PARIKH/);
});
test('shared-floor selection highlights the correct footprint and route is selectable',()=>{
  const result=findRoute(locations,paths,'gate','library');
  const svg=renderCampusMap({locations,paths,selected:'admin',route:result.route});
  assert.match(svg,/data-location="admin"[^>]*aria-pressed="true"/);
  assert.match(svg,/building-selected/);assert.match(svg,/class="selected-route"/);
  assert.match(svg,/class="route-marker"/);
});
test('edited names appear safely on buildings, grounds and gates',()=>{
  const updated=locations.map(n=>['library','ground','cricket','gate'].includes(n.id)?{...n,name:'New <'+n.id+'> & name'}:n);
  const svg=renderCampusMap({locations:updated,paths});
  for(const id of ['library','ground','cricket','gate'])assert.ok(svg.includes(`New &lt;${id}&gt; &amp; name`));
  assert.ok(!svg.includes('New <library>'));
});
test('a matching shared-floor location keeps its building highlighted',()=>{
  const svg=renderCampusMap({locations,paths,visibleIds:new Set(['labs'])});
  assert.match(svg,/class="map-node  " data-location="library"/);
  assert.match(svg,/class="map-node  map-dimmed" data-location="mechanical"/);
});
