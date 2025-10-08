"use client";

import React from "react";
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
  NotebookPen,
  Settings,
  BookOpenCheck,
  LogOut,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
  onSettingsClick?: () => void;
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
];

export function Sidebar({ className, isCollapsed, onSettingsClick }: SidebarProps) {
  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    console.log("Logout clicked");
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
        {/* Settings Section */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start rounded-2xl",
            isCollapsed ? "h-9 px-2" : "h-10 px-4",
          )}
          onClick={onSettingsClick}
        >
          <Settings className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          <span
            className={cn(
              "transition-opacity duration-300",
              isCollapsed && "opacity-0",
            )}
          >
            Settings
          </span>
        </Button>
      </div>
    </div>
  );
}