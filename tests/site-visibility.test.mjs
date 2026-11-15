import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getGlobalDispatcher,MockAgent,setGlobalDispatcher} from 'undici';
import ts from 'typescript';
import {publicSiteHidden,readSiteVisibility,setSiteVisibility} from '../lib/site-visibility.ts';

test('the kill switch defaults off, persists both changes, and hides the site on storage failure',async()=>{
 const dispatcher=getGlobalDispatcher(),agent=new MockAgent();agent.disableNetConnect();setGlobalDispatcher(agent);
 const previousToken=process.env.BLOB_READ_WRITE_TOKEN;process.env.BLOB_READ_WRITE_TOKEN='vercel_blob_rw_teststore_fake-test-credential';
 let document=null,version=0,failure=false;
 const etag=()=>`"version-${version}"`;
 agent.get('https://teststore.private.blob.vercel-storage.com')
  .intercept({path:'/site/visibility.json?cache=0',method:'GET'})
  .reply(()=>failure?{statusCode:503,data:'Unavailable'}:document===null?{statusCode:404,data:'Not found'}:{statusCode:200,data:JSON.stringify(document),responseOptions:{headers:{'content-type':'application/json',etag:etag()}}}).persist();
 agent.get('https://vercel.com').intercept({path:'/api/blob/?pathname=site%2Fvisibility.json',method:'PUT'})
  .reply(options=>{
   if(document!==null)assert.equal(new Headers(options.headers).get('x-if-match'),etag());
   document=JSON.parse(options.body);version++;
   return {statusCode:200,data:{url:'https://teststore.private.blob.vercel-storage.com/site/visibility.json',pathname:'site/visibility.json',etag:etag()}};
  }).persist();
 try{
  assert.equal(await publicSiteHidden(),false);
  assert.deepEqual(await setSiteVisibility(true),{hidden:true});assert.equal(await publicSiteHidden(),true);
  assert.deepEqual(await readSiteVisibility(),{hidden:true});
  assert.deepEqual(await setSiteVisibility(false),{hidden:false});assert.equal(await publicSiteHidden(),false);
  failure=true;assert.equal(await publicSiteHidden(),true);await assert.rejects(readSiteVisibility());
  failure=false;document={hidden:'false'};assert.equal(await publicSiteHidden(),true);
 }finally{
  setGlobalDispatcher(dispatcher);await agent.close();
  if(previousToken===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=previousToken;
 }
});

test('the public guard renders absolutely no content when hidden and restores normal content when visible',async()=>{
 const source=readFileSync(new URL('../components/public-site-guard.tsx',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replaceAll("from 'react'",'from '+JSON.stringify(import.meta.resolve('react')));
 const {PublicSiteGuard}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
 const content=createElement('main',null,'Calendar and birthday search');
 assert.equal(renderToStaticMarkup(createElement(PublicSiteGuard,{initialHidden:true},content)),'');
 assert.equal(renderToStaticMarkup(createElement(PublicSiteGuard,{initialHidden:false},content)),'<main>Calendar and birthday search</main>');
});
