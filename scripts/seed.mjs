import {writeFile} from 'node:fs/promises';
import {locations,paths} from '../src/data.js';
const q=value=>`'${String(value).replaceAll("'","''")}'`;
const nullable=value=>value===undefined?'null':q(value);
const rows=locations.map(n=>`(${[q(n.id),q(n.name),q(n.category),n.x,n.y,n.width,n.height,q(n.description),q(JSON.stringify(n.facilities))+'::jsonb',q(JSON.stringify(n.aliases))+'::jsonb',q(n.kind),nullable(n.building_id),nullable(n.reference_no),nullable(n.floor),q(n.layout_version)].join(', ')})`);
const edges=paths.map(e=>`(${q(e.from)}, ${q(e.to)}, ${e.distance}, false, ${q(JSON.stringify(e.points))}::jsonb)`);
await writeFile('supabase/seed.sql',`-- 2012 signboard-based layout (CC BY-SA 3.0). Paths are inferred and unmeasured.\n-- For a fresh database. Existing rows are preserved; see README for upgrades.\nbegin;\ninsert into public.locations (id,name,category,x,y,width,height,description,facilities,aliases,kind,building_id,reference_no,floor,layout_version) values\n${rows.join(',\n')}\non conflict (id) do nothing;\ninsert into public.paths ("from","to",distance,distance_verified,points) values\n${edges.join(',\n')}\non conflict ("from","to") do nothing;\ncommit;\n`);
console.log('Generated supabase/seed.sql. Existing rows are preserved.');
