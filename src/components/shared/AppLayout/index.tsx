import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { AppSidebar } from '@/components/shared/AppSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';

import { AppLayoutProps } from './types';

export function AppLayout(props: AppLayoutProps) {
  void props;
  useEffect(() => {
    function preventBrowserContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    function preventBrowserDrag(event: DragEvent) {
      event.preventDefault();
    }

    window.addEventListener('contextmenu', preventBrowserContextMenu, true);
    window.addEventListener('dragstart', preventBrowserDrag, true);

    return () => {
      window.removeEventListener('contextmenu', preventBrowserContextMenu, true);
      window.removeEventListener('dragstart', preventBrowserDrag, true);
    };
  }, []);

  const {
    data: automations = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.automations,
    queryFn: () => sqlite.automation.findMany(),
  });

  return (
    <SidebarProvider>
      <AppSidebar
        automations={automations}
        isLoading={isLoading}
        loadError={error ? (error instanceof Error ? error.message : String(error)) : null}
      />
      <SidebarInset className="h-svh overflow-hidden bg-muted/40">
        <header className="flex h-12 shrink-0 items-center border-b px-3">
          <SidebarTrigger />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
