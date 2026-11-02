// middleware.ts - Next.js (App Router) Middleware para protección de rutas y expiración de 2 horas

export function middleware(request: any) {
  const { pathname } = request.nextUrl || { pathname: request.url };

  const isLoginPage = pathname === '/login';
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('favicon.ico');

  if (isPublicAsset) {
    return;
  }

  const cookies = request.cookies;
  const hasSupabaseCookie =
    cookies?.getAll?.()?.some((c: any) => c.name.startsWith('sb-') && c.value) ||
    cookies?.get?.('sb-demo-auth')?.value;

  // Verificación de expiración de 2 horas (7200 segundos)
  const expiresCookie = cookies?.get?.('sb-session-expires')?.value;
  const now = Date.now();
  const isExpired = expiresCookie ? now >= parseInt(expiresCookie, 10) : false;

  // 1. Si la sesión expiró (superó las 2 horas), redirigir a login con aviso
  if (hasSupabaseCookie && isExpired && !isLoginPage) {
    const expiredUrl = new URL('/login?expired=true', request.url);
    if (typeof Response !== 'undefined' && (Response as any).redirect) {
      const response = (Response as any).redirect(expiredUrl);
      return response;
    }
  }

  // 2. Si el usuario NO está autenticado y busca entrar al ERP, redirigir a /login
  if ((!hasSupabaseCookie || isExpired) && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    if (typeof Response !== 'undefined' && (Response as any).redirect) {
      return (Response as any).redirect(loginUrl);
    }
  }

  // 3. Si el usuario YA está autenticado y la sesión es válida (< 2 hs) e intenta ir a /login, redirigir al dashboard /
  if (hasSupabaseCookie && !isExpired && isLoginPage) {
    const dashboardUrl = new URL('/', request.url);
    if (typeof Response !== 'undefined' && (Response as any).redirect) {
      return (Response as any).redirect(dashboardUrl);
    }
  }

  return;
}

// Configuración de rutas protegidas
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
