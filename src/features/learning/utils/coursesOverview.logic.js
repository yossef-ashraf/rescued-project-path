export function calculateCategoryCompletion(categoryBreakdown = []) {
    return [...categoryBreakdown]
        .sort((a, b) => (b.progress || 0) - (a.progress || 0))
        .slice(0, 5)
        .map(c => ({
            name: c.name || 'General',
            rate: c.progress || 0
        }));
}

export function calculateCategoryVolume(categoryBreakdown = []) {
    return [...categoryBreakdown]
        .sort((a, b) => (b.totalCourses || 0) - (a.totalCourses || 0))
        .slice(0, 5)
        .map(c => ({
            name: c.name || 'General',
            count: c.totalCourses || 0
        }));
}

export function calculateCourseProgressRankings(allCoursesList = []) {
    const onlyCourses = allCoursesList.filter(i => i.type !== 'category');
    return onlyCourses
        .sort((a, b) => (Number(b.progress_percentage) || 0) - (Number(a.progress_percentage) || 0))
        .slice(0, 5)
        .map(c => ({
            name: c.title || 'Course',
            progress: Math.round(Number(c.progress_percentage) || 0)
        }));
}

export function calculateCourseUnitsRankings(allCoursesList = []) {
    const onlyCourses = allCoursesList.filter(i => i.type !== 'category');
    return onlyCourses
        .sort((a, b) => (Number(b.total_units) || 0) - (Number(a.total_units) || 0))
        .slice(0, 5)
        .map(c => ({
            name: c.title || 'Course',
            units: Number(c.total_units) || 1
        }));
}

export function calculateCategoryCompetency(radarData = []) {
    return radarData.map(d => ({
        name: d.fullCategory || d.category || 'Category',
        score: d.score || 0,
        completedUnits: d.completedUnits || 0,
        totalUnits: d.totalUnits || 0
    })).sort((a, b) => b.score - a.score);
}
