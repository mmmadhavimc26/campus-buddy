import test from 'node:test';
import assert from 'node:assert/strict';
test('demo login, administrator editing and student access work end to end',async()=>{
  const nodes=new Map(),store=new Map();
  const storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};
  const $=id=>{
    if(!nodes.has(id))nodes.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,open:false,options:[],dataset:{},
      setAttribute(){},addEventListener(){},focus(){},showModal(){this.open=true;},close(){this.open=false;},
      replaceChildren(...items){this.options=items;this.value=items[0]?.value??'';},getBoundingClientRect(){return {width:1000,height:760};}});
    return nodes.get(id);
  };
  globalThis.document={getElementById:$,addEventListener(){},createElement:()=>({value:'',textContent:''})};
  globalThis.window={CAMPUS_CONFIG:{}};globalThis.localStorage=storage;globalThis.sessionStorage=storage;
  await import('../src/app.js');
  $('login-open').onclick();assert.equal($('demo-logins').hidden,false);
  $('demo-admin').onclick();await $('login-form').onsubmit({preventDefault(){}});
  assert.equal($('admin-open').hidden,false);assert.equal($('login-password').value,'');
  await $('admin-open').onclick();assert.equal($('admin-dialog').open,true);
  $('admin-location').value='library';$('admin-location').onchange();
  $('edit-name').value='Library & Reading Room';$('edit-description').value='Reference books and a quiet reading area.';$('edit-opening_hours').value='Mon–Fri, 9 am–5 pm';
  await $('admin-form').onsubmit({preventDefault(){}});
  assert.match($('admin-result').textContent,/Saved in this browser/);
  assert.match($('directory').innerHTML,/Library &amp; Reading Room/);
  assert.match($('campus-map').innerHTML,/Library &amp; Reading Room/);
  assert.equal(JSON.parse(store.get('vjti-demo-location-edits')).library.opening_hours,'Mon–Fri, 9 am–5 pm');
  await $('logout').onclick();assert.equal($('admin-open').hidden,true);assert.equal($('admin-dialog').open,false);
  $('demo-student').onclick();await $('login-form').onsubmit({preventDefault(){}});
  assert.equal($('account-label').textContent,'Demo student');assert.equal($('admin-open').hidden,true);
  await $('admin-open').onclick();assert.equal($('admin-dialog').open,false);
});
