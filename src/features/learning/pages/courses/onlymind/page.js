import { redirect } from '@/shared/next-compat/navigation';

export default function CourseOnlymindPage() {
    redirect('/courses/materials?type=onlymind');
}
