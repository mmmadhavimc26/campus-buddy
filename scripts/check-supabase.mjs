import {validateGraph} from '../src/graph.js';
import {layoutVersion} from '../src/data.js';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw new Error('Supabase environment variables are missing.');
const results={};
async function check(name,path){
  try{
    const response=await fetch(url+path,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
    const value=await response.json();
    results[name]={status:response.status,...(response.ok&&Array.isArray(value)?{rows:value.length}:{}),...(response.ok?{}:{code:value.code,message:value.message??value.msg??value.error_description})};
    return response.ok?value:null;
  }catch(error){results[name]={error:error.cause?.code??error.message};return null;}
}
const nodes=await check('locations','/rest/v1/locations?select=*');
const edges=await check('paths','/rest/v1/paths?select=*');
if(nodes&&edges){try{validateGraph(nodes,edges);results.layout={valid:nodes.every(n=>n.layout_version===layoutVersion)};}catch(error){results.layout={valid:false,error:error.message};}}
await check('feedbackVisitorRead','/rest/v1/feedback?select=id&limit=1');
await check('adminVisitorRead','/rest/v1/admin_users?select=user_id&limit=1');
const settings=await check('auth','/auth/v1/settings');
if(settings)results.auth.emailEnabled=Boolean(settings.external?.email);
results.ready=Boolean(nodes&&edges&&results.layout?.valid&&settings?.external?.email&&[401,403].includes(results.feedbackVisitorRead.status)&&[401,403].includes(results.adminVisitorRead.status));
console.log(JSON.stringify(results,null,2));
if(!results.ready)process.exitCode=1;
