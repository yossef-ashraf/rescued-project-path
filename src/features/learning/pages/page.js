import { redirect } from '@/shared/next-compat/navigation';

export default function LearningPage() {
    redirect('/courses/overview');
}
