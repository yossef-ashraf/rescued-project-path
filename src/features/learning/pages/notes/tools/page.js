import { redirect } from '@/shared/next-compat/navigation';

export default function NotesToolsPage() {
    redirect('/courses/materials?type=tools');
}
