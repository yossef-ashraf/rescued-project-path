import { redirect } from '@/shared/next-compat/navigation';

export default function NotesOnlyMindRedirect() {
    redirect('/courses/materials?type=onlymind');
}
