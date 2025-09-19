"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  userName?: string;
  userAvatar?: string;
}

const DashboardHeader = ({ userName = "Alysia", userAvatar }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between pb-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-foreground">Hello {userName}!</h2>
        <p className="text-muted-foreground text-sm">Let's learn something new today!</p>
      </div>
    </div>
  );
};

export default DashboardHeader;