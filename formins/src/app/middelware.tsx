// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
 
export function middleware(request: NextRequest) {
  // Get Firebase auth session cookie
  const session = request.cookies.get('session');
  
  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}
 
// Only protect the profile route
export const config = {
  matcher: '/profile'
}