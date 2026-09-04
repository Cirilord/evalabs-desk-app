import { useQuery } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';

import { AppSidebar } from '@/components/shared/AppSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';

import { AppLayoutProps } from './types';

export function AppLayout(props: AppLayoutProps) {
  void props;
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
      <SidebarInset className="h-svh overflow-hidden bg-[#f6f6f6]">
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
