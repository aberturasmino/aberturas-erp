import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Detectar cookies de sesión de Supabase
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => (c.name.startsWith('sb-') || c.name === 'sb-demo-auth') && Boolean(c.value)
  );

  // 2. Control de expiración (2 horas)
  const expiresCookie = request.cookies.get('sb-session-expires')?.value;
  const now = Date.now();
  const isExpired = expiresCookie ? now >= parseInt(expiresCookie, 10) : false;

  const isLoginPage = pathname === '/login';

  // Caso 1: Usuario no autenticado o sesión expirada intentando acceder a ruta protegida
  if ((!hasAuthCookie || isExpired) && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    if (isExpired && hasAuthCookie) {
      loginUrl.searchParams.set('expired', 'true');
    }
    const response = NextResponse.redirect(loginUrl);

    if (isExpired) {
      response.cookies.delete('sb-demo-auth');
      response.cookies.delete('sb-session-expires');
    }

    return response;
  }

  // Caso 2: Usuario con sesión activa válida intentando acceder a /login
  if (hasAuthCookie && !isExpired && isLoginPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Siempre retornar NextResponse.next() en Next.js (nunca retornar undefined)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Interceptar rutas excluyendo archivos estáticos y assets de Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
