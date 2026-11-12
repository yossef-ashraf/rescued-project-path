/**
 * Operations Service
 * Architecture v2
 */

export function aggregateProjectStats(projects = []) {
    let active = 0;
    let completed = 0;
    let planning = 0;

    projects.forEach((p) => {
        if (p.status === 'completed') completed++;
        else if (p.status === 'active') active++;
        else planning++;
    });

    return {
        total: projects.length,
        active,
        completed,
        planning,
        completionRate: projects.length > 0 ? Math.round((completed / projects.length) * 100) : 0
    };
}

export function calculatePipelineValue(leads = []) {
    let totalValue = 0;
    let wonValue = 0;
    const stageCounts = {};

    leads.forEach((l) => {
        const val = Number(l.value) || 0;
        totalValue += val;
        if (l.stage === 'won') wonValue += val;
        stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
    });

    return {
        totalLeads: leads.length,
        totalPipelineValue: totalValue,
        wonValue,
        stageCounts
    };
}

const serviceExports = {
    aggregateProjectStats,
    calculatePipelineValue
};

export default serviceExports;
