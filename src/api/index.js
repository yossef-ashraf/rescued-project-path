import { routes } from './routes/index.js';

export async function handleApiRequest(req, ctx) {
  try {
    const requestOrigin = req.headers.get('origin') || '';
    const requestHost = req.headers.get('host') || '';
    let allowedOrigin = '';
    if (requestOrigin) {
      try {
        const parsed = new URL(requestOrigin);
        if (parsed.host === requestHost || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          allowedOrigin = requestOrigin;
        }
      } catch {}
    }
    let pathname = '';

    if (ctx && ctx.params) {
      const resolvedParams = await ctx.params;
      if (Array.isArray(resolvedParams?.route)) {
        pathname = resolvedParams.route.join('/');
      }
    }

    if (!pathname) {
      const url = new URL(req.url);
      let p = url.pathname;
      if (p.startsWith('/api/')) {
        p = p.slice(5);
      } else if (p.startsWith('/api')) {
        p = p.slice(4);
      }
      pathname = p.replace(/^\/+|\/+$/g, '');
    }

    let routeEntry = routes[pathname];
    let matchedParams = {};

    if (!routeEntry) {
      // Dynamic route matching for routes with :param or wildcard
      for (const [pattern, entry] of Object.entries(routes)) {
        if (pattern.includes(':') || pattern.includes('*')) {
          const paramNames = [];
          const regexStr = '^' + pattern
            .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
              paramNames.push(name);
              return '([^/]+)';
            })
            .replace(/\*/g, '(.*)') + '$';
          const match = pathname.match(new RegExp(regexStr));
          if (match) {
            routeEntry = entry;
            paramNames.forEach((name, idx) => {
              matchedParams[name] = match[idx + 1];
            });
            break;
          }
        }
      }
    }

    if (!routeEntry) {
      return Response.json({ error: `Route /api/${pathname} not found` }, { status: 404 });
    }

    if (ctx) {
      ctx.matchedParams = matchedParams;
    }

    const method = req.method ? req.method.toUpperCase() : 'GET';
    const handler = routeEntry[method];

    if (!handler) {
      if (method === 'OPTIONS') {
        const allowedMethods = Object.keys(routeEntry).concat('OPTIONS').join(', ');
        return new Response(null, {
          status: 204,
          headers: {
            ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' } : {}),
            'Access-Control-Allow-Methods': allowedMethods,
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
          }
        });
      }
      return Response.json({ error: `Method ${method} not allowed on /api/${pathname}` }, { status: 405 });
    }

    return await handler(req, ctx);
  } catch (err) {
    console.error('[API Dispatcher Error]:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export { routes };
export default handleApiRequest;
