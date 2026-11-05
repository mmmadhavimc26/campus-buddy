import {locations as demoLocations, paths as demoPaths, layoutVersion} from './data.js';
import {renderCampusMap} from './campus-map.js';
import {findRoute, validateGraph} from './graph.js';
import {distancePresentation} from './distance.js';
import {createAccountClient} from './account.js';
import {mountAccountUI} from './account-ui.js';
import {locationChanges} from './location-editor.js';
const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('Browser storage is unavailable. Changes last for this visit.');return false;}}
let locations=demoLocations, paths=demoPaths, category='All places', selected=null, savedOnly=false, route=[], favorites=read('vjti-favorites',[]), recent=read('vjti-recent',[]);
if(!Array.isArray(favorites)) favorites=[]; if(!Array.isArray(recent)) recent=[];
const config=window.CAMPUS_CONFIG??{}, cloud=Boolean(config.supabaseUrl&&config.supabaseKey);
let toastTimer,cloudReady=false,accountId=null;
const account=createAccountClient(config,{onChange:renderAccount});
function personalKey(name){return `vjti-${name}:${account.state().user?.id??'guest'}`;}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
async function api(table,options={}){
  const access=await account.token();
  const response=await fetch(`${config.supabaseUrl}/rest/v1/${table}`,{...options,headers:{apikey:config.supabaseKey,'Content-Type':'application/json',...(access?{Authorization:`Bearer ${access}`} : {}),...options.headers},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(`Database request failed (${response.status}).`);
  const body=await response.text();
  return body?JSON.parse(body):null;
}
const byId=id=>locations.find(n=>n.id===id);
function renderDirectory(){
  const filtered=matchedPlaces();
  $('location-count').textContent=`${filtered.length} places`;
  $('directory').innerHTML=filtered.length?filtered.map(n=>`<button class="location ${selected===n.id?'selected':''}" data-location="${esc(n.id)}"><span><span class="location-name">${esc(n.name)}</span><span class="location-category">${esc(n.category)}</span></span><span class="location-arrow">${favorites.includes(n.id)?'Saved':''}</span></button>`).join(''):'<p class="empty">No places found. Try another search or filter.</p>';
  $('list-title').textContent=savedOnly?'Saved places':'Places';
  $('saved-toggle').textContent=savedOnly?'Show all':'Saved places';
  $('recent').innerHTML=recent.filter(id=>byId(id)).length?`Recent<br>${recent.filter(id=>byId(id)).slice(0,3).map(id=>`<button data-location="${esc(id)}">${esc(byId(id).name)}</button>`).join('')}`:'';
}
function renderCategories(){
  $('categories').innerHTML=['All places',...new Set(visiblePlaces().map(n=>n.category))].map(c=>`<button class="chip ${c===category?'active':''}" aria-pressed="${c===category}" data-category="${esc(c)}">${esc(c)}</button>`).join('');
}
function initializeLocations(){
  validateGraph(locations,paths); renderCategories();renderDirectory();renderMap();
  const previousStart=$('start').value,previousEnd=$('destination').value;
  const options=visiblePlaces().map(n=>`<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('');
  $('start').innerHTML=options;$('destination').innerHTML=options;$('feedback-location').innerHTML='<option value="">General campus feedback</option>'+options;
  $('start').value=byId(previousStart)?previousStart:(byId('gate')?'gate':locations[0].id);
  $('destination').value=byId(previousEnd)?previousEnd:(byId('library')?'library':visiblePlaces().at(-1).id);
}
let view={x:0,y:0,w:1000,h:760};
function applyView(){$('campus-map').setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);}
function zoom(factor){const w=Math.max(350,Math.min(1200,view.w*factor));const h=w*.76;view={x:view.x+(view.w-w)/2,y:view.y+(view.h-h)/2,w,h};applyView();}
function visiblePlaces(){return locations.filter(n=>n.kind!=='junction');}
function matchedPlaces(){const query=$('search').value.trim().toLowerCase();return visiblePlaces().filter(n=>(category==='All places'||n.category===category)&&(!savedOnly||favorites.includes(n.id))&&[n.name,n.category,...n.aliases].some(s=>s.toLowerCase().includes(query)));}
function renderMap(){
  $('campus-map').innerHTML=renderCampusMap({locations,paths,route,selected,visibleIds:new Set(matchedPlaces().map(n=>n.id))});
  applyView();
}
function selectLocation(id){
  const n=byId(id);if(!n)return;selected=id;recent=[id,...recent.filter(x=>x!==id)].slice(0,5);save(personalKey('recent'),recent);renderDirectory();renderMap();
  const nearby=locations.filter(x=>x.id!==id&&['Library','Food & facilities'].includes(x.category)).map(x=>({n:x,result:findRoute(locations,paths,id,x.id,'bfs')})).filter(x=>x.result.route.length).sort((a,b)=>a.result.distance-b.result.distance).slice(0,3);
  $('building-card').hidden=false;
  $('building-card').innerHTML=`<button class="close-card" id="close-card" aria-label="Close building details">×</button><span class="badge">${esc(n.category)} · Building ${esc(n.reference_no??n.building_id??'')}</span><h2>${esc(n.name)}</h2><p class="floor-info">${esc(n.floor??'')}${n.room?` · ${esc(n.room)}`:''}</p>${n.description&&!n.description.startsWith('Shown at marker')?`<p class="location-description">${esc(n.description)}</p>`:''}${n.opening_hours?`<p class="location-hours">Hours: ${esc(n.opening_hours)}</p>`:''}${visiblePlaces().filter(other=>other.id!==id&&other.building_id===n.building_id).length?`<div class="shared-building">Also in building ${esc(n.building_id)}${visiblePlaces().filter(other=>other.id!==id&&other.building_id===n.building_id).map(other=>`<button data-location="${esc(other.id)}">${esc(other.name)} <small>${esc(other.floor??'')}</small></button>`).join('')}</div>`:''}<div class="facilities">${n.facilities.map(f=>`<span>${esc(f)}</span>`).join('')}</div><div class="card-actions"><button id="favorite">${favorites.includes(id)?'Remove from saved':'Save place'}</button><button class="go" id="navigate">Directions</button></div><div class="nearby">Nearby${nearby.map(({n,result})=>`<button data-location="${esc(n.id)}">${esc(n.name)} <span style="float:right">${result.distanceVerified?`${result.distance} m`:''}</span></button>`).join('')}</div>`;
  $('close-card').onclick=()=>{$('building-card').hidden=true;selected=null;renderMap();renderDirectory();};
  $('favorite').onclick=()=>{favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save(personalKey('favorites'),favorites);selectLocation(id);};
  $('navigate').onclick=()=>{$('destination').value=id;setTab('route');$('building-card').hidden=true;$('start').focus();};
}
function setTab(tab){const explore=tab==='explore';$('explore-panel').hidden=!explore;$('route-panel').hidden=explore;$('explore-tab').setAttribute('aria-selected',String(explore));$('route-tab').setAttribute('aria-selected',String(!explore));}
document.addEventListener('click',e=>{const location=e.target.closest('[data-location]');if(location)selectLocation(location.dataset.location);const chip=e.target.closest('[data-category]');if(chip){category=chip.dataset.category;renderCategories();renderDirectory();renderMap();}});
$('campus-map').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-location]')){e.preventDefault();selectLocation(e.target.dataset.location);}});
$('search').oninput=()=>{renderDirectory();renderMap();};
$('saved-toggle').onclick=()=>{savedOnly=!savedOnly;renderDirectory();renderMap();};
$('explore-tab').onclick=()=>setTab('explore');$('route-tab').onclick=()=>setTab('route');
$('swap').onclick=()=>{const value=$('start').value;$('start').value=$('destination').value;$('destination').value=value;};
$('route-form').onsubmit=e=>{e.preventDefault();try{
  const result=findRoute(locations,paths,$('start').value,$('destination').value,'bfs');route=result.route;view={x:0,y:0,w:1000,h:760};renderMap();$('building-card').hidden=true;
  const display=distancePresentation(result);
  $('route-result').innerHTML=route.length?`${result.distanceVerified?`<div class="route-summary"><div><strong>${display.value}<small> ${display.unit}</small></strong><small>Distance</small></div><div><strong>${display.time}<small> min</small></strong><small>Walking time</small></div></div>`:'<p class="route-notice">Distance not measured. Walking time unavailable.</p>'}${route.length===1?'<p class="muted">The starting point and destination are the same.</p>':`<ol class="route-steps">${route.filter(id=>byId(id).kind!=='junction').map(id=>`<li>${esc(byId(id).name)}</li>`).join('')}</ol>`}<button class="text-button" id="clear-route">Clear route</button>`:'<p class="empty">No connected route was found. Try another destination.</p>';
  if($('clear-route'))$('clear-route').onclick=()=>{route=[];renderMap();$('route-result').innerHTML='';};
}catch(error){toast(error.message);}};
$('zoom-in').onclick=()=>zoom(.8);$('zoom-out').onclick=()=>zoom(1.25);$('zoom-reset').onclick=()=>{view={x:0,y:0,w:1000,h:760};applyView();};
let drag=null;
$('map-viewport').addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('[data-location]'))return;drag={x:e.clientX,y:e.clientY,view:{...view}};$('map-viewport').setPointerCapture(e.pointerId);});
$('map-viewport').addEventListener('pointermove',e=>{if(!drag)return;const rect=$('campus-map').getBoundingClientRect(),scale=Math.max(view.w/rect.width,view.h/rect.height);view.x=drag.view.x-(e.clientX-drag.x)*scale;view.y=drag.view.y-(e.clientY-drag.y)*scale;applyView();});
$('map-viewport').addEventListener('pointerup',()=>drag=null);$('map-viewport').addEventListener('pointercancel',()=>drag=null);
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('feedback-dialog').open){e.preventDefault();setTab('explore');$('search').focus();}});
$('feedback-open').onclick=()=>{$('feedback-mode').textContent=cloud?'Your report will be sent to the administrator.':'Reports are saved on this device only.';$('feedback-result').textContent='';$('feedback-dialog').showModal();};
$('feedback-close').onclick=()=>$('feedback-dialog').close();
$('feedback-form').onsubmit=async e=>{e.preventDefault();const message=$('feedback-message').value.trim();if(message.length<10){$('feedback-result').textContent='Please enter at least 10 characters.';return;}const item={location_id:$('feedback-location').value||null,message};$('feedback-submit').disabled=true;try{if(cloud){await api('feedback',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(item)});$('feedback-result').textContent='Report sent.';}else{let items=read('vjti-feedback',[]);if(!Array.isArray(items))items=[];if(!save('vjti-feedback',[...items,{...item,created_at:new Date().toISOString()}]))throw new Error('Feedback could not be saved. Browser storage is unavailable.');$('feedback-result').textContent='Saved on this device. Not sent to an administrator.';}$('feedback-message').value='';}catch{$('feedback-result').textContent='Unable to save feedback. Please try again. Your message is still here.';}finally{$('feedback-submit').disabled=false;}};
$('about-open').onclick=()=>$('about-dialog').showModal();
$('about-close').onclick=()=>$('about-dialog').close();
function renderAccount(state){
  $('login-open').hidden=Boolean(state.user);$('logout').hidden=!state.user;$('admin-open').hidden=!state.admin;
  $('account-label').textContent=state.user?(state.demo?'Demo '+(state.admin?'admin':'student'):state.user.email):'';
  if(!state.admin&&$('admin-dialog').open)$('admin-dialog').close();
  const identity=state.user?.id??'guest';
  if(identity!==accountId){accountId=identity;favorites=read(personalKey('favorites'),identity==='guest'?read('vjti-favorites',[]):[]);recent=read(personalKey('recent'),identity==='guest'?read('vjti-recent',[]):[]);if(!Array.isArray(favorites))favorites=[];if(!Array.isArray(recent))recent=[];renderDirectory();renderMap();}
}
async function reloadLocations(){
  const [nodes,edges]=await Promise.all([api('locations?select=*'),api('paths?select=*')]);
  validateGraph(nodes,edges);if(nodes.some(n=>n.layout_version!==layoutVersion))throw new Error('Database layout is out of date.');
  locations=nodes;paths=edges;cloudReady=true;initializeLocations();
  if(route.length)$('route-form').onsubmit({preventDefault(){}});
  if(selected&&byId(selected))selectLocation(selected);
  $('data-status').textContent='Connected to the campus database.';
}
async function saveLocation(id,changes,original){
  await account.requireAdmin();
  if(account.state().demo){
    const patches=read('vjti-demo-location-edits',{});patches[id]=changes;
    if(!save('vjti-demo-location-edits',patches))throw new Error('Browser storage is unavailable. Changes were not saved.');
    return {...original,...changes};
  }
  if(!cloudReady)throw new Error('The campus database is unavailable. Nothing was saved.');
  const version=original.updated_at?'&updated_at=eq.'+encodeURIComponent(original.updated_at):'';
  const rows=await api('locations?id=eq.'+encodeURIComponent(id)+version,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(changes)});
  if(!Array.isArray(rows)||rows.length!==1)throw new Error('This location changed or access was denied. Close and reopen the editor to load the latest details.');
  return rows[0];
}
mountAccountUI({account,getLocations:()=>locations,saveLocation,notify:toast,onSaved:async updated=>{
  locations=locations.map(n=>n.id===updated.id?updated:n);category='All places';initializeLocations();
  if(route.length)$('route-form').onsubmit({preventDefault(){}});
  if(selected===updated.id)selectLocation(updated.id);
}});
if(!cloud){
  const patches=read('vjti-demo-location-edits',{});
  locations=demoLocations.map(n=>{try{const patch=patches[n.id];if(!patch)return n;return {...n,...locationChanges({...patch,facilities:Array.isArray(patch.facilities)?patch.facilities.join('\n'):'',aliases:Array.isArray(patch.aliases)?patch.aliases.join('\n'):''})};}catch{return n;}});
}
initializeLocations();renderAccount(account.state());
await account.restore();
if(cloud){
  $('data-status').textContent='Connecting to the database…';
  try{await reloadLocations();}catch{$('data-status').textContent='Database unavailable. Using local map data.';toast('Database unavailable. Using local map data.');}
  // Refresh public map data for other visitors without changing an open editor.
  const refresh=()=>{if(!document.hidden&&!$('admin-dialog').open)reloadLocations().catch(()=>{$('data-status').textContent='Database unavailable. Showing the last loaded map.';});};
  setInterval(refresh,30000);window.addEventListener('focus',refresh);
}
