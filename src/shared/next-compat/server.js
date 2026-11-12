/** Minimal next/server stand-in for the original API code. */
export class NextResponse extends Response {
    static json(body, init) { return Response.json(body, init); }
    static redirect(url, status = 307) { return Response.redirect(url, status); }
    static next() { return new Response(null, { status: 200 }); }
}
