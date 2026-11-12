import { redirect } from '@/shared/next-compat/navigation';

export default function CourseSummariesPage() {
    redirect('/courses/materials?type=summary');
}
