import { redirect } from '@/shared/next-compat/navigation';

export default function OperationsPage() {
    redirect('/tasks/overview');
}
