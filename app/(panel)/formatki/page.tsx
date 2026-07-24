'use client';

import { useRouter } from 'next/navigation';
import { useChecklista } from '../../../src/hooks/useChecklista';
import TabFormatki from '../../../src/components/TabFormatki';

export default function FormatkiPage() {
  const router = useRouter();
  const checklistaStany = useChecklista(router);
  return <TabFormatki {...checklistaStany} />;
}