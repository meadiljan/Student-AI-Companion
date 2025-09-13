"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardHeader = () => {
  // Placeholder for user name
  const userName = "Alysia";

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-xl shadow-sm mb-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-foreground">Hello {userName}!</h2>
        <p className="text-muted-foreground text-sm">Let's learn something new today!</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 rounded-lg border bg-background focus-visible:ring-ring focus-visible:ring-offset-0"
          />
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5 text-foreground" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default DashboardHeader;