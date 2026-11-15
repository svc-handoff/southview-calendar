import assert from 'node:assert/strict';
import test from 'node:test';
import {getGlobalDispatcher,MockAgent,setGlobalDispatcher} from 'undici';
import {readPrivateDocument,updatePrivateDocument} from '../lib/private-store.ts';

test('large private directories retain strong ETags and accept successive bulk appends',async()=>{
 const originalDispatcher=getGlobalDispatcher(),agent=new MockAgent();agent.disableNetConnect();setGlobalDispatcher(agent);
 const previousToken=process.env.BLOB_READ_WRITE_TOKEN;process.env.BLOB_READ_WRITE_TOKEN='vercel_blob_rw_teststore_fake-test-credential';
 const person=i=>({id:String(i),name:`Person ${i} Example`,birthDate:'1940-04-03'});
 let document={people:Array.from({length:5000},(_,i)=>person(i))},version=1,writes=0;
 const etag=()=>`"version-${version}"`;
 agent.get('https://teststore.private.blob.vercel-storage.com')
  .intercept({path:'/remember/people.json?cache=0',method:'GET'})
  .reply(options=>({statusCode:200,data:JSON.stringify(document),responseOptions:{headers:{
   'content-type':'application/json',
   // Compression would produce a weak ETag, as the real large-file response did.
   etag:new Headers(options.headers).get('accept-encoding')==='identity'?etag():`W/${etag()}`,
  }}})).persist();
 agent.get('https://vercel.com').intercept({path:'/api/blob/?pathname=remember%2Fpeople.json',method:'PUT'})
  .reply(options=>{
   assert.equal(new Headers(options.headers).get('x-if-match'),etag(),'writes use the exact strong version tag from the read');
   document=JSON.parse(options.body);version++;writes++;
   return {statusCode:200,data:{url:'https://teststore.private.blob.vercel-storage.com/remember/people.json',pathname:'remember/people.json',etag:etag()}};
  }).persist();
 try{
  for(const [start,count] of [[5000,3513],[8513,1487]]){
   const actual=await updatePrivateDocument('remember/people.json',{people:[]},data=>{
    data.people.push(...Array.from({length:count},(_,i)=>person(start+i)));return {data,result:data.people.length};
   });
   assert.equal(actual,start+count);
  }
  assert.equal(writes,2);assert.equal((await readPrivateDocument('remember/people.json',{people:[]})).data.people.length,10000);
 }finally{
  setGlobalDispatcher(originalDispatcher);await agent.close();
  if(previousToken===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=previousToken;
 }
});
