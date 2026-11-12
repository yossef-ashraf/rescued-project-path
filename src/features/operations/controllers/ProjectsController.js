import { Project } from '@/shared/models/index.js';
import { requireAuth, ok, created, badRequest, unauthorized, notFound } from '@/shared/utils/response.js';
import { apiError } from '@/shared/utils/api-error.js';

export class ProjectsController {
    static async getProjects(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const rows = await Project.findAll({ order: [['id', 'DESC']] });
            return ok(rows);
        } catch (err) {
            return apiError(err);
        }
    }

    static async createProject(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const body = await req.json();

            if (body.action === 'delete' || body.action === 'delete_project') {
                const id = body.id || body.projectId;
                if (!id) return badRequest('Missing ID');
                const deleted = await Project.destroy({ where: { id } });
                if (!deleted) return notFound('Project not found');
                return ok({ success: true });
            }

            if (body.action === 'update' || body.action === 'edit' || body.action === 'update_project' || body.action === 'edit_project') {
                const { id, name, company, start_date, end_date, status, description, tech_stack, files, comments } = body;
                const targetId = id || body.projectId;
                if (!targetId) return badRequest('Missing ID');
                const [updated] = await Project.update({
                    name,
                    company,
                    start_date,
                    end_date,
                    status,
                    description,
                    tech_stack,
                    files: typeof files === 'string' ? files : JSON.stringify(files || []),
                    comments: typeof comments === 'string' ? comments : JSON.stringify(comments || []),
                    updated_at: new Date()
                }, { where: { id: targetId } });
                if (updated === 0) return notFound('Project not found');
                return ok({ success: true });
            }

            if (body.action === 'add_comment') {
                const id = body.id || body.projectId;
                const text = body.text || body.comment;
                if (!id) return badRequest('Missing project ID');
                const project = await Project.findByPk(id);
                if (!project) return notFound('Project not found');

                let commentsArr = [];
                try {
                    commentsArr = typeof project.comments === 'string' ? JSON.parse(project.comments) : (project.comments || []);
                } catch {
                    commentsArr = [];
                }

                const newComment = {
                    id: Date.now(),
                    text,
                    author: user.username || 'User',
                    created_at: new Date()
                };
                commentsArr.push(newComment);
                await Project.update({
                    comments: JSON.stringify(commentsArr),
                    updated_at: new Date()
                }, { where: { id } });
                return ok({ success: true, comment: newComment });
            }

            const { name, company, start_date, end_date, status, description, tech_stack, files, comments } = body;

            const newProject = await Project.create({
                name,
                company,
                start_date,
                end_date,
                status: status || 'active',
                description,
                tech_stack,
                files: typeof files === 'string' ? files : JSON.stringify(files || []),
                comments: typeof comments === 'string' ? comments : JSON.stringify(comments || []),
                created_at: new Date(),
                updated_at: new Date().toISOString()
            });

            return created({ success: true, id: newProject.id });
        } catch (err) {
            return apiError(err);
        }
    }

    static async updateProject(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const body = await req.json();
            const { id, name, company, start_date, end_date, status, description, tech_stack, files, comments } = body;

            if (!id) return badRequest('Missing ID');

            const [updated] = await Project.update({
                name,
                company,
                start_date,
                end_date,
                status,
                description,
                tech_stack,
                files: typeof files === 'string' ? files : JSON.stringify(files || []),
                comments: typeof comments === 'string' ? comments : JSON.stringify(comments || []),
                updated_at: new Date()
            }, { where: { id } });

            if (updated === 0) return notFound('Project not found');
            return ok({ success: true });
        } catch (err) {
            return apiError(err);
        }
    }

    static async deleteProject(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            let id = new URL(req.url).searchParams.get('id');
            if (!id) {
                try {
                    const body = await req.json();
                    id = body.id;
                } catch {}
            }
            if (!id) return badRequest('ID parameter missing');

            const deleted = await Project.destroy({ where: { id } });
            if (!deleted) return notFound('Project not found');
            return ok({ success: true });
        } catch (err) {
            return apiError(err);
        }
    }
}

export default ProjectsController;
