/**
 * Profile Service
 * Architecture v2
 */

export function calculateProfileCompleteness(profile = {}) {
    const personal = profile.personalInfo || profile.personal || {};
    const about = profile.aboutData || profile.about || {};
    const experiences = profile.experienceData?.experiences || profile.experience || [];
    const education = profile.educationData?.education || profile.education || [];
    const projects = profile.projectsData?.projects || profile.projects || [];
    const skillsMap = profile.skillsData?.skillsByCategory || profile.skills?.skillsByCategory || {};
    const skillsCount = Object.values(skillsMap).flat().length;

    const sections = [
        { key: 'personal_info', weight: 30, filled: Boolean(personal.name && personal.title) },
        { key: 'about', weight: 15, filled: Boolean(about.summary) },
        { key: 'experience', weight: 20, filled: Array.isArray(experiences) && experiences.length > 0 },
        { key: 'education', weight: 15, filled: Array.isArray(education) && education.length > 0 },
        { key: 'skills', weight: 10, filled: skillsCount > 0 },
        { key: 'projects', weight: 10, filled: Array.isArray(projects) && projects.length > 0 }
    ];

    let score = 0;
    sections.forEach((s) => {
        if (s.filled) score += s.weight;
    });

    return {
        score,
        sections
    };
}

const serviceExports = {
    calculateProfileCompleteness
};

export default serviceExports;
