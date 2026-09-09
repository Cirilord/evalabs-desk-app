import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { LogicalPosition } from '@tauri-apps/api/dpi';
import { listen } from '@tauri-apps/api/event';
import { Menu } from '@tauri-apps/api/menu';
import { PlusIcon, SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { SettingsModal } from '@/components/shared/SettingsModal';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';
import type { $AutomationPayload, $RunPayload } from '@/data/sqlite/types';

import type { AppSidebarProps } from './types';

function getRunIndicator(status: $RunPayload['status'] | undefined, t: (key: string) => string) {
  switch (status) {
    case 'preparing':
      return {
        className: 'animate-pulse fill-current text-warning',
        label: 'Installing dependencies',
      };
    case 'running':
      return { className: 'animate-pulse fill-current text-primary', label: t('sidebar.running') };
    case 'succeeded':
      return { className: 'fill-current text-success', label: 'Succeeded' };
    case 'failed':
      return { className: 'fill-current text-destructive', label: t('sidebar.failed') };
    default:
      return { className: 'text-muted-foreground', label: t('sidebar.noRuns') };
  }
}

export function AppSidebar(props: AppSidebarProps) {
  const { automations, isLoading, loadError } = props;
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: latestRuns = [] } = useQuery({
    queryKey: queryKeys.latestRuns,
    queryFn: () => sqlite.run.findLatestByAutomation(),
  });
  const latestRunByAutomation = new Map(latestRuns.map((run) => [run.automationId, run] as const));

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listen('run:updated', () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.latestRuns });
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => unlisten?.();
  }, [queryClient]);

  async function cloneAutomation(automation: $AutomationPayload) {
    const suffix = ' copy';
    const name = `${automation.name.slice(0, 100 - suffix.length).trimEnd()}${suffix}`;
    const clonedAutomation = await sqlite.automation.create({
      data: {
        name,
        description: automation.description,
        script: automation.script,
        scriptSource: automation.scriptSource,
        scriptPath: automation.scriptPath,
        libraries: automation.libraries,
        inputs: automation.inputs,
        outputs: automation.outputs,
      },
    });

    await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
    await navigate(`/automations/${clonedAutomation.id}`);
  }

  async function deleteAutomation(automation: $AutomationPayload) {
    await invoke('delete_automation_environment', { automationId: automation.id });
    await sqlite.automation.delete({ where: { id: automation.id } });
    await queryClient.invalidateQueries({ queryKey: queryKeys.automations });

    if (location.pathname.startsWith(`/automations/${automation.id}`)) {
      await navigate('/');
    }
  }

  async function showAutomationMenu(
    automation: $AutomationPayload,
    position: { x: number; y: number }
  ) {
    const menu = await Menu.new({
      items: [
        {
          action: () => void cloneAutomation(automation),
          id: `clone-${automation.id}`,
          text: 'Clone automation',
        },
        {
          action: () => void deleteAutomation(automation),
          id: `delete-${automation.id}`,
          text: t('sidebar.deleteAutomation'),
        },
      ],
    });

    await menu.popup(new LogicalPosition(position.x, position.y));
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 justify-center border-b border-sidebar-border px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="EVA Labs" asChild>
              <Link to="/">
                <img alt="" aria-hidden="true" className="size-8 rounded-md" src="/logo.svg" />
                <span className="font-semibold">EVA Labs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.automations')}</SidebarGroupLabel>
          <SidebarGroupAction aria-label={t('sidebar.createAutomation')} asChild>
            <Link to="/automations/new">
              <PlusIcon />
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            {isLoading ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              </SidebarMenu>
            ) : loadError ? (
              <p className="px-2 py-4 text-sm text-destructive group-data-[collapsible=icon]:hidden">
                Could not load automations.
              </p>
            ) : automations.length === 0 ? (
              <p className="px-2 py-4 text-sm text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                {t('sidebar.noAutomations')}
              </p>
            ) : (
              <SidebarMenu>
                {automations.map((automation) => {
                  const indicator = getRunIndicator(
                    latestRunByAutomation.get(automation.id)?.status,
                    t
                  );

                  return (
                    <SidebarMenuItem key={automation.id}>
                      <SidebarMenuButton
                        className="select-none"
                        tooltip={`${automation.name}: ${indicator.label}`}
                        onClick={() => navigate(`/automations/${automation.id}`)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          void showAutomationMenu(automation, {
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-current ${indicator.className}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                        </span>
                        <span>{automation.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SettingsModal
              trigger={
                <SidebarMenuButton className="select-none" tooltip={t('sidebar.settings')}>
                  <SettingsIcon />
                  <span>{t('sidebar.settings')}</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
