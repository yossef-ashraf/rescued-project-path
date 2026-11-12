import { redirect } from '@/shared/next-compat/navigation';

export default function CourseNotesRedirect() {
    redirect('/courses/materials?type=summary');
}
