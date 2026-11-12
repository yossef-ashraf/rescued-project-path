'use client';

import React from 'react';
import { useParams } from '@/shared/next-compat/navigation';
import LessonWorkspaceView from '@/features/learning/components/LessonWorkspaceView.jsx';

export default function NewLessonPage() {
    const params = useParams();
    const courseId = params?.id || params?.courseId;

    return (
        <LessonWorkspaceView
            courseId={courseId}
            lessonId={null}
            isNew={true}
        />
    );
}
