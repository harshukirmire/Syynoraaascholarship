import { AppLayout } from '../components/AppLayout.tsx';
import { ScholarshipDirectoryView } from '../components/ScholarshipDirectoryView.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

export function ExplorerPage() {
  const { scholarships } = useAuth();

  return (
    <AppLayout>
      <ScholarshipDirectoryView
        title="Scholarship Explorer"
        subtitle="Search and filter verified scholarships by provider, study level, academic field, funding coverage, country, and examination requirements."
        scholarships={scholarships}
      />
    </AppLayout>
  );
}
