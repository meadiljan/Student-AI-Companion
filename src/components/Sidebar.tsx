"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Book,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  NotebookPen,
  Settings,
  BookOpenCheck,
  User,
  LogOut,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: Book,
  },
  {
    title: "Courses",
    href: "/courses",
    icon: BookOpenCheck,
  },
  {
    title: "Calendar",
    href: "/timetable",
    icon: CalendarDays,
  },
  {
    title: "Notes",
    href: "/notes",
    icon: NotebookPen,
  },
  {
    title: "Study Focus",
    href: "/study-focus",
    icon: Lightbulb,
  },
];

export function Sidebar({ className, isCollapsed }: SidebarProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    console.log("Logout clicked");
    setIsAccountMenuOpen(false);
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-3xl bg-sidebar p-4 shadow-lg transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-center px-4">
        <h1
          className={cn(
            "text-2xl font-bold text-sidebar-primary transition-opacity duration-300",
            isCollapsed && "opacity-0",
          )}
        >
          UniPal
        </h1>
        <h1
          className={cn(
            "text-2xl font-bold text-sidebar-primary transition-opacity duration-300",
            !isCollapsed && "opacity-0 absolute",
          )}
        >
          UP
        </h1>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start gap-2 px-2">
          {navItems.map((item, index) => (
            <Link key={index} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start rounded-2xl",
                  isCollapsed ? "h-9 px-2" : "h-10 px-4",
                )}
              >
                <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                <span
                  className={cn(
                    "transition-opacity duration-300",
                    isCollapsed && "opacity-0",
                  )}
                >
                  {item.title}
                </span>
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto px-2 py-4">
        {/* Account Section with Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start rounded-2xl",
              isCollapsed ? "h-9 px-2" : "h-10 px-4",
            )}
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          >
            <User className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            <span
              className={cn(
                "transition-opacity duration-300",
                isCollapsed && "opacity-0",
              )}
            >
              Account
            </span>
          </Button>
          
          {/* Account Dropdown Menu */}
          {isAccountMenuOpen && !isCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg py-2">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-2xl h-10 px-4"
                onClick={() => {
                  // This will be handled by the parent component
                  // For now, we'll just close the menu
                  setIsAccountMenuOpen(false);
                  // The actual settings opening is handled in MainLayout
                }}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-2xl h-10 px-4"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}