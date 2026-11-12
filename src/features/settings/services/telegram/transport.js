/**
 * Telegram Transport
 * Section 34.4 — Orbit Architecture v2
 */

export async function sendTelegramPayload(token, chatId, text, options = {}) {
    if (!token || !chatId || !text) {
        throw new Error('Telegram token, chatId, and text are required');
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'Markdown',
        disable_web_page_preview: options.disablePreview !== false
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
            const sanitizedErr = data.description || `HTTP ${res.status}`;
            throw new Error(`Telegram API Error: ${sanitizedErr}`);
        }

        return {
            success: true,
            messageId: data.result?.message_id
        };
    } catch (err) {
        clearTimeout(timeoutId);
        // Do not leak bot token in error message
        const safeMsg = err.name === 'AbortError' ? 'Request timed out' : err.message;
        throw new Error(`[Telegram Transport] ${safeMsg}`);
    }
}

const serviceExports = {
    sendTelegramPayload
};

export default serviceExports;
