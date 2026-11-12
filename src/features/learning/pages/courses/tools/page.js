import { redirect } from '@/shared/next-compat/navigation';

export default function CourseToolsPage() {
    redirect('/courses/materials?type=tools');
}
