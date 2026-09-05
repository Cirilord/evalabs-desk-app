import { useQueryClient } from '@tanstack/react-query';
import { LogicalPosition } from '@tauri-apps/api/dpi';
import { Menu } from '@tauri-apps/api/menu';
import { CircleIcon, PlusIcon, SettingsIcon, SparklesIcon } from 'lucide-react';
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
import type { $AutomationPayload } from '@/data/sqlite/types';

import type { AppSidebarProps } from './types';

export function AppSidebar(props: AppSidebarProps) {
  const { automations, isLoading, loadError } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        inputs: automation.inputs,
        outputs: automation.outputs,
      },
    });

    await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
    await navigate(`/automations/${clonedAutomation.id}`);
  }

  async function deleteAutomation(automation: $AutomationPayload) {
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
          text: 'Delete automation',
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
            <SidebarMenuButton size="lg" tooltip="Eva" asChild>
              <Link to="/">
                <SparklesIcon />
                <span className="font-semibold">Eva</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Automations</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Create automation" asChild>
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
                No automations yet.
              </p>
            ) : (
              <SidebarMenu>
                {automations.map((automation) => (
                  <SidebarMenuItem key={automation.id}>
                    <SidebarMenuButton
                      className="select-none"
                      tooltip={automation.name}
                      onClick={() => navigate(`/automations/${automation.id}`)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        void showAutomationMenu(automation, {
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }}
                    >
                      <CircleIcon />
                      <span>{automation.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
                <SidebarMenuButton className="select-none" tooltip="Settings">
                  <SettingsIcon />
                  <span>Settings</span>
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
