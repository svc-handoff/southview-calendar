import {isAdmin,sameOrigin} from '@/lib/admin/auth';
import {readSiteVisibility,setSiteVisibility} from '@/lib/site-visibility';

export const runtime='nodejs';
export const dynamic='force-dynamic';
function reply(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store'}});}

export async function GET(){
  if(!await isAdmin())return reply({error:'Please sign in.'},401);
  try {return reply(await readSiteVisibility());}
  catch {return reply({error:'The website setting could not be loaded.'},503);}
}

export async function POST(request:Request){
  if(!sameOrigin(request))return reply({error:'Please use this website’s admin dashboard.'},403);
  if(!await isAdmin())return reply({error:'Your session has ended. Please sign in again.'},401);
  let body:unknown;
  try {body=await request.json();}catch{return reply({error:'Choose whether to hide the website.'},400);}
  if(!body||typeof body!=='object'||!('hidden' in body)||typeof body.hidden!=='boolean')return reply({error:'Choose whether to hide the website.'},400);
  try {return reply(await setSiteVisibility(body.hidden));}
  catch {return reply({error:'The website setting could not be saved. Please try again.'},503);}
}
