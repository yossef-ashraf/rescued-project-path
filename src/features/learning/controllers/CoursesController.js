import { Op } from '@/shared/database/orm.js';
import { Course, CourseFile, CourseComment, MaterialCategory, LearningLesson, LearningLessonAttachment, sequelize } from '@/shared/models/index.js';
import { requireAuth, ok, created, badRequest, unauthorized, notFound } from '@/shared/utils/response.js';
import { apiError } from '@/shared/utils/api-error.js';

let cachedCoursesStats = null;
let coursesStatsCacheTime = 0;
const COURSES_STATS_TTL_MS = 5 * 60 * 1000;

let cachedMaterials = null;
let materialsCacheTime = 0;
const MATERIALS_TTL_MS = 5 * 60 * 1000;

let coursesColumnsEnsured = false;
async function ensureCoursesColumns() {
    // Runtime DDL removed. Schema migrations are managed in app/shared/migrations/
    if (coursesColumnsEnsured) return;
    coursesColumnsEnsured = true;
}

function invalidateCoursesCache() {
    cachedCoursesStats = null;
    coursesStatsCacheTime = 0;
    cachedMaterials = null;
    materialsCacheTime = 0;
}

export class CoursesController {
    static invalidateCache() {
        invalidateCoursesCache();
    }

    static async handleGet(req) {
        try {
            await ensureCoursesColumns();
            const url = new URL(req.url);
            const action = url.searchParams.get('action') || url.searchParams.get('view');
            const parentId = url.searchParams.get('parent_id') || url.searchParams.get('parentId');
            const courseId = url.searchParams.get('id');

            if (action === 'material' || action === 'material_detail') {
                const rawId = url.searchParams.get('id') || courseId;
                if (!rawId) {
                    return badRequest('Material ID is required');
                }
                const id = parseInt(rawId, 10);
                if (isNaN(id)) {
                    return badRequest('Invalid Material ID');
                }

                let material = await CourseFile.findByPk(id, {
                    include: [{
                        model: Course,
                        as: 'course',
                        required: false
                    }]
                });

                if (!material) {
                    material = await CourseFile.create({
                        id: id,
                        course_id: null,
                        file_name: `Knowledge Material #${id}`,
                        file_type: 'document',
                        category_name: 'General',
                        reading_status: 'in_progress',
                        item_type: 'material',
                        description: `Material Workspace #${id}`,
                        tags: 'MATERIAL'
                    });
                }

                let linkedCourse = null;
                const mCourseId = (material.course_id && material.course_id !== 0 && material.course_id !== '0') ? Number(material.course_id) : null;
                if (mCourseId) {
                    linkedCourse = await Course.findByPk(mCourseId);
                }

                if (!linkedCourse) {
                    linkedCourse = await Course.create({
                        title: material.file_name || `Material #${material.id}`,
                        type: 'material',
                        category_path: material.category_name || 'Materials',
                        resource_type: material.item_type || 'material',
                        status: material.reading_status === 'completed' ? 'completed' : 'in_progress',
                        total_units: 1,
                        completed_units: material.reading_status === 'completed' ? 1 : 0,
                        progress_percentage: material.reading_status === 'completed' ? 100 : 0,
                        url: material.file_url || null,
                        description: material.description || '',
                        include_in_stats: 0
                    });

                    material.course_id = linkedCourse.id;
                    await material.save();
                }

                return ok({
                    material: material.toJSON ? material.toJSON() : material,
                    course: linkedCourse.toJSON ? linkedCourse.toJSON() : linkedCourse
                });
            }

            if (action === 'materials' || action === 'summaries' || action === 'onlymind' || action === 'tools') {
                const requestedType = action === 'summaries' ? 'summary' : (action === 'onlymind' ? 'onlymind' : (action === 'tools' ? 'tools' : (url.searchParams.get('item_type') || url.searchParams.get('type') || null)));
                const whereClause = requestedType && requestedType !== 'all' ? { item_type: requestedType } : {};

                const [files, categories, courses] = await Promise.all([
                    CourseFile.findAll({
                        where: whereClause,
                        include: [{
                            model: Course,
                            as: 'course',
                            attributes: ['id', 'title'],
                            required: false
                        }],
                        order: [['id', 'DESC']]
                    }),
                    MaterialCategory.findAll({ order: [['name', 'ASC']], raw: true }),
                    Course.findAll({
                        where: {
                            [Op.or]: [
                                { type: 'course' },
                                { type: null }
                            ]
                        },
                        attributes: ['id', 'title', 'category_path'],
                        order: [['sort_order', 'ASC'], ['title', 'ASC']],
                        raw: true
                    })
                ]);

                const formattedFiles = (files || []).map(f => {
                    const row = f.toJSON ? f.toJSON() : f;
                    const cId = (row.course_id && row.course_id !== 0 && row.course_id !== '0') ? Number(row.course_id) : null;
                    return {
                        ...row,
                        course_id: cId,
                        course_title: row.course ? row.course.title : null,
                        item_type: row.item_type || 'material',
                        tags: row.tags || (row.file_name?.match(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*:\s+/) ? row.file_name.match(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*:\s+/)[1].trim() : 'DOCS')
                    };
                });

                const catNames = new Set((categories || []).map(c => c.name));
                const allCategories = [...(categories || [])];
                let virtualId = 1000;
                formattedFiles.forEach(f => {
                    if (f.category_name && !catNames.has(f.category_name)) {
                        catNames.add(f.category_name);
                        allCategories.push({
                            id: String(virtualId++),
                            name: f.category_name,
                            color: '#6B7280'
                        });
                    }
                });

                // ALWAYS sort allCategories alphabetically by name so Display Name in dropdowns is sorted
                allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

                const responseData = {
                    files: formattedFiles,
                    categories: allCategories,
                    courses: courses || []
                };

                return ok(responseData);
            }

            if (action === 'stats') {
                if (cachedCoursesStats && (Date.now() - coursesStatsCacheTime < COURSES_STATS_TTL_MS)) {
                    return ok(cachedCoursesStats);
                }

                const allItems = await Course.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']], raw: true });

                const categories = allItems.filter(i => i.type === 'category');
                const courses = allItems.filter(i => i.type !== 'category');
                const includedCourses = courses.filter(c => c.include_in_stats !== 0 && c.include_in_stats !== '0');

                const totalCourses = courses.length;
                const totalCategories = categories.length;

                const isCompleted = (c) => c.status === 'Completed' || c.status === 'completed' || Number(c.progress_percentage) >= 100;
                const isOverdue = (c) => (c.status === 'Overdue' || c.status === 'overdue' || (Number(c.overdue_days) > 0 && Number(c.progress_percentage) < 100)) && !isCompleted(c);
                const isInProgress = (c) => !isCompleted(c) && !isOverdue(c);

                const completed = includedCourses.filter(isCompleted);
                const overdue = includedCourses.filter(isOverdue);
                const inProgress = includedCourses.filter(isInProgress);

                const totalUnits = includedCourses.reduce((sum, c) => sum + (parseInt(c.total_units, 10) || 1), 0);
                const completedUnits = includedCourses.reduce((sum, c) => sum + (parseInt(c.completed_units, 10) || 0), 0);
                const overallProgress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

                let filesCount = 0;
                let commentsCount = 0;
                try {
                    filesCount = await CourseFile.count();
                    commentsCount = await CourseComment.count();
                } catch {
                }

                const categoryMap = {};
                categories.forEach(cat => {
                    categoryMap[cat.id] = {
                        id: cat.id,
                        parent_id: cat.parent_id,
                        sort_order: cat.sort_order ?? 0,
                        name: cat.title,
                        totalCourses: 0,
                        completedCourses: 0,
                        totalUnits: 0,
                        completedUnits: 0
                    };
                });

                includedCourses.forEach(c => {
                    let curParentId = c.parent_id;
                    const visited = new Set();
                    while (curParentId && categoryMap[curParentId] && !visited.has(String(curParentId))) {
                        visited.add(String(curParentId));
                        categoryMap[curParentId].totalCourses++;
                        if (isCompleted(c)) {
                            categoryMap[curParentId].completedCourses++;
                        }
                        categoryMap[curParentId].totalUnits += (parseInt(c.total_units, 10) || 0);
                        categoryMap[curParentId].completedUnits += (parseInt(c.completed_units, 10) || 0);
                        curParentId = categoryMap[curParentId].parent_id;
                    }
                });

                const categoryProgress = Object.values(categoryMap)
                    .filter(cat => cat.totalCourses > 0)
                    .sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
                    .map(cat => ({
                        ...cat,
                        progress: cat.totalUnits > 0 ? Math.round((cat.completedUnits / cat.totalUnits) * 100) : 0
                    }));

                const rootCategoryProgress = categoryProgress.filter(cat => !cat.parent_id || !categoryMap[cat.parent_id]);
                const radarSource = rootCategoryProgress.length > 0 ? rootCategoryProgress : categoryProgress;

                const radarData = radarSource.map(cat => ({
                    category: cat.name,
                    fullCategory: cat.name,
                    score: cat.progress,
                    completedUnits: cat.completedUnits,
                    totalUnits: cat.totalUnits
                }));

                const statusDistribution = [
                    { name: 'In Progress', value: inProgress.length, color: '#BC5C29' },
                    { name: 'Completed', value: completed.length, color: '#10B981' },
                    { name: 'Overdue', value: overdue.length, color: '#EF4444' }
                ];

                const continueLearning = courses
                    .filter(c => !isCompleted(c))
                    .sort((a, b) => {
                        const pDiff = (Number(b.progress_percentage) || 0) - (Number(a.progress_percentage) || 0);
                        if (pDiff !== 0) return pDiff;
                        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
                    })
                    .slice(0, 6)
                    .map(c => {
                        const cat = categoryMap[c.parent_id];
                        return {
                            id: c.id,
                            title: c.title,
                            categoryTitle: cat ? cat.name : 'General',
                            resource_type: c.resource_type || 'Doc',
                            url: c.url || '',
                            progress_percentage: Math.round(Number(c.progress_percentage) || 0),
                            completed_units: parseInt(c.completed_units, 10) || 0,
                            total_units: parseInt(c.total_units, 10) || 1
                        };
                    });

                const recentActivity = await Course.findAll({
                    attributes: ['id', 'title', 'progress_percentage', 'status', 'updated_at', [sequelize.literal("'course_update'"), 'activity_type']],
                    where: {
                        type: { [Op.ne]: 'category' }
                    },
                    order: [['updated_at', 'DESC']],
                    limit: 5,
                    raw: true
                });

                const stats = {
                    totalCourses: includedCourses.length,
                    rawTotalCourses: courses.length,
                    totalCategories,
                    completedCount: completed.length,
                    inProgressCount: inProgress.length,
                    overdueCount: overdue.length,
                    overallProgress,
                    totalUnits,
                    completedUnits,
                    filesCount,
                    commentsCount
                };

                const responseData = {
                    stats,
                    categoryBreakdown: categoryProgress,
                    categoryProgress,
                    radarData,
                    statusDistribution,
                    continueLearning,
                    recentActivity: recentActivity || []
                };

                cachedCoursesStats = responseData;
                coursesStatsCacheTime = Date.now();

                return ok(responseData);
            }

            const isExport = url.searchParams.get('export') === 'json' || url.searchParams.get('format') === 'json';
            if (isExport) {
                const user = await requireAuth(req);
                if (!user) return unauthorized();

                const [courses, comments, files] = await Promise.all([
                    Course.findAll({ order: [['id', 'ASC']], raw: true }),
                    CourseComment.findAll({ order: [['id', 'ASC']], raw: true }),
                    CourseFile.findAll({ order: [['id', 'ASC']], raw: true })
                ]);

                const exportData = {
                    exported_at: new Date().toISOString(),
                    total_courses: courses.length,
                    courses: courses || [],
                    course_comments: comments || [],
                    course_files: files || []
                };

                const jsonString = JSON.stringify(exportData, null, 2);
                const dateStr = new Date().toISOString().split('T')[0];
                const filename = `courses_export_${dateStr}.json`;
                const encoded = new TextEncoder().encode(jsonString);

                return new Response(encoded, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Content-Disposition': `attachment; filename="${filename}"`,
                        'Content-Length': String(encoded.byteLength),
                        'Cache-Control': 'no-store, no-cache, must-revalidate'
                    }
                });
            }

            const lessonsCountAttr = [
                sequelize.literal('(SELECT COUNT(*)::int FROM learning_lessons WHERE learning_lessons.course_id = "Course"."id")'),
                'lessons_count'
            ];

            if (courseId) {
                const course = await Course.findByPk(courseId, {
                    attributes: { include: [lessonsCountAttr] },
                    raw: true
                });
                if (!course) return notFound('Course not found');

                const [subCourses, comments, files] = await Promise.all([
                    Course.findAll({
                        where: { parent_id: courseId },
                        attributes: { include: [lessonsCountAttr] },
                        order: [['sort_order', 'ASC'], ['id', 'ASC']],
                        raw: true
                    }),
                    CourseComment.findAll({ where: { course_id: courseId }, order: [['id', 'DESC']], raw: true }),
                    CourseFile.findAll({ where: { course_id: courseId }, order: [['id', 'DESC']], raw: true })
                ]);

                return ok({
                    ...course,
                    sub_courses: subCourses,
                    comments: comments || [],
                    files: files || []
                });
            }

            if (parentId === 'all') {
                const courses = await Course.findAll({
                    attributes: { include: [lessonsCountAttr] },
                    order: [['sort_order', 'ASC'], ['id', 'ASC']],
                    raw: true
                });
                return ok(courses);
            }

            if (parentId) {
                const courses = await Course.findAll({
                    where: { parent_id: parentId },
                    attributes: { include: [lessonsCountAttr] },
                    order: [['sort_order', 'ASC'], ['id', 'ASC']],
                    raw: true
                });
                return ok(courses);
            }

            const courses = await Course.findAll({
                where: {
                    [Op.or]: [
                        { parent_id: null },
                        { parent_id: 0 }
                    ]
                },
                attributes: { include: [lessonsCountAttr] },
                order: [['sort_order', 'ASC'], ['id', 'ASC']],
                raw: true
            });
            return ok(courses);
        } catch (err) {
            return apiError(err);
        }
    }

    static async handlePost(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            await ensureCoursesColumns();
            invalidateCoursesCache();
            const body = await req.json();
            const {
                action, id, parent_id, title, url, category_path, resource_type,
                total_units, completed_units, start_date, expected_end_date, expected_start_date, type,
                status, include_in_stats, description, comment, file_name, file_url, file_type, comment_id, file_id
            } = body;

            if (action === 'update' || action === 'update_course' || action === 'edit_course' || action === 'edit' || action === 'update_progress') {
                return await CoursesController.updateCourseRecord(body);
            }

            if (action === 'delete' || action === 'delete_course') {
                return await CoursesController.handleDelete(req, body);
            }

            if (action === 'move_parent') {
                return await CoursesController.updateCourseRecord({ id: body.id || id, parent_id: body.parent_id !== undefined ? body.parent_id : parent_id });
            }

            if (action === 'reorder_hierarchy' || action === 'reorder_courses') {
                const items = Array.isArray(body.items) ? body.items : (Array.isArray(body.ordered_ids) ? body.ordered_ids.map((itId, idx) => ({ id: itId, sort_order: idx })) : []);
                if (items.length > 0) {
                    for (const it of items) {
                        if (it && it.id !== undefined && it.sort_order !== undefined) {
                            await Course.update({ sort_order: Number(it.sort_order) }, { where: { id: it.id } });
                        }
                    }
                }
                return ok({ success: true, count: items.length });
            }

            if (action === 'add_comment') {
                const targetCourseId = body.course_id || id;
                const newComment = await CourseComment.create({
                    course_id: targetCourseId,
                    comment,
                    created_at: new Date()
                });
                return ok({ success: true, comment_id: newComment.id || 1 });
            }

            if (action === 'delete_comment') {
                await CourseComment.destroy({ where: { id: comment_id || id } });
                return ok({ success: true });
            }

            if (action === 'add_material_category') {
                const catName = body.name || body.title;
                const catColor = body.color || '#10B981';
                invalidateCoursesCache();
                try {
                    const newCat = await MaterialCategory.create({ name: catName, color: catColor });
                    return ok({ success: true, category_id: newCat.id || 1, name: catName, color: catColor });
                } catch {
                    return ok({ success: true, name: catName, color: catColor });
                }
            }

            if (action === 'add_file' || action === 'add_summary' || action === 'add_onlymind' || action === 'add_tools' || action === 'add_tool') {
                const catName = body.category_name || body.category || 'General';
                const safeType = String(file_type || body.file_type || 'file');
                const safeName = file_name || body.file_name || 'File';
                const safeUrl = file_url || body.file_url || '';
                const safeDesc = body.description || '';
                const safeReading = body.reading_status || 'unread';
                const safeNotes = body.notes || '';
                const rawCourseId = body.course_id !== undefined ? body.course_id : null;
                const safeCourseId = (rawCourseId && rawCourseId !== 'none' && rawCourseId !== 0 && rawCourseId !== '0')
                    ? parseInt(rawCourseId, 10)
                    : null;
                const allowedTypes = ['material', 'summary', 'onlymind', 'tools'];
                let safeItemType = allowedTypes.includes(body.item_type) ? body.item_type : 'material';
                if (action === 'add_onlymind') {
                    safeItemType = 'onlymind';
                } else if (action === 'add_summary') {
                    safeItemType = 'summary';
                } else if (action === 'add_tools' || action === 'add_tool') {
                    safeItemType = 'tools';
                }

                const newFile = await CourseFile.create({
                    course_id: safeCourseId,
                    file_name: safeName,
                    file_url: safeUrl,
                    file_type: safeType,
                    category_name: catName,
                    description: safeDesc,
                    reading_status: safeReading,
                    notes: safeNotes,
                    item_type: safeItemType,
                    tags: body.tags || (safeName?.match(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*:\s+/) ? safeName.match(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*:\s+/)[1].trim() : 'DOCS'),
                    created_at: new Date()
                });
                invalidateCoursesCache();
                return ok({ success: true, file_id: newFile.id || 1 });
            }

            if (action === 'update_file' || action === 'update_summary' || action === 'edit_file' || action === 'edit_summary') {
                const targetId = file_id || id;
                const updateData = {};
                if (file_name !== undefined || body.file_name !== undefined) updateData.file_name = file_name || body.file_name;
                if (body.description !== undefined) updateData.description = body.description;
                if (body.category_name || body.category) updateData.category_name = body.category_name || body.category;
                if (body.reading_status !== undefined) updateData.reading_status = body.reading_status;
                if (body.notes !== undefined) updateData.notes = body.notes;
                if (body.file_url !== undefined || body.url !== undefined) updateData.file_url = body.file_url !== undefined ? body.file_url : body.url;
                if (body.file_type !== undefined) updateData.file_type = body.file_type;
                if (body.tags !== undefined) {
                    updateData.tags = body.tags;
                } else if (updateData.file_name) {
                    const m = updateData.file_name.match(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*:\s+/);
                    if (m) updateData.tags = m[1].trim();
                }
                if (body.item_type !== undefined) {
                    const allowedTypes = ['material', 'summary', 'onlymind', 'tools'];
                    updateData.item_type = allowedTypes.includes(body.item_type) ? body.item_type : 'material';
                }
                if (body.course_id !== undefined) {
                    const rawCourseId = body.course_id;
                    updateData.course_id = (rawCourseId && rawCourseId !== 'none' && rawCourseId !== 0 && rawCourseId !== '0')
                        ? parseInt(rawCourseId, 10)
                        : null;
                }

                if (Object.keys(updateData).length > 0) {
                    await CourseFile.update(updateData, { where: { id: targetId } });
                }
                invalidateCoursesCache();
                return ok({ success: true });
            }

            if (action === 'bulk_transfer_category' || action === 'bulk_move_files') {
                const fileIds = Array.isArray(body.file_ids) ? body.file_ids : [];
                if (!fileIds.length) return badRequest('file_ids array is required');

                const updateData = {};
                if (body.category_name) {
                    updateData.category_name = body.category_name;
                }
                if (body.item_type) {
                    const allowedTypes = ['material', 'summary', 'onlymind', 'tools'];
                    if (allowedTypes.includes(body.item_type)) {
                        updateData.item_type = body.item_type;
                    }
                }

                if (Object.keys(updateData).length > 0) {
                    await CourseFile.update(updateData, {
                        where: { id: { [Op.in]: fileIds } }
                    });
                }

                if (body.category_name) {
                    const existingCat = await MaterialCategory.findOne({ where: { name: body.category_name } });
                    if (!existingCat) {
                        await MaterialCategory.create({
                            name: body.category_name,
                            color: body.category_color || '#E89242'
                        });
                    }
                }

                invalidateCoursesCache();
                return ok({ success: true, count: fileIds.length });
            }

            if (action === 'link_material' || action === 'link_course_file') {
                const fileId = body.file_id || body.id;
                const rawCourseId = body.course_id;
                const safeCourseId = (rawCourseId && rawCourseId !== 'none' && rawCourseId !== 0 && rawCourseId !== '0')
                    ? parseInt(rawCourseId, 10)
                    : null;
                await CourseFile.update({ course_id: safeCourseId }, { where: { id: fileId } });
                invalidateCoursesCache();
                return ok({ success: true, file_id: fileId, course_id: safeCourseId });
            }

            if (action === 'update_reading_status') {
                const targetId = body.id || body.file_id || id;
                const updateData = {};
                if (body.reading_status !== undefined) updateData.reading_status = body.reading_status;
                if (body.notes !== undefined) updateData.notes = body.notes;

                if (Object.keys(updateData).length > 0) {
                    await CourseFile.update(updateData, { where: { id: targetId } });
                }
                invalidateCoursesCache();
                return ok({ success: true });
            }

            if (action === 'delete_file') {
                const targetId = file_id || id || body.file_id || body.id;
                if (!targetId) return badRequest('File ID is required');
                await CourseFile.destroy({ where: { id: targetId } });
                invalidateCoursesCache();
                return ok({ success: true, deleted_id: targetId });
            }

            if (action === 'change_item_type' || action === 'move_item_type') {
                const targetId = file_id || id || body.file_id || body.id;
                if (!targetId) return badRequest('File ID is required');
                const allowedTypes = ['material', 'summary', 'onlymind', 'tools'];
                const newItemType = allowedTypes.includes(body.item_type) ? body.item_type : 'material';
                await CourseFile.update({ item_type: newItemType }, { where: { id: targetId } });
                invalidateCoursesCache();
                return ok({ success: true, file_id: targetId, item_type: newItemType });
            }

            if (action === 'transfer_to_lesson') {
                const targetFileId = file_id || id || body.file_id || body.id;
                const targetLessonId = body.lesson_id;
                if (!targetFileId || !targetLessonId) {
                    return badRequest('File ID and Lesson ID are required');
                }

                const file = await CourseFile.findByPk(targetFileId);
                if (!file) {
                    return notFound('File not found');
                }

                const lesson = await LearningLesson.findByPk(targetLessonId);
                if (!lesson) {
                    return notFound('Lesson not found');
                }

                const attachment = await LearningLessonAttachment.create({
                    lesson_id: Number(targetLessonId),
                    file_name: file.file_name,
                    file_url: file.file_url,
                    file_type: file.file_type || null,
                    description: file.description || file.notes || null,
                    storage_provider: 'local'
                });

                await CourseFile.destroy({ where: { id: targetFileId } });
                invalidateCoursesCache();

                return ok({
                    success: true,
                    message: 'Transferred to lesson successfully',
                    file_id: targetFileId,
                    lesson_id: targetLessonId,
                    attachment
                });
            }

            if (!title || !String(title).trim()) {
                return badRequest('Title is required');
            }

            const total = parseInt(total_units, 10) || 0;
            const completed = parseInt(completed_units, 10) || 0;
            const progress = total > 0 ? parseFloat(((completed / total) * 100).toFixed(2)) : 0;
            const parsedParent = (parent_id && parent_id !== 'none' && parent_id !== '') ? parseInt(parent_id, 10) : null;
            const safeParentId = Number.isNaN(parsedParent) ? null : parsedParent;
            const itemType = type || (safeParentId ? 'course' : 'category');

            const createdCourse = await Course.create({
                parent_id: safeParentId,
                title: String(title).trim(),
                url: url ? String(url).trim() : null,
                category_path: category_path ? String(category_path).trim() : null,
                resource_type: resource_type || null,
                total_units: total,
                completed_units: completed,
                progress_percentage: progress,
                start_date: start_date || null,
                expected_end_date: expected_end_date || null,
                expected_start_date: expected_start_date || null,
                days_spent: 0,
                overdue_days: 0,
                status: status || (completed >= total && total > 0 ? 'Completed' : 'In Progress'),
                type: itemType,
                include_in_stats: include_in_stats !== undefined ? (include_in_stats ? 1 : 0) : 1,
                description: description || null,
                created_at: new Date(),
                updated_at: new Date()
            });

            if (Array.isArray(body.linked_material_ids) && body.linked_material_ids.length > 0 && createdCourse?.id) {
                const cleanMatIds = body.linked_material_ids
                    .map(mid => parseInt(mid, 10))
                    .filter(mid => !Number.isNaN(mid) && mid > 0);
                if (cleanMatIds.length > 0) {
                    await CourseFile.update(
                        { course_id: createdCourse.id },
                        { where: { id: { [Op.in]: cleanMatIds } } }
                    );
                    invalidateCoursesCache();
                }
            }

            const plainCourse = createdCourse?.get ? createdCourse.get({ plain: true }) : (createdCourse?.toJSON ? createdCourse.toJSON() : createdCourse);
            return created(plainCourse);
        } catch (err) {
            console.error('[CoursesController.handlePost Error]:', err);
            return apiError(err);
        }
    }

    static async updateCourseRecord(body) {
        await ensureCoursesColumns();
        invalidateCoursesCache();
        const { id } = body;
        if (!id) return badRequest('Missing ID');

        const course = await Course.findByPk(id);
        if (!course) return notFound('Course not found');

        const fields = [
            'parent_id', 'title', 'url', 'category_path', 'resource_type',
            'total_units', 'completed_units', 'start_date', 'expected_end_date',
            'expected_start_date', 'status', 'days_spent', 'overdue_days',
            'include_in_stats', 'type', 'description', 'sort_order'
        ];

        const updateData = {};
        fields.forEach(f => {
            if (body[f] !== undefined) {
                if (f === 'include_in_stats') {
                    updateData.include_in_stats = (body.include_in_stats === 0 || body.include_in_stats === '0' || body.include_in_stats === false || body.include_in_stats === 'false') ? 0 : 1;
                } else if (f === 'parent_id') {
                    updateData.parent_id = (body.parent_id === 'none' || body.parent_id === '' || body.parent_id === null) ? null : parseInt(body.parent_id, 10);
                } else {
                    updateData[f] = body[f];
                }
            }
        });

        const total = updateData.total_units !== undefined ? parseInt(updateData.total_units, 10) : parseInt(course.total_units, 10);
        const completed = updateData.completed_units !== undefined ? parseInt(updateData.completed_units, 10) : parseInt(course.completed_units, 10);
        if (total > 0) {
            updateData.progress_percentage = parseFloat(((completed / total) * 100).toFixed(2));
        } else if (body.progress_percentage !== undefined) {
            updateData.progress_percentage = parseFloat(body.progress_percentage);
        }

        if (body.status !== undefined) {
            updateData.status = body.status;
        } else if (completed >= total && total > 0 && course.status !== 'Overdue') {
            updateData.status = 'Completed';
        }

        updateData.updated_at = new Date().toISOString();

        await Course.update(updateData, { where: { id } });
        const updated = await Course.findByPk(id, { raw: true });
        return ok(updated);
    }

    static async handlePut(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const body = await req.json();
            if (body.action === 'change_item_type' || body.action === 'move_item_type') {
                const targetId = body.file_id || body.id;
                if (!targetId) return badRequest('File ID is required');
                const allowedTypes = ['material', 'summary', 'onlymind', 'tools'];
                const newItemType = allowedTypes.includes(body.item_type) ? body.item_type : 'material';
                await CourseFile.update({ item_type: newItemType }, { where: { id: targetId } });
                invalidateCoursesCache();
                return ok({ success: true, file_id: targetId, item_type: newItemType });
            }
            return await CoursesController.updateCourseRecord(body);
        } catch (err) {
            return apiError(err);
        }
    }

    static async handleDelete(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            invalidateCoursesCache();
            let id = null;
            try {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id') || searchParams.get('courseId');
            } catch (_) {}

            if (!id && passedBody) {
                id = passedBody.id || passedBody.courseId;
            }

            if (!id) {
                try {
                    const b = await req.json();
                    id = b?.id || b?.courseId;
                } catch (_) {}
            }

            if (!id) return badRequest('ID parameter missing');

            await Course.destroy({ where: { id } });
            await Course.destroy({ where: { parent_id: id } });
            await CourseComment.destroy({ where: { course_id: id } });
            await CourseFile.destroy({ where: { course_id: id } });

            return ok({ success: true });
        } catch (err) {
            return apiError(err);
        }
    }
}

export default CoursesController;
