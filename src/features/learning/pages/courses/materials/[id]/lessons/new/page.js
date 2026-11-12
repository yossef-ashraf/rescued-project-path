'use client';

import React, { use, useState, useEffect } from 'react';
import LessonWorkspaceView from '@/features/learning/components/LessonWorkspaceView.jsx';
import { fetchMaterialDetails } from '@/features/learning/api/materials.api.js';
import { useApp } from '@/shared/context/AppContext.js';

export default function NewMaterialLessonPage({ params }) {
    const resolvedParams = use(params);
    const materialId = resolvedParams?.id;
    const { t } = useApp();

    const [courseId, setCourseId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!materialId) return;
        fetchMaterialDetails(materialId)
            .then(data => {
                if (data?.course?.id) {
                    setCourseId(data.course.id);
                }
            })
            .catch(err => console.error('Failed to resolve container course for material:', err))
            .finally(() => setLoading(false));
    }, [materialId]);

    if (loading) {
        return (
            <div className="py-24 text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                <span className="text-xs text-inkMuted font-medium">{t("Preparing lesson workspace...", "جاري تجهيز مساحة المحاضرة...")}</span>
            </div>
        );
    }

    return (
        <LessonWorkspaceView
            courseId={courseId}
            lessonId={null}
            isNew={true}
            backUrl={`/courses/materials/${materialId}`}
            basePath={`/courses/materials/${materialId}`}
        />
    );
}
