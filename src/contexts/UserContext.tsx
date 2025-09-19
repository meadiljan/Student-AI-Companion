"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface UserContextType {
  user: User;
  updateUser: (userData: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({
    name: "Muhammad Adil Jan",
    email: "adil@example.com",
    avatar: ""
  });

  // Load user data from localStorage on initial load
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.userProfile) {
          setUser(prev => ({
            ...prev,
            ...settings.userProfile
          }));
        }
      } catch (e) {
        console.error("Failed to parse user settings", e);
      }
    }
  }, []);

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => ({
      ...prev,
      ...userData
    }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};