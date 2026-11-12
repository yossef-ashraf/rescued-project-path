import { Lead, LeadComment, LeadAttachment } from '@/shared/models/index.js';
import { sequelize } from '@/shared/database/database.js';
import { requireAuth, ok, badRequest, unauthorized, notFound, serverError } from '@/shared/utils/response.js';
import { sendTelegramNotification } from '@/features/settings/services/telegram-integration.js';

export class LeadsController {
    static async handleOptions() {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
            }
        });
    }

    static async getLeads(req) {
        try {
            const user = await requireAuth(req);
            if (!user) {
                return unauthorized('Unauthorized: Access to leads requires authentication.');
            }

            const url = new URL(req.url);
            const leadId = url.searchParams.get('leadId') || url.searchParams.get('id');

            if (leadId) {
                const lead = await Lead.findByPk(leadId, { raw: true });
                if (!lead) return notFound('Lead not found');

                const comments = await LeadComment.findAll({
                    where: { lead_id: leadId },
                    order: [['id', 'DESC']],
                    raw: true
                });
                const attachments = await LeadAttachment.findAll({
                    where: { lead_id: leadId },
                    order: [['id', 'DESC']],
                    raw: true
                });

                const commentsWithFiles = (comments || []).map((c) => {
                    const commentFiles = (attachments || []).filter(a => Number(a.comment_id) === Number(c.id));
                    return {
                        ...c,
                        attachments: commentFiles
                    };
                });

                return ok({
                    ...lead,
                    comments: commentsWithFiles,
                    allAttachments: attachments || []
                });
            }

            const rows = await Lead.findAll({
                order: [['id', 'DESC']],
                raw: true
            });
            return ok(rows || []);
        } catch (err) {
            console.error('[LeadsController.getLeads Error]:', err);
            return serverError('Failed to fetch leads');
        }
    }

    static async handleAction(req) {
        try {
            let body = await req.json();

            if (body.data || body.payload) {
                try {
                    const raw = body.data || body.payload;
                    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
                    const allowedKeys = ['name', 'company', 'email', 'phone', 'project_type', 'budget', 'country', 'notes'];
                    allowedKeys.forEach(k => {
                        if (decoded[k] !== undefined) body[k] = decoded[k];
                    });
                } catch {
                }
            }

            const { action, leadId, id, status, comment, fileName, filePath, commentId, attachmentId } = body;
            const targetLeadId = leadId || id || body.targetLeadId;

            if (action) {
                const user = await requireAuth(req);
                if (!user) {
                    return unauthorized('Unauthorized: Administrative action requires login.');
                }

                if (action === 'update_status') {
                    if (!targetLeadId) return badRequest('Lead ID is required');
                    const [updated] = await Lead.update(
                        { status, updated_at: new Date() },
                        { where: { id: targetLeadId } }
                    );
                    if (updated === 0) return notFound('Lead not found');
                    return ok({ success: true });
                }

                if (action === 'add_comment') {
                    if (!targetLeadId) return badRequest('Lead ID is required');
                    const commentText = comment || body.text || '';
                    const newComment = await LeadComment.create({
                        lead_id: targetLeadId,
                        comment: commentText,
                        created_at: new Date()
                    });
                    if (Array.isArray(body.files) && body.files.length > 0) {
                        for (const f of body.files) {
                            await LeadAttachment.create({
                                lead_id: targetLeadId,
                                comment_id: newComment.id,
                                file_name: f.name || f.file_name || 'File',
                                file_path: f.path || f.file_path || f.url || '#',
                                created_at: new Date()
                            });
                        }
                    }
                    return ok({ success: true, id: newComment.id || 1 });
                }

                if (action === 'add_attachment') {
                    if (!targetLeadId) return badRequest('Lead ID is required');
                    const targetFileName = fileName || body.file_name || body.name || 'Attachment';
                    const targetFilePath = filePath || body.file_path || body.path || '#';
                    const newAttachment = await LeadAttachment.create({
                        lead_id: targetLeadId,
                        comment_id: commentId || body.commentId || 0,
                        file_name: targetFileName,
                        file_path: targetFilePath,
                        created_at: new Date()
                    });
                    return ok({ success: true, id: newAttachment.id || 1 });
                }

                if (action === 'edit_lead' || action === 'update' || action === 'edit') {
                    if (!targetLeadId) return badRequest('Lead ID is required');
                    const { name, company, email, phone, project_type, budget, country, notes, status: leadStatus } = body;
                    const updateData = { updated_at: new Date() };
                    if (name !== undefined) updateData.name = name;
                    if (company !== undefined) updateData.company = company || null;
                    if (email !== undefined) updateData.email = email || null;
                    if (phone !== undefined) updateData.phone = phone || null;
                    if (project_type !== undefined) updateData.project_type = project_type || null;
                    if (budget !== undefined) updateData.budget = budget || null;
                    if (country !== undefined) updateData.country = country || null;
                    if (notes !== undefined) updateData.notes = notes || null;
                    if (leadStatus !== undefined) updateData.status = leadStatus;

                    const [updated] = await Lead.update(updateData, {
                        where: { id: targetLeadId }
                    });
                    if (updated === 0) return notFound('Lead not found');
                    return ok({ success: true });
                }

                if (action === 'delete_lead' || action === 'delete') {
                    if (!targetLeadId) return badRequest('Lead ID is required');
                    await LeadsController._cascadeDeleteLead(targetLeadId);
                    return ok({ success: true });
                }

                if (action === 'delete_comment') {
                    const targetCommentId = commentId || id || body.commentId || body.id;
                    if (!targetCommentId) return badRequest('Missing commentId');
                    await LeadAttachment.destroy({ where: { comment_id: targetCommentId } });
                    const deleted = await LeadComment.destroy({ where: { id: targetCommentId } });
                    if (!deleted) return notFound('Comment not found');
                    return ok({ success: true });
                }

                if (action === 'delete_attachment') {
                    const targetAttachmentId = attachmentId || id || body.attachmentId || body.id;
                    if (!targetAttachmentId) return badRequest('Missing attachmentId');
                    const deleted = await LeadAttachment.destroy({ where: { id: targetAttachmentId } });
                    if (!deleted) return notFound('Attachment not found');
                    return ok({ success: true });
                }

                if (action === 'create_lead' || action === 'create') {
                    const { name, company, email, phone, project_type, budget, country, notes, source, status: leadStatus } = body;
                    if (!name) return badRequest('Name is required');
                    const cleanName = String(name).slice(0, 100);
                    const cleanCompany = company ? String(company).slice(0, 100) : null;
                    const cleanEmail = email ? String(email).slice(0, 100) : null;
                    const cleanPhone = phone ? String(phone).slice(0, 50) : null;
                    const cleanType = project_type ? String(project_type).slice(0, 100) : null;
                    const cleanBudget = budget ? String(budget).slice(0, 50) : null;
                    const cleanCountry = country ? String(country).slice(0, 50) : null;
                    const cleanNotes = notes ? String(notes).slice(0, 2000) : null;
                    const cleanSource = source ? String(source).slice(0, 100) : 'Dashboard CRM';

                    const newLead = await Lead.create({
                        name: cleanName,
                        company: cleanCompany,
                        email: cleanEmail,
                        phone: cleanPhone,
                        project_type: cleanType,
                        budget: cleanBudget,
                        country: cleanCountry,
                        status: leadStatus || 'new',
                        notes: cleanNotes,
                        source: cleanSource,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    return ok({ success: true, lead: newLead });
                }

                return badRequest('Invalid action');
            }

            const { name, company, email, phone, project_type, budget, country, notes, source } = body;

            if (!name) {
                return badRequest('Name is required');
            }

            const cleanName = String(name).slice(0, 100);
            const cleanCompany = company ? String(company).slice(0, 100) : null;
            const cleanEmail = email ? String(email).slice(0, 100) : null;
            const cleanPhone = phone ? String(phone).slice(0, 50) : null;
            const cleanType = project_type ? String(project_type).slice(0, 100) : null;
            const cleanBudget = budget ? String(budget).slice(0, 50) : null;
            const cleanCountry = country ? String(country).slice(0, 50) : null;
            const cleanNotes = notes ? String(notes).slice(0, 2000) : null;
            const cleanSource = source ? String(source).slice(0, 100) : 'Portfolio Website';

            await Lead.create({
                name: cleanName,
                company: cleanCompany,
                email: cleanEmail,
                phone: cleanPhone,
                project_type: cleanType,
                budget: cleanBudget,
                country: cleanCountry,
                status: 'new',
                notes: cleanNotes,
                source: cleanSource,
                created_at: new Date(),
                updated_at: new Date()
            });

            try {
                await sendTelegramNotification({
                    title: '🎯 New Portfolio Lead!',
                    message: `<b>Name:</b> ${cleanName}\n<b>Project:</b> ${cleanType || 'N/A'}\n<b>Budget:</b> ${cleanBudget || 'N/A'}\n<b>Email:</b> ${cleanEmail || 'N/A'}\n<b>Phone:</b> ${cleanPhone || 'N/A'}\n<b>Company:</b> ${cleanCompany || 'N/A'}\n<b>Country:</b> ${cleanCountry || 'N/A'}\n<i>Source: ${cleanSource}</i>`,
                    type: 'info',
                    priority: 'normal'
                }).catch(() => { });
            } catch {
            }

            return ok({ success: true, message: 'Thank you! Your inquiry has been received.' });
        } catch (err) {
            return serverError(err);
        }
    }

    static async _cascadeDeleteLead(id) {
        const deleted = await sequelize.transaction(async (t) => {
            await LeadComment.destroy({ where: { lead_id: id }, transaction: t });
            await LeadAttachment.destroy({ where: { lead_id: id }, transaction: t });
            return await Lead.destroy({ where: { id }, transaction: t });
        });
        if (!deleted) throw Object.assign(new Error('Lead not found'), { notFound: true });
    }

    static async deleteLead(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            let id = null;
            try {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id') || searchParams.get('leadId');
            } catch (_) { }

            if (!id) {
                try {
                    const body = await req.json();
                    id = body?.id || body?.leadId;
                } catch (_) { }
            }

            if (!id) return badRequest('Missing lead ID');

            try {
                await LeadsController._cascadeDeleteLead(id);
            } catch (e) {
                if (e.notFound) return notFound('Lead not found');
                throw e;
            }
            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }
}

export default LeadsController;
