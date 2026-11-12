import { redirect } from '@/shared/next-compat/navigation';

export default function CourseOnlyMindLegacyPage() {
    redirect('/courses/materials?type=onlymind');
}
