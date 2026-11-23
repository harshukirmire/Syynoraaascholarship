import { AppLayout } from '../components/AppLayout.tsx';
import { ScholarshipDirectoryView } from '../components/ScholarshipDirectoryView.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

export function GlobalScholarshipsPage() {
  const { scholarships } = useAuth();

  return (
    <AppLayout>
      <ScholarshipDirectoryView
        title="Global Scholarships Directory"
        subtitle="Browse verified scholarship programs across India (Central, State, AICTE, UGC) and international destinations independently without profile-based filtering."
        scholarships={scholarships}
        bannerNote="Independent Directory: Synora maintains a curated catalog of verified programs (CSC, MEXT, GKS, DAAD, Erasmus Mundus, Fulbright, Chevening, Commonwealth, NSP, AICTE, MahaDBT, UGC) rather than claiming to list every scholarship worldwide."
      />
    </AppLayout>
  );
}
