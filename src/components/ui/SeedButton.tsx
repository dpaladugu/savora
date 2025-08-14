
import { seedDatabase } from '@/lib/seed';

export const SeedButton = () =>
  import.meta.env.DEV ? (
    <button
      onClick={seedDatabase}
      className="fixed top-2 right-2 z-50 bg-blue-600 text-white px-2 py-1 rounded text-xs"
    >
      Seed
    </button>
  ) : null;
