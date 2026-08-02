"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ShieldCheck, HardHat, User, LayoutDashboard, FileText, Users, Briefcase, Settings, LogOut, KeyRound } from "lucide-react";

interface PortalShellProps {
  portalRole: "operations" | "customer" | "crew";
  userEmail?: string;
  userName?: string;
  children: React.ReactNode;
}

export function PortalShell({
  portalRole,
  userEmail = "operator@skysthelimitpainting.com",
  userName = "Sky’s Operator",
  children,
}: PortalShellProps) {
  const pathname = usePathname();

  const getPortalBadge = () => {
    switch (portalRole) {
      case "operations":
        return <Badge className="bg-amber-500 text-black font-semibold">Operations Command</Badge>;
      case "customer":
        return <Badge className="bg-blue-600 text-white font-semibold">Customer Hub</Badge>;
      case "crew":
        return <Badge className="bg-emerald-600 text-white font-semibold">Field Crew Portal</Badge>;
    }
  };

  const getNavItems = () => {
    if (portalRole === "operations") {
      return [
        { label: "Overview", href: "/operations", icon: LayoutDashboard },
        { label: "Leads Queue", href: "/operations#leads", icon: Users },
        { label: "Estimates", href: "/operations#estimates", icon: FileText },
        { label: "Active Jobs", href: "/operations#jobs", icon: Briefcase },
        { label: "Crew Directory", href: "/operations#crew", icon: HardHat },
        { label: "CMS Manager", href: "/operations#cms", icon: Settings },
        { label: "Security Audit", href: "/operations#audit", icon: ShieldCheck },
      ];
    }
    if (portalRole === "customer") {
      return [
        { label: "Project Status", href: "/customer", icon: LayoutDashboard },
        { label: "Estimates & Scope", href: "/customer#estimates", icon: FileText },
        { label: "Documents", href: "/customer#documents", icon: ShieldCheck },
        { label: "My Property", href: "/customer#property", icon: User },
      ];
    }
    return [
      { label: "Today’s Jobs", href: "/crew", icon: HardHat },
      { label: "Prep Checklists", href: "/crew#checklists", icon: ShieldCheck },
      { label: "Submit Update", href: "/crew#update", icon: FileText },
      { label: "Access Notes", href: "/crew#access", icon: User },
    ];
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-4 border-b border-border flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary tracking-tight">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              Sky’s Signature System
            </Link>
            <div>{getPortalBadge()}</div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1">
                Portal Menu
              </SidebarGroupLabel>
              <SidebarMenu>
                {getNavItems().map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                      >
                        <Link href={item.href}>
                          <Icon className="w-4 h-4 text-primary" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Sky’s the Limit Painting LLC
              </span>
            </div>

            {/* Right User & Auth Controls */}
            <div className="flex items-center gap-3 text-xs">
              <Badge variant="outline" className="hidden sm:inline-flex border-amber-500/40 text-amber-500 font-mono gap-1">
                <KeyRound className="w-3 h-3" /> WorkOS AuthKit
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent border border-border transition-colors text-left">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
                      {userName.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="font-semibold text-foreground leading-none">{userName}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{userEmail}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/operations" className="cursor-pointer">Operations Command</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer" className="cursor-pointer">Customer Hub</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/crew" className="cursor-pointer">Field Crew Portal</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/sign-out" className="cursor-pointer text-destructive flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign Out (WorkOS)
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
