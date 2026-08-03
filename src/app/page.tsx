import { PlayerCard } from '@/components/player/PlayerCard';
import { PlayerProvider } from '@/store/PlayerProvider';

export default function Home() {
  return (
    <PlayerProvider>
      <main className="flex min-h-dvh items-center justify-center p-6">
        <PlayerCard />
      </main>
    </PlayerProvider>
  );
}
