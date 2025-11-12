"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import AISearchWidget from "./AISearchWidget";

interface DashboardHeaderProps {
  userName?: string;
  userAvatar?: string;
}

const DashboardHeader = ({ userName = "Muhammad Adil Jan", userAvatar }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col pb-6 space-y-6">
      {/* Greeting Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold text-foreground">Good afternoon, Muhammad</h2>
          <p className="text-muted-foreground text-base mt-1">What can I help you with today?</p>
        </div>
      </div>
      
      {/* AI Search Widget */}
      <AISearchWidget />
    </div>
  );
};

export default DashboardHeader;