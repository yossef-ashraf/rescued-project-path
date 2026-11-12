import { CourseFile } from '@/shared/models/index.js';
import { requireAuth, ok, unauthorized, badRequest, notFound } from '@/shared/utils/response.js';
import { apiError } from '@/shared/utils/api-error.js';
import { CoursesController } from './CoursesController.js';

export class NotesController {
    static async getNotes(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const url = new URL(req.url);
            const limitParam = parseInt(url.searchParams.get('limit') || '100', 10);
            const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);
            const limit = Math.max(1, Math.min(isNaN(limitParam) ? 100 : limitParam, 500));
            const offset = Math.max(0, isNaN(offsetParam) ? 0 : offsetParam);

            const items = await CourseFile.findAll({
                where: { item_type: 'summary' },
                order: [['id', 'DESC']],
                limit,
                offset,
                raw: true
            });

            const mapped = (items || []).map(item => ({
                id: item.id,
                title: item.file_name,
                content: item.notes || item.description || '',
                category: item.category_name || 'General',
                note_date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '',
                reminder_time: null,
                file_path: item.file_url,
                file_name: item.file_name,
                created_at: item.created_at,
                updated_at: item.created_at
            }));

            return ok(mapped);
        } catch (err) {
            return apiError(err);
        }
    }

    static async handlePost(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const body = await req.json();
            const { action, id, title, content, category, note_date, reminder_time, file_path, file_name } = body;
            const targetId = id || body.noteId || body.note_id;

            if (action === 'create_note' || action === 'create' || action === 'add' || action === 'add_note') {
                if (!title || typeof title !== 'string' || !title.trim()) {
                    return badRequest('Title is required');
                }
                const safeName = title.trim();
                const safeDesc = content ? (content.length > 250 ? content.substring(0, 247) + '...' : content) : '';
                const createdNote = await CourseFile.create({
                    file_name: safeName,
                    category_name: category || 'General',
                    description: safeDesc,
                    notes: content || null,
                    file_url: file_path || '',
                    file_type: file_path ? 'doc' : (content && content.startsWith('http') ? 'link' : 'note'),
                    reading_status: 'unread',
                    course_id: null,
                    item_type: 'summary',
                    created_at: new Date()
                });
                CoursesController.invalidateCache();
                return ok({ success: true, id: createdNote.id, note_id: createdNote.id });
            }

            if (action === 'update_note' || action === 'edit_note' || action === 'update' || action === 'edit') {
                if (!targetId) return badRequest('Missing note ID');
                const updateData = {};
                if (title !== undefined) updateData.file_name = title ? title.trim() : 'Untitled';
                if (content !== undefined) {
                    updateData.notes = content;
                    updateData.description = content ? (content.length > 250 ? content.substring(0, 247) + '...' : content) : '';
                }
                if (category !== undefined) updateData.category_name = category || 'General';
                if (file_path !== undefined) updateData.file_url = file_path || '';
                
                const [updated] = await CourseFile.update(updateData, {
                    where: { id: targetId, item_type: 'summary' }
                });
                if (updated === 0) return notFound('Note not found');
                CoursesController.invalidateCache();
                return ok({ success: true });
            }

            if (action === 'delete_note' || action === 'delete') {
                if (!targetId) return badRequest('Missing note ID');
                const deleted = await CourseFile.destroy({ where: { id: targetId, item_type: 'summary' } });
                if (!deleted) return notFound('Note not found');
                CoursesController.invalidateCache();
                return ok({ success: true });
            }

            return badRequest('Invalid action');
        } catch (err) {
            return apiError(err);
        }
    }

    static async deleteNote(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            let id = null;
            try {
                const url = new URL(req.url);
                id = url.searchParams.get('id') || url.searchParams.get('noteId');
            } catch (_) {}

            if (!id) return badRequest('Missing note ID');
            const deleted = await CourseFile.destroy({ where: { id, item_type: 'summary' } });
            if (!deleted) return notFound('Note not found');
            CoursesController.invalidateCache();
            return ok({ success: true });
        } catch (err) {
            return apiError(err);
        }
    }
}

export default NotesController;
