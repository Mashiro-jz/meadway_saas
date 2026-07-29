'use client';

import { useParams, useRouter } from 'next/navigation';
import ProfilPracownika from '../../../../../src/components/admin/ProfilPracownika';

export default function PracownikProfilPage() {
  const params = useParams();
  const router = useRouter();
  
  // Rzutujemy id z linku na numer
  const idUzytkownika = Number(params.id);

  // Zabezpieczenie: jeśli ktoś wpisze tekst zamiast ID (np. /abc), to zwróci pustkę, 
  // ale bezpiecznie przepuści 0!
  if (Number.isNaN(idUzytkownika)) return null;

  return (
    <ProfilPracownika 
      idUzytkownika={idUzytkownika} 
      onBack={() => router.push('/admin/pracownicy')} 
    />
  );
}