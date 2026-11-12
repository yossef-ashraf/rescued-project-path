'use client';

import { useEffect } from 'react';
import { useRouter } from '@/shared/next-compat/navigation';

export default function CoursesPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/courses/hierarchy');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-canvas text-inkMuted text-xs">
            Redirecting to Course Hierarchy...
        </div>
    );
}
