'use client';

import { useRouter } from 'next/navigation';
import { useChecklista } from '../../src/hooks/useChecklista';
import TabHandel from '../../src/components/TabHandel';

export default function HomePage() {
  const router = useRouter();
  const checklistaStany = useChecklista(router);

  return (
    <TabHandel {...checklistaStany} />
  );
}