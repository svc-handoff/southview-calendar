import { cookies } from 'next/headers';
import { adminCookie, sameOrigin } from '@/lib/admin/auth';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null,{status:403});
  (await cookies()).set(adminCookie,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});
  return Response.json({ok:true});
}
