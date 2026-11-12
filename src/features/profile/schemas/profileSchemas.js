/**
 * Profile Validation Schemas
 * Architecture v2 — Aligned with ProfilePersonalInfo, ProfileExperience, ProfileProject, ProfileSkill
 */

export const personalInfoSchema = {
    name: { type: 'string', required: true, message: 'الاسم الكامل مطلوب' },
    title: { type: 'string', required: false },
    photo: { type: 'string', required: false },
    logo: { type: 'string', required: false },
    email: { type: 'string', required: false },
    phone: { type: 'string', required: false },
    location: { type: 'string', required: false },
    militaryStatus: { type: 'string', required: false },
    github: { type: 'string', required: false },
    linkedin: { type: 'string', required: false },
    portfolio: { type: 'string', required: false },
    cv_url: { type: 'string', required: false }
};

export const experienceSchema = {
    role: { type: 'string', required: true, message: 'المسمى الوظيفي مطلوب' },
    company: { type: 'string', required: true, message: 'اسم الشركة أو الجهة مطلوب' },
    duration: { type: 'string', required: false },
    logo: { type: 'string', required: false },
    link: { type: 'string', required: false },
    description: { type: 'string', required: false }
};

export const projectSchema = {
    name: { type: 'string', required: true, message: 'اسم المشروع مطلوب' },
    company: { type: 'string', required: false },
    role: { type: 'string', required: false },
    link: { type: 'string', required: false },
    description: { type: 'string', required: false },
    logo: { type: 'string', required: false },
    country: { type: 'string', required: false },
    category: { type: 'string', required: false, default: 'commerce' },
    sort_order: { type: 'number', required: false, default: 0 }
};

export const skillSchema = {
    name: { type: 'string', required: true, message: 'اسم المهارة مطلوب' },
    category: { type: 'string', required: false, default: 'Backend Development' },
    rating: { type: 'number', required: false, default: 5 },
    badge: { type: 'string', required: false, default: 'Advanced' },
    highlight: { type: 'boolean', required: false, default: false }
};

const serviceExports = {
    personalInfoSchema,
    experienceSchema,
    projectSchema,
    skillSchema
};

export default serviceExports;
