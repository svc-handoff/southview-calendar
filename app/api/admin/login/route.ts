import { cookies } from 'next/headers';
import { adminCookie, allowLogin, createSession, sameOrigin, sessionLifetime, verifyCredentials } from '@/lib/admin/auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:'Please sign in from this website.'},{status:403});
  if (Number(request.headers.get('content-length') || 0)>4096) return new Response(null,{status:413});
  try {
    if (!await allowLogin(request)) return Response.json({error:'Too many attempts. Please wait 15 minutes and try again.'},{status:429});
    const {email,password}=await request.json();
    if (typeof email!=='string' || typeof password!=='string' || !verifyCredentials(email,password)) return Response.json({error:'Email or password is incorrect.'},{status:401});
    (await cookies()).set(adminCookie,createSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:sessionLifetime});
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Sign-in is unavailable. Please try again shortly.'},{status:503}); }
}
