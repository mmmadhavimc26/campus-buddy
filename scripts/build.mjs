import {cp,mkdir,writeFile} from 'node:fs/promises';
const url=(process.env.SUPABASE_URL??'').trim(),key=(process.env.SUPABASE_PUBLISHABLE_KEY??'').trim();
if(Boolean(url)!==Boolean(key))throw new Error('Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, or leave both empty for demo mode.');
if(url&&new URL(url).protocol!=='https:')throw new Error('Supabase URL must use HTTPS.');
if(key){
  if(key.startsWith('sb_secret_'))throw new Error('Secret keys must never be shipped to the browser. Use a publishable key.');
  if(!key.startsWith('sb_publishable_')){
    let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role;}catch{}
    if(role!=='anon')throw new Error('Use a Supabase publishable key or legacy anon key, never a service_role key.');
  }
}
await mkdir('dist',{recursive:true});
for(const file of ['index.html','styles.css','src','assets'])await cp(file,`dist/${file}`,{recursive:true});
await writeFile('dist/config.js',`window.CAMPUS_CONFIG = ${JSON.stringify({supabaseUrl:url,supabaseKey:key}).replace(/</g,'\\u003c')};\n`);
console.log(`Built dist/ (${url?'Supabase configured':'local demo mode'}).`);
