'use client';

import { useRouter } from 'next/navigation';
import { useChecklista } from '../../../src/hooks/useChecklista';
import TabGrafik from '../../../src/components/TabGrafik';

export default function GrafikPage() {
  const router = useRouter();
  const checklistaStany = useChecklista(router);
  return <TabGrafik {...checklistaStany} />;
}