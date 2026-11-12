'use client';

/**
 * Triggers a direct client-side download of a server-compiled vector PDF
 * from `/api/learning/courses/:courseId/pdf` without navigating away or opening a new tab.
 */
export async function downloadCoursePdfFile({
    courseId,
    lessonId = null,
    fallbackFileName = 'document.pdf',
    fallbackElement = null
}) {
    if (!courseId || typeof window === 'undefined') return false;

    const params = new URLSearchParams();
    if (lessonId && String(lessonId).trim() !== '' && lessonId !== 'all') {
        params.set('lessonId', String(lessonId));
    }
    params.set('mode', 'html');

    const url = `/api/learning/courses/${encodeURIComponent(courseId)}/pdf?${params.toString()}`;
    let response;
    try {
        response = await fetch(url, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'text/html' } });
    } catch (error) {
        if (fallbackElement) return downloadElementAsPdf(fallbackElement, fallbackFileName);
        throw error;
    }
    if (!response.ok) {
        if (fallbackElement) return downloadElementAsPdf(fallbackElement, fallbackFileName);
        throw new Error(`Failed to generate PDF (HTTP ${response.status})`);
    }
    const html = await response.text();
    return downloadHtmlAsPdf(html, fallbackFileName);
}

/** Compiles a full HTML document (styles included) into a downloaded PDF in the browser. */
export async function downloadHtmlAsPdf(html, fileName = 'document.pdf') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const host = document.createElement('div');
    host.setAttribute('dir', doc.documentElement.getAttribute('dir') || 'rtl');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;color:#111;';
    doc.querySelectorAll('style').forEach((st) => host.appendChild(st.cloneNode(true)));
    const body = document.createElement('div');
    body.innerHTML = doc.body ? doc.body.innerHTML : html;
    host.appendChild(body);
    document.body.appendChild(host);
    try {
        if (document.fonts?.ready) await document.fonts.ready;
        return await downloadElementAsPdf(body, fileName);
    } finally {
        host.remove();
    }
}

/**
 * Client-side fallback for Safari/iOS or deployments without a Chromium binary.
 * The dependency already exists in the project; keeping this path lazy avoids
 * loading the PDF compiler on ordinary pages.
 */
export async function downloadElementAsPdf(element, fileName = 'document.pdf') {
    if (!element || typeof window === 'undefined') return false;
    const pdfModule = await import('html2pdf.js');
    const html2pdf = pdfModule.default || pdfModule;
    const safeName = String(fileName).toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    await html2pdf()
        .set({
            margin: [8, 8, 10, 8],
            filename: safeName,
            image: { type: 'jpeg', quality: 0.96 },
            html2canvas: { scale: Math.min(2, window.devicePixelRatio || 1.5), useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        })
        .from(element)
        .save();
    return true;
}
