import { Button } from '@/components/ui/button';

export function HomeScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f6] p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="max-w-sm text-xl font-medium tracking-tight text-foreground">
          Organize and run your automations in one place.
        </p>
        <Button size="lg">Create automation</Button>
      </div>
    </main>
  );
}
