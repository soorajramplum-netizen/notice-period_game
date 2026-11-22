import { notFound } from 'next/navigation';
import BotLab from '@/components/BotLab';

// Dev-only play-test page: /botlab (?runs=16&levels=3,9). Not available in production.
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <BotLab />;
}
