import { CircleIcon, PlusIcon, SettingsIcon, SparklesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

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

import type { AppSidebarProps } from './types';

export function AppSidebar(props: AppSidebarProps) {
  const { automations, isLoading, loadError } = props;
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
                    <SidebarMenuButton tooltip={automation.name}>
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
            <SidebarMenuButton tooltip="Create automation" asChild>
              <Link to="/automations/new">
                <PlusIcon />
                <span>Create automation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <SettingsIcon />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
