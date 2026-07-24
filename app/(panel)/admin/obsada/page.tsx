'use client';

import { useRouter } from 'next/navigation';
import { useChecklista } from '../../../../src/hooks/useChecklista';
import { useAdmin } from '../../../../src/hooks/useAdmin';
import TabObsada from '../../../../src/components/admin/TabHandel'; // Zgodnie z Twoim starym importem

export default function ObsadaPage() {
  const router = useRouter();
  const { userProfil } = useChecklista(router);
  const adminStany = useAdmin(userProfil);
  
  return <TabObsada {...adminStany} />;
}