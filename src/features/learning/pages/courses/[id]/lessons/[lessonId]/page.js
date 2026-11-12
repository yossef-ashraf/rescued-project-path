'use client';

import React from 'react';
import { useParams } from '@/shared/next-compat/navigation';
import LessonWorkspaceView from '@/features/learning/components/LessonWorkspaceView.jsx';

export default function LessonPage() {
    const params = useParams();
    const courseId = params?.id || params?.courseId;
    const lessonId = params?.lessonId;

    return (
        <LessonWorkspaceView
            courseId={courseId}
            lessonId={lessonId}
            isNew={false}
        />
    );
}
