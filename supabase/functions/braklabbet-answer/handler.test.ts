import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleAnswer, type AnswerDeps } from "./handler.ts";
const school={id:'school-test',email:'test@leteboskolan.se',email_confirmed_at:'2026-01-01',identities:[{provider:'google',identity_data:{email:'test@leteboskolan.se',email_verified:true}}]};
const ok=<T>(data:T)=>Promise.resolve({data,error:null});
const input={request_id:'12345678-1234-4123-8123-123456789012',exercise_id:1,answer:'1/4',hint_used:true};
const deps=(changes:Partial<AnswerDeps>={}):AnswerDeps=>({headers:{},getUser:()=>ok({user:school}),getAdminRoles:()=>ok([]),getAccessStatus:()=>ok({status:'approved'}),record:(userId,p,correct)=>ok({userId,...p,is_correct:correct}),...changes});
const request=(body:unknown=input,token=true)=>new Request('http://localhost',{method:'POST',headers:token?{Authorization:'Bearer test'}:{},body:JSON.stringify(body)});
Deno.test('server computes wrong answer and authenticated owner',async()=>{
 const r=await handleAnswer(request(),deps());assertEquals(r.status,200);
 const d=await r.json();assertEquals(d.row.is_correct,false);assertEquals(d.row.userId,'school-test');assertEquals(d.row.hint_used,true);
});
Deno.test('no token and invalid token cannot record',async()=>{
 assertEquals((await handleAnswer(request(input,false),deps())).status,401);
 assertEquals((await handleAnswer(request(),deps({getUser:()=>ok({user:null})}))).status,401);
});
Deno.test('denied school account cannot record',async()=>assertEquals((await handleAnswer(request(),deps({getAccessStatus:()=>ok({status:'denied'})}))).status,403));
Deno.test('extra owner or correctness fields rejected',async()=>{
 assertEquals((await handleAnswer(request({...input,user_id:'other'}),deps())).status,400);
 assertEquals((await handleAnswer(request({...input,is_correct:true}),deps())).status,400);
});
Deno.test('database failure is not successful saving',async()=>assertEquals((await handleAnswer(request(),deps({record:()=>Promise.resolve({data:null,error:'failure'})}))).status,503));