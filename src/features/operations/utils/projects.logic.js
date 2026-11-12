export function extractProjectDescriptionAndPath(desc = '') {
    const rawDesc = typeof desc === 'string' ? desc : (desc ? String(desc) : '');
    const match = rawDesc.match(/([a-zA-Z]:\\[^\s\r\n]+|\/[^\s\r\n]+\/[^\s\r\n]+)/);
    let cleanText = rawDesc;
    let localPath = null;
    if (match) {
        localPath = match[0];
        cleanText = rawDesc.replace(localPath, '').replace(/Project located at:?/gi, '').replace(/located at:?/gi, '').trim();
        if (!cleanText) cleanText = 'Full-stack application workspace.';
    }
    return {
        cleanText: cleanText || 'Full-stack Web Application development and deployment.',
        localPath
    };
}

export function parseProjectAttachments(attachments = []) {
    if (!attachments) return [];
    let list = [];
    if (typeof attachments === 'string') {
        try {
            const parsed = JSON.parse(attachments);
            list = Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            list = [];
        }
    } else if (Array.isArray(attachments)) {
        list = attachments;
    }
    return list.map(att => ({
        name: att?.file_name || att?.name || 'Attachment',
        size: att?.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : '1.2 MB',
        type: (att?.file_name || att?.name || '').endsWith('.pdf') ? 'pdf' : (att?.file_name || att?.name || '').endsWith('.fig') ? 'figma' : 'pdf'
    }));
}

export function parseProjectComments(comments) {
    if (!comments) return [];
    let list = [];
    if (typeof comments === 'string') {
        try {
            const parsed = JSON.parse(comments);
            list = Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            list = [];
        }
    } else if (Array.isArray(comments)) {
        list = comments;
    }
    return list.map(c => ({
        author: c?.author || 'Project Note',
        date: c?.date || '2026',
        text: c?.text || c?.comment || 'Milestone detail'
    }));
}
