import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export function HomeScreen() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f6f6f6]">
        <header className="flex h-12 items-center border-b px-3">
          <SidebarTrigger />
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="max-w-sm text-xl font-medium tracking-tight text-foreground">
              Organize and run your automations in one place.
            </p>
            <Button size="lg">Create automation</Button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
