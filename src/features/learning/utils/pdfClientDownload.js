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
    params.set('mode', 'download');

    const url = `/api/learning/courses/${encodeURIComponent(courseId)}/pdf?${params.toString()}`;
    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { Accept: 'application/pdf' }
        });
    } catch (error) {
        if (fallbackElement) return downloadElementAsPdf(fallbackElement, fallbackFileName);
        throw error;
    }

    if (!response.ok) {
        let errorMessage = `Failed to generate PDF (HTTP ${response.status})`;
        try {
            const errJson = await response.json();
            if (errJson?.error || errJson?.message) {
                errorMessage = errJson.error || errJson.message;
            }
        } catch {
            // ignore json parse error
        }
        if (fallbackElement) return downloadElementAsPdf(fallbackElement, fallbackFileName);
        throw new Error(errorMessage);
    }

    let resolvedFileName = fallbackFileName;
    const customHeaderName = response.headers.get('X-Export-Filename');
    if (customHeaderName) {
        try {
            resolvedFileName = decodeURIComponent(customHeaderName);
        } catch {
            resolvedFileName = customHeaderName;
        }
    } else {
        const disposition = response.headers.get('Content-Disposition') || '';
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match && utf8Match[1]) {
            try {
                resolvedFileName = decodeURIComponent(utf8Match[1].trim());
            } catch {
                resolvedFileName = utf8Match[1].trim();
            }
        }
    }

    if (!resolvedFileName.toLowerCase().endsWith('.pdf')) {
        resolvedFileName = `${resolvedFileName}.pdf`;
    }

    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(pdfBlob);

    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = resolvedFileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();

    window.setTimeout(() => {
        try {
            document.body.removeChild(anchor);
        } catch {
            // ignore
        }
        window.URL.revokeObjectURL(blobUrl);
    }, 3000);

    return true;
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
