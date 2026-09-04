import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import { HomeScreenProps } from './types';

export function HomeScreen(props: HomeScreenProps) {
  void props;
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="max-w-sm text-xl font-medium tracking-tight text-foreground">
          Organize and run your automations in one place.
        </p>
        <Button size="lg" asChild>
          <Link to="/automations/new">Create automation</Link>
        </Button>
      </div>
    </main>
  );
}
