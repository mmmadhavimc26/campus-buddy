export function createAccountClient(config,{fetcher=globalThis.fetch,storage=globalThis.sessionStorage,onChange=()=>{}}={}){
  const configured=Boolean(config.supabaseUrl&&config.supabaseKey);
  const storageKey=`vjti-session:${configured?config.supabaseUrl:'demo'}`;
  let session=null,user=null,admin=false,refreshing=null;
  const state=()=>({user,admin,demo:Boolean(session?.demo),configured});
  function remember(){try{if(session)storage?.setItem(storageKey,JSON.stringify(session));else storage?.removeItem(storageKey);}catch{}}
  function clear(){session=null;user=null;admin=false;remember();onChange(state());}
  async function request(path,{method='GET',body,token}={}){
    const response=await fetcher(`${config.supabaseUrl}${path}`,{method,headers:{apikey:config.supabaseKey,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
    const text=await response.text();let result=null;try{result=text?JSON.parse(text):null;}catch{}
    if(!response.ok)throw new Error(result?.msg||result?.error_description||result?.message||'The request failed. Please try again.');
    return result;
  }
  async function token(){
    if(!configured||!session||session.demo)return null;
    if(session.expires_at*1000>Date.now()+60000)return session.access_token;
    if(!refreshing)refreshing=(async()=>{try{
      const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
      session={...next,expires_at:next.expires_at??Math.floor(Date.now()/1000)+next.expires_in};remember();return session.access_token;
    }catch(error){clear();throw new Error('Your session expired. Please sign in again.');}finally{refreshing=null;}})();
    return refreshing;
  }
  async function loadRole(){
    admin=false;
    const rows=await request('/rest/v1/admin_users?select=user_id',{token:await token()});
    admin=Array.isArray(rows)&&rows.some(row=>row.user_id===user.id);
  }
  async function signIn(email,password){
    clear();
    if(!configured){
      const demos=[{email:'admin@demo.local',password:'Admin123!',id:'demo-admin',role:'admin'},{email:'student@demo.local',password:'Student123!',id:'demo-student',role:'user'}];
      const match=demos.find(n=>n.email===email.trim().toLowerCase()&&n.password===password);
      if(!match)throw new Error('Incorrect demo email or password.');
      user={id:match.id,email:match.email};admin=match.role==='admin';session={demo:true,user,role:match.role};remember();onChange(state());return state();
    }
    const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email.trim(),password}});
    session={...result,expires_at:result.expires_at??Math.floor(Date.now()/1000)+result.expires_in};user=result.user;remember();
    try{await loadRole();}catch{clear();throw new Error('Account permissions could not be loaded. Run the updated database schema, then sign in again.');}
    onChange(state());return state();
  }
  async function restore(){
    let saved;try{saved=JSON.parse(storage?.getItem(storageKey)||'null');}catch{}
    if(!saved)return state();
    if(!configured&&saved.demo){
      const role=saved.role==='admin'?'admin':'user';user={id:role==='admin'?'demo-admin':'demo-student',email:role==='admin'?'admin@demo.local':'student@demo.local'};admin=role==='admin';session={demo:true,user,role};onChange(state());return state();
    }
    if(!configured||saved.demo)return state();
    session=saved;
    try{user=await request('/auth/v1/user',{token:await token()});await loadRole();onChange(state());}catch{clear();}
    return state();
  }
  async function signOut(){const access=await token().catch(()=>null);try{if(access)await request('/auth/v1/logout',{method:'POST',token:access});}finally{clear();}}
  async function requireAdmin(){
    if(configured&&user){await loadRole();onChange(state());}
    if(!user||!admin)throw new Error('Administrator access is required.');
  }
  return {state,token,restore,signIn,signOut,requireAdmin};
}
