import type { NextRequest } from 'next/server';

/**
 * NextResponse compatible con Vercel (Node.js 24.x y Edge)
 * Implementa la especificación de headers de Vercel ('x-middleware-next', 'Location')
 * sin importar paquetes CJS internos de Next.js que causan 'ReferenceError: __dirname is not defined'.
 */
export class NextResponse extends Response {
  static redirect(url: string | URL, init?: number | ResponseInit): NextResponse {
    const status = typeof init === 'number' ? init : (init?.status ?? 307);
    const headers = new Headers(typeof init === 'object' ? init?.headers : undefined);
    headers.set('Location', url.toString());
    return new NextResponse(null, {
      ...(typeof init === 'object' ? init : {}),
      status,
      headers,
    });
  }

  static next(init?: ResponseInit): NextResponse {
    const headers = new Headers(init?.headers);
    headers.set('x-middleware-next', '1');
    return new NextResponse(null, {
      ...init,
      headers,
    });
  }

  get cookies() {
    return {
      delete: (name: string) => {
        this.headers.append(
          'Set-Cookie',
          `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        );
      },
      set: (name: string, value: string) => {
        this.headers.append('Set-Cookie', `${name}=${value}; Path=/; SameSite=Lax`);
      },
    };
  }
}

export const config = {
  matcher: [
    /*
     * Interceptar rutas de la aplicación excluyendo assets estáticos de Vite y Next
     */
    '/((?!assets|favicon.ico|_next|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)',
  ],
};

export function middleware(request: any, responseOrEvent?: any) {
  // Manejar URLs tanto de Web standard (Request) como de Node.js (http.IncomingMessage)
  let url: URL;
  try {
    if (typeof request?.url === 'string' && request.url.startsWith('http')) {
      url = new URL(request.url);
    } else {
      const host =
        (typeof request?.headers?.get === 'function' ? request.headers.get('host') : null) ||
        request?.headers?.['x-forwarded-host'] ||
        request?.headers?.host ||
        'localhost';
      const proto =
        (typeof request?.headers?.get === 'function' ? request.headers.get('x-forwarded-proto') : null) ||
        request?.headers?.['x-forwarded-proto'] ||
        'https';
      url = new URL(request?.url || '/', `${proto}://${host}`);
    }
  } catch (_) {
    url = new URL('/', 'https://localhost');
  }

  const { pathname } = url;

  // 1. Detectar cookies de sesión de Supabase (Web Request o Node IncomingMessage)
  let cookieHeader = '';
  if (typeof request?.headers?.get === 'function') {
    cookieHeader = request.headers.get('cookie') || '';
  } else if (request?.headers?.cookie) {
    cookieHeader = String(request.headers.cookie);
  }

  let allCookies: { name: string; value: string }[] = [];

  if (request?.cookies && typeof request.cookies.getAll === 'function') {
    allCookies = request.cookies.getAll();
  } else {
    allCookies = cookieHeader
      .split(';')
      .filter(Boolean)
      .map((c) => {
        const [k, ...v] = c.trim().split('=');
        return { name: k, value: v.join('=') };
      });
  }

  const hasAuthCookie = allCookies.some(
    (c) => (c.name.startsWith('sb-') || c.name === 'sb-demo-auth') && Boolean(c.value)
  );

  // 2. Control de expiración (2 horas)
  const expiresCookie = allCookies.find((c) => c.name === 'sb-session-expires')?.value;
  const now = Date.now();
  const isExpired = expiresCookie ? now >= parseInt(expiresCookie, 10) : false;

  const isLoginPage = pathname === '/login';

  // Helper para responder según sea Node ServerResponse o Web Response
  const sendRedirect = (redirectUrl: URL, deleteSessionCookies = false) => {
    if (responseOrEvent && typeof responseOrEvent.writeHead === 'function') {
      const headers: Record<string, string | string[]> = {
        Location: redirectUrl.toString(),
      };
      if (deleteSessionCookies) {
        headers['Set-Cookie'] = [
          'sb-demo-auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
          'sb-session-expires=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
        ];
      }
      responseOrEvent.writeHead(307, headers);
      responseOrEvent.end();
    }
    const resp = NextResponse.redirect(redirectUrl);
    if (deleteSessionCookies) {
      resp.cookies.delete('sb-demo-auth');
      resp.cookies.delete('sb-session-expires');
    }
    return resp;
  };

  const sendNext = () => {
    if (responseOrEvent && typeof responseOrEvent.setHeader === 'function') {
      responseOrEvent.setHeader('x-middleware-next', '1');
      if (typeof responseOrEvent.end === 'function') {
        responseOrEvent.end();
      }
    }
    return NextResponse.next();
  };

  // Caso 1: Usuario no autenticado o sesión expirada intentando acceder a ruta protegida
  if ((!hasAuthCookie || isExpired) && !isLoginPage) {
    const loginUrl = new URL('/login', url);
    if (isExpired && hasAuthCookie) {
      loginUrl.searchParams.set('expired', 'true');
    }
    return sendRedirect(loginUrl, isExpired);
  }

  // Caso 2: Usuario con sesión activa válida intentando acceder a /login
  if (hasAuthCookie && !isExpired && isLoginPage) {
    const dashboardUrl = new URL('/', url);
    return sendRedirect(dashboardUrl, false);
  }

  // Caso 3: Permitir la solicitud
  return sendNext();
}

// Exportación default y named para compatibilidad total con Vercel Serverless Functions y Edge Middleware
export default middleware;
export { middleware as handler };
