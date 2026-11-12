export function apiError(err, status = 500) {
    console.error('[API Error Detail]:', err);

    const rawMsg = String(err?.message || '');
    const isDbQuotaOrSuspended =
        rawMsg.includes('planLimitReached') ||
        rawMsg.includes('suspended') ||
        rawMsg.includes('Failed to identify your database');

    const finalStatus = isDbQuotaOrSuspended ? 503 : status;
    const clientMessage = isDbQuotaOrSuspended
        ? 'قاعدة البيانات متوقفة مؤقتاً بسبب انتهاء الباقة المجانية في Prisma Postgres (planLimitReached). يرجى ربط قاعدة بيانات جديدة (مثل Neon) من Vercel Storage.'
        : (finalStatus >= 500
            ? 'An internal server error occurred. Please try again.'
            : (rawMsg || 'Invalid request.'));

    return Response.json(
        {
            ok: false,
            error: clientMessage,
            code: isDbQuotaOrSuspended ? 'DB_QUOTA_REACHED' : 'API_ERROR',
            status: finalStatus
        },
        {
            status: finalStatus,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Content-Type-Options': 'nosniff'
            }
        }
    );
}

export default apiError;
