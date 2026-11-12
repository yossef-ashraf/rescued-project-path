export async function uploadFileWithSync(file, options = {}) {
    if (!file) throw new Error("No file provided");
    const filename = file.name || 'File';

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('drive-sync-start', {
            detail: {
                filename,
                message: options.startMessage || undefined
            }
        }));
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        if (options.entityType) formData.append('entityType', options.entityType);
        if (options.entityName) formData.append('entityName', options.entityName);
        if (options.isComment) formData.append('isComment', 'true');

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('drive-sync-finish', {
                    detail: {
                        message: options.finishMessage || (data.storage === 'google_drive'
                            ? 'تم الرفع والمزامنة مع Google Drive بنجاح!'
                            : 'تم رفع وحفظ الملف بنجاح!')
                    }
                }));
            }
            return data;
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (err) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('drive-sync-fail', {
                detail: { message: err.message || 'فشلت المزامنة' }
            }));
        }
        throw err;
    }
}
