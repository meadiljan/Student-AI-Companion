"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  return (
    <div className="flex min-h-screen bg-background p-4">
      <Sidebar isCollapsed={isCollapsed} className="hidden md:flex" />
      <div
        className={`relative flex flex-1 flex-col rounded-2xl bg-card p-6 shadow-lg transition-all duration-300 ${
          isCollapsed ? "md:ml-4" : "md:ml-6"
        }`}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -left-4 top-1/2 hidden -translate-y-1/2 rounded-full md:flex"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;