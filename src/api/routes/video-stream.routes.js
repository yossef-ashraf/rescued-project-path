function extractDriveId(val) {
  if (!val) return null;
  const str = String(val).trim();
  const m = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) return str;
  return null;
}

export const videoStreamRoutes = {
  'video-stream': {
    GET: async (req) => {
      try {
        const url = new URL(req.url);
        const rawId = url.searchParams.get('id') || url.searchParams.get('url');
        const fileId = extractDriveId(rawId);

        if (!fileId) {
          return new Response('Missing video id or drive url', { status: 400 });
        }

        const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
        const rangeHeader = req.headers.get('range');
        const fetchHeaders = {};
        if (rangeHeader) {
          fetchHeaders['Range'] = rangeHeader;
        }

        const driveRes = await fetch(targetUrl, {
          headers: fetchHeaders,
          redirect: 'follow'
        });

        const headers = new Headers();
        headers.set('Content-Type', driveRes.headers.get('content-type') || 'video/mp4');
        headers.set('Accept-Ranges', 'bytes');
        const origin = req.headers.get('origin');
        const host = req.headers.get('host');
        if (origin) {
          try {
            const parsed = new URL(origin);
            if (parsed.host === host || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
              headers.set('Access-Control-Allow-Origin', origin);
              headers.set('Vary', 'Origin');
            }
          } catch {}
        }
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

        if (driveRes.headers.get('content-range')) {
          headers.set('Content-Range', driveRes.headers.get('content-range'));
        }
        if (driveRes.headers.get('content-length')) {
          headers.set('Content-Length', driveRes.headers.get('content-length'));
        }

        return new Response(driveRes.body, {
          status: driveRes.status,
          headers
        });
      } catch (err) {
        console.error('Failed to stream video:', err);
        return new Response('Video streaming error', { status: 500 });
      }
    },
    OPTIONS: async (req) => {
      const origin = req.headers.get('origin');
      const host = req.headers.get('host');
      const headers = new Headers({
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept'
      });
      try {
        const parsed = origin ? new URL(origin) : null;
        if (parsed && (parsed.host === host || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
          headers.set('Access-Control-Allow-Origin', origin);
          headers.set('Vary', 'Origin');
        }
      } catch {}
      return new Response(null, {
        status: 204,
        headers
      });
    }
  }
};

export default videoStreamRoutes;
