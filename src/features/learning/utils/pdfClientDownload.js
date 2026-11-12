'use client';

/**
 * Course / lecture PDF download, compiled in the browser.
 * The server returns the printable HTML view (`/api/learning/courses/:id/pdf?mode=html`);
 * each top-level section (cover, contents, every lecture, appendix) is rasterised on its own
 * page run so long courses never exceed the browser's canvas limits.
 */

const SECTION_SELECTOR = '.cover-page, .toc-page, .lecture-chapter, .addon-section';
const MAX_CANVAS_PX = 30000; // Chromium/Safari refuse taller canvases.
const PAGE_WIDTH_PX = 794; // A4 at 96 dpi.

// html2canvas mis-measures a few print styles; these keep the raster output faithful.
const RASTER_FIXES = `
  .pdf-raster, .pdf-raster * { letter-spacing: 0 !important; }
  .pdf-raster .brand-name { letter-spacing: 1px !important; }
  .pdf-raster .brand-right { overflow: visible !important; white-space: normal !important; text-overflow: clip !important; line-height: 1.4 !important; }
  .pdf-raster [class*="badge"] { display: inline-block !important; line-height: 1.5 !important; vertical-align: middle; }
  .pdf-raster.page-break-before, .pdf-raster.page-break-after, .pdf-raster .page-break-before, .pdf-raster .page-break-after { break-before: auto !important; break-after: auto !important; page-break-before: auto !important; page-break-after: auto !important; }
  .pdf-raster h1, .pdf-raster h2, .pdf-raster h3, .pdf-raster h4, .pdf-raster pre, .pdf-raster table, .pdf-raster tr, .pdf-raster img, .pdf-raster figure, .pdf-raster li, .pdf-raster blockquote { break-inside: avoid; page-break-inside: avoid; }
  .pdf-raster .cover-page { min-height: 268mm !important; }
`;

function safeFileName(name) {
    const base = String(name || 'document').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document';
    return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

export async function downloadCoursePdfFile({ courseId, lessonId = null, fallbackFileName = 'document.pdf', fallbackElement = null }) {
    if (!courseId || typeof window === 'undefined') return false;

    const params = new URLSearchParams({ mode: 'html' });
    if (lessonId && String(lessonId).trim() !== '' && lessonId !== 'all') params.set('lessonId', String(lessonId));

    let response;
    try {
        response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/pdf?${params}`, {
            method: 'GET', cache: 'no-store', headers: { Accept: 'text/html' },
        });
    } catch (error) {
        if (fallbackElement) return downloadElementAsPdf(fallbackElement, fallbackFileName);
        throw error;
    }
    if (!response.ok) {
        if (fallbackElement) return downloadElementAsPdf(fallbackElement, fallbackFileName);
        throw new Error(`Could not prepare the PDF (HTTP ${response.status}).`);
    }
    return downloadHtmlAsPdf(await response.text(), fallbackFileName);
}

/** Compiles a full HTML document (styles included) into a downloaded PDF. */
export async function downloadHtmlAsPdf(html, fileName = 'document.pdf') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const host = document.createElement('div');
    const dir = doc.documentElement.getAttribute('dir') || 'rtl';
    host.setAttribute('dir', dir);
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = `position:fixed;left:0;top:0;width:${PAGE_WIDTH_PX}px;background:#fff;color:#111;z-index:-1;opacity:0;pointer-events:none;`;
    doc.querySelectorAll('style').forEach((st) => host.appendChild(st.cloneNode(true)));
    const fixes = document.createElement('style');
    fixes.textContent = RASTER_FIXES;
    host.appendChild(fixes);
    const body = document.createElement('div');
    body.innerHTML = doc.body ? doc.body.innerHTML : html;
    host.appendChild(body);
    document.body.appendChild(host);
    try {
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all([...body.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
        const found = [...body.querySelectorAll(SECTION_SELECTOR)].filter((el) => !el.parentElement?.closest(SECTION_SELECTOR));
        const sections = found.length ? found : [body];
        // html2pdf clones each section into its own overlay, so the fixes must travel on the section itself.
        sections.forEach((el) => { el.classList.add('pdf-raster'); el.setAttribute('dir', dir); });
        return await renderSectionsToPdf(sections, fileName);
    } finally {
        host.remove();
    }
}

/** Any on-page element → PDF (used when the server view is unavailable). */
export async function downloadElementAsPdf(element, fileName = 'document.pdf') {
    if (!element || typeof window === 'undefined') return false;
    return renderSectionsToPdf([element], fileName);
}

async function renderSectionsToPdf(sections, fileName) {
    const mod = await import('html2pdf.js');
    const html2pdf = mod.default || mod;
    const options = (el) => ({
        margin: [10, 9, 12, 9],
        filename: safeFileName(fileName),
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
            scale: Math.max(1, Math.min(2, MAX_CANVAS_PX / Math.max(1, el.scrollHeight))),
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: PAGE_WIDTH_PX,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['h1', 'h2', 'h3', 'pre', 'table', 'img', 'li', 'blockquote'] },
    });

    let worker = html2pdf().set(options(sections[0])).from(sections[0]).toPdf();
    for (const section of sections.slice(1)) {
        worker = worker
            .get('pdf').then((pdf) => { pdf.addPage(); })
            .set(options(section)).from(section).toContainer().toCanvas().toPdf();
    }
    await worker.save();
    return true;
}
