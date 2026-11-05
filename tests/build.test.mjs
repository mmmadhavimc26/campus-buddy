import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('build refuses server secrets and incomplete cloud configuration',()=>{
  for(const overrides of [
    {SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_secret_do-not-ship'},
    {SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:''},
    {SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:`a.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.b`}
  ]){
    const result=spawnSync(process.execPath,['scripts/build.mjs'],{env:{...process.env,...overrides},encoding:'utf8'});
    assert.notEqual(result.status,0);
  }
});
