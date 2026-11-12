import { redirect } from '@/shared/next-compat/navigation';

export default function NotesPage() {
    redirect('/courses/materials?type=summary');
}
