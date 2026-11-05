import {locationChanges} from './location-editor.js';
export function mountAccountUI({account,getLocations,saveLocation,onSaved,notify}){
  const $=id=>document.getElementById(id);
  let original=null,saving=false;
  function openLogin(){
    const state=account.state();$('login-result').textContent='';$('demo-logins').hidden=state.configured;
    $('login-note').textContent=state.configured?'Use the email and password created in Supabase.':'Try a student or administrator account below.';
    $('login-dialog').showModal();
  }
  $('login-open').onclick=openLogin;$('login-close').onclick=()=>$('login-dialog').close();
  for(const role of ['student','admin'])$('demo-'+role).onclick=()=>{$('login-email').value=role==='admin'?'admin@demo.local':'student@demo.local';$('login-password').value=role==='admin'?'Admin123!':'Student123!';$('login-result').textContent='Demo login filled. Click Sign in.';};
  $('login-form').onsubmit=async event=>{
    event.preventDefault();$('login-submit').disabled=true;$('login-result').textContent='Signing in…';
    try{const state=await account.signIn($('login-email').value,$('login-password').value);$('login-password').value='';$('login-dialog').close();notify(state.demo?'Signed in to the demo account.':'Signed in.');}
    catch(error){$('login-result').textContent=error.message;}
    finally{$('login-submit').disabled=false;}
  };
  $('logout').onclick=async()=>{try{await account.signOut();notify('Signed out.');}catch{notify('Signed out on this device. The network request failed.');}};
  function fillEditor(){
    const record=getLocations().find(n=>n.id===$('admin-location').value&&n.kind!=='junction');if(!record)return;
    original=structuredClone(record);
    for(const key of ['name','category','floor','room','opening_hours','description','facilities','aliases'])$('edit-'+key).value=Array.isArray(record[key])?record[key].join('\n'):record[key]??'';
    $('admin-result').textContent='';
  }
  $('admin-location').onchange=fillEditor;
  $('admin-open').onclick=async()=>{
    try{
      await account.requireAdmin();
      const places=getLocations().filter(n=>n.kind!=='junction');
      // Build options as text nodes so location content cannot become markup.
      $('admin-location').replaceChildren(...places.map(n=>{const option=document.createElement('option');option.value=n.id;option.textContent=n.name;return option;}));
      $('category-options').replaceChildren(...[...new Set(places.map(n=>n.category))].map(value=>{const option=document.createElement('option');option.value=value;return option;}));
      $('admin-mode').textContent=account.state().demo?'Demo: changes are saved in this browser only.':'Changes are saved to Supabase and published to the campus map.';
      fillEditor();$('admin-dialog').showModal();
    }catch(error){notify(error.message);}
  };
  $('admin-close').onclick=()=>$('admin-dialog').close();
  $('admin-form').onsubmit=async event=>{
    event.preventDefault();if(saving||!original)return;
    saving=true;$('admin-save').disabled=true;$('admin-location').disabled=true;$('admin-result').textContent='Saving…';
    try{
      await account.requireAdmin();
      const values=Object.fromEntries(['name','category','floor','room','opening_hours','description','facilities','aliases'].map(key=>[key,$('edit-'+key).value]));
      const changes=locationChanges(values);
      const updated=await saveLocation(original.id,changes,original);
      await onSaved(updated);original=structuredClone(updated);
      const option=[...$('admin-location').options].find(n=>n.value===updated.id);if(option)option.textContent=updated.name;
      $('admin-result').textContent=account.state().demo?'Saved in this browser. The map has been updated.':'Saved to Supabase. The map has been updated.';
    }catch(error){$('admin-result').textContent=error.message;}
    finally{saving=false;$('admin-save').disabled=false;$('admin-location').disabled=false;}
  };
  return {fillEditor};
}
