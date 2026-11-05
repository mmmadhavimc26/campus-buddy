import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountClient} from '../src/account.js';
import {locationChanges} from '../src/location-editor.js';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
const config={supabaseUrl:'https://campus.supabase.co',supabaseKey:'sb_publishable_example'};
test('demo student cannot edit; demo administrator can; sign out removes access',async()=>{
  const storage=memory(),client=createAccountClient({}, {storage});
  await assert.rejects(client.signIn('student@demo.local','wrong'));
  await client.signIn('student@demo.local','Student123!');
  assert.equal(client.state().demo,true);await assert.rejects(client.requireAdmin());
  await client.signIn('admin@demo.local','Admin123!');await client.requireAdmin();
  assert.equal(client.state().admin,true);
  const restored=createAccountClient({}, {storage});await restored.restore();assert.equal(restored.state().admin,true);
  await client.signOut();await assert.rejects(client.requireAdmin());
});
test('real account role comes from protected membership, not user metadata',async()=>{
  const calls=[];
  const fetcher=async(url,options)=>{calls.push({url,options});
    if(url.includes('grant_type=password'))return reply({access_token:'user-token',refresh_token:'refresh',expires_in:3600,user:{id:'user-1',email:'student@example.com',user_metadata:{role:'admin'}}});
    if(url.includes('admin_users'))return reply([]);
    throw new Error('Unexpected request');
  };
  const client=createAccountClient(config,{fetcher,storage:memory()});
  await client.signIn('student@example.com','password');assert.equal(client.state().admin,false);await assert.rejects(client.requireAdmin());
  assert.equal(calls.find(n=>n.url.includes('admin_users')).options.headers.Authorization,'Bearer user-token');
  assert.ok(!JSON.stringify(client.state()).includes('password'));
});
test('real administrator membership is rechecked before editing',async()=>{
  let granted=true;
  const fetcher=async(url)=>url.includes('grant_type=password')?reply({access_token:'token',refresh_token:'refresh',expires_in:3600,user:{id:'admin-1'}}):reply(granted?[{user_id:'admin-1'}]:[]);
  const client=createAccountClient(config,{fetcher,storage:memory()});await client.signIn('admin@example.com','password');await client.requireAdmin();
  granted=false;await assert.rejects(client.requireAdmin());assert.equal(client.state().admin,false);
});
test('expired tokens refresh and demo sessions cannot be used with cloud configuration',async()=>{
  const storage=memory();storage.setItem('vjti-session:'+config.supabaseUrl,JSON.stringify({demo:true,role:'admin'}));
  const noDemo=createAccountClient(config,{storage,fetcher:()=>{throw new Error('A demo must not send auth requests');}});await noDemo.restore();assert.equal(noDemo.state().user,null);
  let refreshed=0;
  const fetcher=async(url,options)=>{
    if(url.includes('grant_type=password'))return reply({access_token:'expired',refresh_token:'refresh-1',expires_at:0,user:{id:'admin-1'}});
    if(url.includes('grant_type=refresh_token')){refreshed++;assert.equal(JSON.parse(options.body).refresh_token,'refresh-1');return reply({access_token:'fresh',refresh_token:'refresh-2',expires_in:3600});}
    assert.equal(options.headers.Authorization,'Bearer fresh');return reply([{user_id:'admin-1'}]);
  };
  const client=createAccountClient(config,{storage:memory(),fetcher});await client.signIn('admin@example.com','password');assert.equal(await client.token(),'fresh');assert.equal(refreshed,1);
});
test('location editor accepts only editable fields and validates names and lists',()=>{
  const result=locationChanges({name:' Updated library ',category:'Library',aliases:'CCF\nCCF\nBooks',facilities:'Reading room',kind:'junction',x:500});
  assert.equal(result.name,'Updated library');assert.deepEqual(result.aliases,['CCF','Books']);assert.ok(!('x' in result));assert.ok(!('kind' in result));
  assert.throws(()=>locationChanges({name:' ',category:'Library'}));
  assert.throws(()=>locationChanges({name:'Library',category:'Library',aliases:'x'.repeat(121)}));
});
