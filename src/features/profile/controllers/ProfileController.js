import {
    ProfilePersonalInfo,
    ProfileAbout,
    ProfileEducation,
    ProfileCertificate,
    ProfileExperience,
    ProfileProject,
    ProfileSkill,
    ProfilePageSection,
    sequelize
} from '@/shared/models/index.js';
import { requireAuth, ok, unauthorized } from '@/shared/utils/response.js';
import { apiError } from '@/shared/utils/api-error.js';

const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export class ProfileController {
    static async handleGet(req) {
        try {
            const [
                personalInfo,
                about,
                education,
                certificates,
                experience,
                projects,
                skills,
                sections
            ] = await Promise.all([
                ProfilePersonalInfo.findOne({ order: [['id', 'ASC']], raw: true }),
                ProfileAbout.findOne({ order: [['id', 'ASC']], raw: true }),
                ProfileEducation.findAll({ order: [['id', 'ASC']], raw: true }),
                ProfileCertificate.findAll({ order: [['id', 'ASC']], raw: true }),
                ProfileExperience.findAll({ order: [['id', 'ASC']], raw: true }),
                ProfileProject.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']], raw: true }),
                ProfileSkill.findAll({ order: [['id', 'ASC']], raw: true }),
                ProfilePageSection.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC'], ['id', 'ASC']], raw: true })
            ]);

            const formattedProjects = (projects || []).map(p => ({
                name: p.name,
                company: p.company,
                role: p.role,
                link: p.link_url,
                description: p.description,
                logo: p.logo_url,
                country: p.country,
                coordinates: {
                    lat: parseFloat(p.geo_lat) || 30.0444,
                    lng: parseFloat(p.geo_long) || 31.2357
                },
                category: p.category || 'other',
                sort_order: p.sort_order
            }));

            const skillsByCategory = {};
            (skills || []).forEach(s => {
                if (!skillsByCategory[s.category]) {
                    skillsByCategory[s.category] = [];
                }
                skillsByCategory[s.category].push({
                    name: s.skill_name,
                    rating: s.rating,
                    badge: s.badge,
                    highlight: Boolean(s.is_highlight)
                });
            });

            let whatIDo = [];
            let coreExpertise = [];
            if (about) {
                try { whatIDo = JSON.parse(about.what_i_do || '[]'); } catch {}
                try { coreExpertise = JSON.parse(about.core_expertise || '[]'); } catch {}
            }

            const personalData = personalInfo ? {
                name: personalInfo.name || '',
                title: personalInfo.title || '',
                photo: personalInfo.photo_path || '',
                logo: personalInfo.logo_path || '',
                location: personalInfo.location || '',
                militaryStatus: personalInfo.military_status || '',
                cv_url: personalInfo.cv_url || '',
                contact: {
                    phone: personalInfo.phone || '',
                    email: personalInfo.email || '',
                    linkedin: personalInfo.linkedin_url || '',
                    github: personalInfo.github_url || '',
                    portfolio: personalInfo.portfolio_url || '',
                    cv_url: personalInfo.cv_url || ''
                }
            } : { contact: {} };

            const aboutData = {
                summary: about?.summary || '',
                whatIDo,
                coreExpertise
            };

            const expData = (experience || []).map(e => ({
                company: e.company || '',
                role: e.role || '',
                duration: e.duration || '',
                logo: e.logo_url || '',
                link: e.link_url || '',
                description: e.description || ''
            }));

            const eduData = (education || []).map(e => ({
                degree: e.degree || '',
                institution: e.institution || '',
                year: e.year_range || '',
                grade: e.grade || '',
                description: e.description || ''
            }));

            
            const sectionsMap = {};
            (sections || []).forEach(s => {
                sectionsMap[s.section_key] = {
                    id: s.id,
                    page: s.page,
                    section_key: s.section_key,
                    title: s.title || '',
                    subtitle: s.subtitle || '',
                    content: s.content || '',
                    meta: s.meta || {},
                    sort_order: s.sort_order
                };
            });

            const certsData = (certificates || []).map(c => ({
                name: c.name || '',
                institution: c.institution || '',
                date: c.issue_date || ''
            }));

            return ok({
                personalInfo: personalData,
                aboutData,
                experienceData: { experiences: expData },
                educationData: { education: eduData, certificates: certsData },
                projectsData: { projects: formattedProjects },
                skillsData: { skillsByCategory },
                sections: sectionsMap
            }, {}, { headers: corsHeaders });
        } catch (err) {
            return apiError(err);
        }
    }

    static async handlePost(req) {
        try {
            const user = await requireAuth(req);
            if (!user) {
                return unauthorized('Unauthorized');
            }

            const body = await req.json();
            const { action, name, title, photo, logo, phone, email, linkedin, github, portfolio, location, militaryStatus, cv_url, cv, aboutData, educationData, experienceData, projectsData, skillsData } = body;

            if (action === 'save_personal') {
                const existing = await ProfilePersonalInfo.findOne({ attributes: ['id', 'cv_url'], raw: true });
                const resolvedCv = cv_url !== undefined ? cv_url : (cv !== undefined ? cv : existing?.cv_url);
                const data = {
                    name: name || null,
                    title: title || null,
                    photo_path: photo || null,
                    logo_path: logo || null,
                    phone: phone || null,
                    email: email || null,
                    linkedin_url: linkedin || null,
                    github_url: github || null,
                    portfolio_url: portfolio || null,
                    location: location || null,
                    military_status: militaryStatus || null,
                    cv_url: resolvedCv || null,
                    updated_at: new Date()
                };

                if (existing) {
                    await ProfilePersonalInfo.update(data, { where: { id: existing.id } });
                } else {
                    await ProfilePersonalInfo.create({ ...data, created_at: new Date() });
                }
                return ok({ success: true }, {}, { headers: corsHeaders });
            }

            if (action === 'save_about' && aboutData) {
                const existing = await ProfileAbout.findOne({ attributes: ['id'], raw: true });
                const whatStr = JSON.stringify(aboutData.whatIDo || []);
                const coreStr = JSON.stringify(aboutData.coreExpertise || []);
                const data = {
                    summary: aboutData.summary || '',
                    what_i_do: whatStr,
                    core_expertise: coreStr,
                    updated_at: new Date()
                };

                if (existing) {
                    await ProfileAbout.update(data, { where: { id: existing.id } });
                } else {
                    await ProfileAbout.create(data);
                }
                return ok({ success: true }, {}, { headers: corsHeaders });
            }

            if (action === 'save_experience' && experienceData) {
                await sequelize.transaction(async (t) => {
                    await ProfileExperience.destroy({ where: {}, truncate: true, transaction: t });
                    const records = (experienceData.experiences || []).map(exp => ({
                        company: exp.company || '',
                        role: exp.role || '',
                        duration: exp.duration || '',
                        logo_url: exp.logo || null,
                        link_url: exp.link || null,
                        description: exp.description || null
                    }));
                    if (records.length > 0) {
                        await ProfileExperience.bulkCreate(records, { transaction: t });
                    }
                });
                return ok({ success: true }, {}, { headers: corsHeaders });
            }

            if (action === 'save_education' && educationData) {
                await sequelize.transaction(async (t) => {
                    await ProfileEducation.destroy({ where: {}, truncate: true, transaction: t });
                    const eduRecords = (educationData.education || []).map(edu => ({
                        degree: edu.degree || '',
                        institution: edu.institution || '',
                        year_range: edu.year || '',
                        grade: edu.grade || null,
                        description: edu.description || null
                    }));
                    if (eduRecords.length > 0) {
                        await ProfileEducation.bulkCreate(eduRecords, { transaction: t });
                    }

                    await ProfileCertificate.destroy({ where: {}, truncate: true, transaction: t });
                    const certRecords = (educationData.certificates || []).map(cert => ({
                        name: cert.name || '',
                        institution: cert.institution || '',
                        issue_date: cert.date || ''
                    }));
                    if (certRecords.length > 0) {
                        await ProfileCertificate.bulkCreate(certRecords, { transaction: t });
                    }
                });
                return ok({ success: true }, {}, { headers: corsHeaders });
            }

            if (action === 'save_projects' && projectsData) {
                const seenNames = new Set();
                const uniqueProjects = [];
                for (const proj of (projectsData.projects || [])) {
                    const norm = (proj.name || '').trim().toLowerCase();
                    if (norm && !seenNames.has(norm)) {
                        seenNames.add(norm);
                        uniqueProjects.push(proj);
                    }
                }

                await sequelize.transaction(async (t) => {
                    await ProfileProject.destroy({ where: {}, truncate: true, transaction: t });

                    const projectRecords = uniqueProjects.map((proj, sortIndex) => {
                        const lat = proj.coordinates?.lat || proj.lat || null;
                        const lng = proj.coordinates?.lng || proj.lng || null;
                        const currentOrder = proj.sort_order !== undefined && proj.sort_order !== null ? proj.sort_order : sortIndex;
                        return {
                            name: proj.name || '',
                            company: proj.company || '',
                            role: proj.role || '',
                            link_url: proj.link || null,
                            description: proj.description || null,
                            logo_url: proj.logo || proj.logo_url || null,
                            country: proj.country || null,
                            category: proj.category || 'other',
                            geo_lat: lat,
                            geo_long: lng,
                            sort_order: currentOrder
                        };
                    });

                    if (projectRecords.length > 0) {
                        await ProfileProject.bulkCreate(projectRecords, { transaction: t });
                    }
                });
                return ok({ success: true, count: uniqueProjects.length }, {}, { headers: corsHeaders });
            }

            if (action === 'save_skills' && skillsData) {
                await sequelize.transaction(async (t) => {
                    await ProfileSkill.destroy({ where: {}, truncate: true, transaction: t });
                    const skillsMap = skillsData.skillsByCategory || {};
                    const skillRecords = [];
                    for (const cat of Object.keys(skillsMap)) {
                        for (const sk of (skillsMap[cat] || [])) {
                            skillRecords.push({
                                category: cat,
                                skill_name: sk.name || sk.skill || '',
                                rating: sk.rating || 5,
                                badge: sk.badge || null,
                                is_highlight: sk.highlight || sk.is_highlight ? 1 : 0
                            });
                        }
                    }
                    if (skillRecords.length > 0) {
                        await ProfileSkill.bulkCreate(skillRecords, { transaction: t });
                    }
                });
                return ok({ success: true }, {}, { headers: corsHeaders });
            }

            
            if (action === 'save_sections' && Array.isArray(body.sections)) {
                for (const sec of body.sections) {
                    if (sec.section_key) {
                        const existing = await ProfilePageSection.findOne({ where: { section_key: sec.section_key } });
                        const payload = {
                            page: sec.page || existing?.page || 'global',
                            title: sec.title !== undefined ? sec.title : existing?.title,
                            subtitle: sec.subtitle !== undefined ? sec.subtitle : existing?.subtitle,
                            content: sec.content !== undefined ? sec.content : existing?.content,
                            meta: sec.meta !== undefined ? sec.meta : existing?.meta,
                            sort_order: sec.sort_order !== undefined ? sec.sort_order : existing?.sort_order,
                            is_active: sec.is_active !== undefined ? sec.is_active : (existing?.is_active ?? true),
                            updated_at: new Date()
                        };
                        if (existing) {
                            await ProfilePageSection.update(payload, { where: { id: existing.id } });
                        } else {
                            await ProfilePageSection.create({ ...payload, section_key: sec.section_key });
                        }
                    }
                }
                return ok({ success: true }, {}, { headers: corsHeaders });
            }

            if (action === 'save_section' && body.section) {
                const sec = body.section;
                if (sec.section_key) {
                    const existing = await ProfilePageSection.findOne({ where: { section_key: sec.section_key } });
                    const payload = {
                        page: sec.page || existing?.page || 'global',
                        title: sec.title !== undefined ? sec.title : existing?.title,
                        subtitle: sec.subtitle !== undefined ? sec.subtitle : existing?.subtitle,
                        content: sec.content !== undefined ? sec.content : existing?.content,
                        meta: sec.meta !== undefined ? sec.meta : existing?.meta,
                        sort_order: sec.sort_order !== undefined ? sec.sort_order : existing?.sort_order,
                        is_active: sec.is_active !== undefined ? sec.is_active : (existing?.is_active ?? true),
                        updated_at: new Date()
                    };
                    if (existing) {
                        await ProfilePageSection.update(payload, { where: { id: existing.id } });
                    } else {
                        await ProfilePageSection.create({ ...payload, section_key: sec.section_key });
                    }
                    return ok({ success: true }, {}, { headers: corsHeaders });
                }
            }

            return ok({ success: true }, {}, { headers: corsHeaders });
        } catch (err) {
            return apiError(err);
        }
    }
}

export default ProfileController;
