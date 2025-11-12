"use client";

import React, { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Sun,
  Moon,
  Laptop,
  Mail,
  Smartphone,
  Tablet,
  Monitor,
  Check,
  ChevronDown,
  X
} from "lucide-react";
import { Google, OpenAI, Groq } from '@lobehub/icons';
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { eventManager } from "@/utils/eventManager";

// Function to get UTC offset for a timezone
const getTimezoneOffset = (timezone: string) => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "longOffset"
    });
    const parts = formatter.formatToParts(now);
    const timeZoneNamePart = parts.find(part => part.type === "timeZoneName");
    return timeZoneNamePart ? timeZoneNamePart.value : "";
  } catch (e) {
    return "";
  }
};

// Timezone options with UTC offsets
const timezoneOptions = [
  { value: "Asia/Karachi", label: "Islamabad/Karachi" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Pacific/Auckland", label: "Auckland" }
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "ur", label: "Urdu" }
];

const aiModelOptions = [
  { 
    value: "google-gemini", 
    label: "Google Gemini",
    subOptions: [
      { value: "gemini-2.5-pro", label: "2.5 Pro" },
      { value: "gemini-2.5-flash", label: "2.5 Flash" }
    ]
  },
  {
    value: "groq",
    label: "Groq",
    subOptions: [
      { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B 128E" },
      { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B 16E Instruct" }
    ]
  },
  { value: "gpt-4", label: "OpenAI GPT-4" },
  { value: "claude-3", label: "Anthropic Claude 3" },
  { value: "llama-3", label: "Meta Llama 3" }
];

const MainLayout = () => {
  const { user, updateUser } = useUser();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // User information from context
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [userAvatar, setUserAvatar] = useState(user.avatar);

  // Update user information when context changes
  React.useEffect(() => {
    setUserName(user.name);
    setUserEmail(user.email);
    setUserAvatar(user.avatar);
  }, [user]);

  // Load API keys on component mount
  React.useEffect(() => {
    const savedApiKeys = localStorage.getItem("aiApiKeys");
    if (savedApiKeys) {
      try {
        const parsedKeys = JSON.parse(savedApiKeys);
        setApiKeys(parsedKeys);
      } catch (error) {
        console.error("Error loading saved API keys:", error);
      }
    }
  }, []);

  // State for various settings
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // AI Integration settings
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-pro");
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({
    google: "",
    openai: "",
    groq: ""
  });
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  // State for dropdowns
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Refs for dropdowns
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get current provider and API key
  const getCurrentProvider = () => {
    if (selectedModel.includes('gemini')) return 'google';
    if (selectedModel.includes('gpt')) return 'openai';
    if (selectedModel.includes('llama')) return 'groq';
    return 'google'; // default
  };

  const getCurrentApiKey = () => {
    const provider = getCurrentProvider();
    return apiKeys[provider] || "";
  };

  const updateCurrentApiKey = (value: string) => {
    const provider = getCurrentProvider();
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) {
        setIsTimezoneDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    console.log("Logout clicked");
    setIsAccountMenuOpen(false);
  };

  const openSettings = () => {
    // Load API keys when opening settings
    const savedApiKeys = localStorage.getItem("aiApiKeys");
    if (savedApiKeys) {
      try {
        const parsedKeys = JSON.parse(savedApiKeys);
        setApiKeys(parsedKeys);
      } catch (error) {
        console.error("Error parsing saved API keys:", error);
      }
    }
    
    setIsSettingsModalOpen(true);
    setIsAccountMenuOpen(false);
  };

  const handleTestConnection = async () => {
    // Get the current provider key based on selected model
    let currentProvider = "";
    let currentApiKey = "";
    
    if (selectedModel.includes('gemini')) {
      currentProvider = "google";
      currentApiKey = apiKeys.google;
    } else if (selectedModel.includes('gpt')) {
      currentProvider = "openai";
      currentApiKey = apiKeys.openai;
    } else if (selectedModel.includes('llama')) {
      currentProvider = "groq";
      currentApiKey = apiKeys.groq;
    }

    if (!currentApiKey) {
      setTestStatus("error");
      setTestMessage(`API Key is required for ${currentProvider}`);
      toast({
        title: "API Key Required",
        description: `Please enter your ${currentProvider} API key to test the connection.`,
        variant: "destructive"
      });
      return;
    }

    setTestStatus("testing");
    setTestMessage("Testing connection...");

    try {
      // Test based on selected model
      let isValid = false;
      let message = "";
      
      if (selectedModel.includes('gemini')) {
        // Test Google Gemini API
        isValid = await testGeminiAPI(currentApiKey);
        message = isValid ? `Google Gemini connection successful!` : `Failed to connect to Google Gemini`;
      } else if (selectedModel.includes('gpt')) {
        // Test OpenAI API
        isValid = await testOpenAIAPI(currentApiKey);
        message = isValid ? "OpenAI connection successful!" : "Failed to connect to OpenAI";
      } else if (selectedModel.includes('llama')) {
        // Test Groq API
        isValid = await testGroqAPI(currentApiKey);
        message = isValid ? `Groq connection successful!` : `Failed to connect to Groq`;
      } else {
        // For other models, simulate a test
        // In a real implementation, you would add actual tests for each model
        await new Promise(resolve => setTimeout(resolve, 1000));
        isValid = Math.random() > 0.5; // Simulate random success/failure
        message = isValid ? "Connection successful!" : "Failed to connect to AI service";
      }

      if (isValid) {
        setTestStatus("success");
        setTestMessage(message);
        toast({
          title: "Connection Successful",
          description: message,
        });
      } else {
        setTestStatus("error");
        setTestMessage(message);
        toast({
          title: "Connection Failed",
          description: message,
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage("An error occurred during testing");
      toast({
        title: "Connection Failed",
        description: "An error occurred while testing the connection.",
        variant: "destructive"
      });
    }
  };

  // Function to test Google Gemini API
  const testGeminiAPI = async (key: string): Promise<boolean> => {
    try {
      // Simple test - try to list models (requires valid API key)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error("Gemini API test error:", error);
      return false;
    }
  };

  // Function to test OpenAI API
  const testOpenAIAPI = async (key: string): Promise<boolean> => {
    try {
      // Simple test - try to list models (requires valid API key)
      const response = await fetch(
        'https://api.openai.com/v1/models',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error("OpenAI API test error:", error);
      return false;
    }
  };

  // Function to test Groq API
  const testGroqAPI = async (key: string): Promise<boolean> => {
    try {
      // Simple test - try to list models (requires valid API key)
      const response = await fetch(
        'https://api.groq.com/openai/v1/models',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error("Groq API test error:", error);
      return false;
    }
  };

  const handleSaveSettings = () => {
    // Update user context
    updateUser({
      name: userName,
      email: userEmail,
      avatar: userAvatar
    });

    // Save settings to localStorage
    localStorage.setItem("appSettings", JSON.stringify({
      notifications,
      darkMode,
      language,
      timezone,
      ai: {
        selectedModel,
        apiKeysStatus: {
          google: apiKeys.google ? "********" : "",
          openai: apiKeys.openai ? "********" : "",
          groq: apiKeys.groq ? "********" : ""
        }
      },
      userProfile: {
        name: userName,
        email: userEmail,
        avatar: userAvatar
      }
    }));
    
    // Save API keys separately in localStorage (in a real app, this should be more secure)
    localStorage.setItem("aiApiKeys", JSON.stringify(apiKeys));
    
    // Notify AI assistant about settings change
    eventManager.notifySettingsChange({ selectedModel });
    
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
    
    // Reset test status after saving
    if (testStatus === "success" || testStatus === "error") {
      setTestStatus("idle");
      setTestMessage("");
    }
    
    // Automatically close the settings modal
    setIsSettingsModalOpen(false);
  };
  
  const handleResetSettings = () => {
    setNotifications(true);
    setDarkMode(false);
    setLanguage("en");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setSelectedModel("gemini-2.5-pro");
    setApiKeys({
      google: "",
      openai: "",
      groq: ""
    });
    
    // Reset user information to default
    setUserName(user.name);
    setUserEmail(user.email);
    setUserAvatar(user.avatar);
    
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values.",
    });
  };

  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  // Load other settings from localStorage on component mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.ai) {
          setSelectedModel(settings.ai.selectedModel || "gemini-2.5-pro");
        }
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
  }, []);

  // Reset test status when API keys change
  React.useEffect(() => {
    if (testStatus !== "idle") {
      setTestStatus("idle");
      setTestMessage("");
    }
  }, [apiKeys]);

  return (
    <div className="flex min-h-screen bg-background p-4">
      <Sidebar 
        isCollapsed={isCollapsed} 
        className="hidden md:flex"
        onSettingsClick={() => setIsSettingsModalOpen(true)}
      />
      <div
        className={`relative flex flex-1 flex-col rounded-2xl bg-card shadow-lg transition-all duration-300 ${
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
        
        {/* Top Right Icons - Notifications and Account */}
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
          {/* Notification Icon */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={() => {
                setIsNotificationMenuOpen(!isNotificationMenuOpen);
                setIsAccountMenuOpen(false); // Close account menu if open
                // Mark notifications as read when opening the menu
                if (isNotificationMenuOpen === false && hasUnreadNotifications) {
                  setHasUnreadNotifications(false);
                }
              }}
            >
              <Bell className="h-5 w-5" />
              {/* Notification Badge */}
              {hasUnreadNotifications && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Button>
            
            {/* Notification Dropdown Menu */}
            {isNotificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg py-2">
                <div className="px-4 py-2 border-b border-border/50">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-accent/50 cursor-pointer">
                    <p className="text-sm font-medium">New task added</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-accent/50 cursor-pointer">
                    <p className="text-sm font-medium">Upcoming exam reminder</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-accent/50 cursor-pointer">
                    <p className="text-sm font-medium">Class schedule updated</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-border/50 text-center">
                  <Button variant="ghost" className="w-full rounded-2xl">
                    View All Notifications
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Account Icon */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {
                setIsAccountMenuOpen(!isAccountMenuOpen);
                setIsNotificationMenuOpen(false); // Close notification menu if open
              }}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={userAvatar || ""} alt={userName} />
                <AvatarFallback className="text-xs">
                  {userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
            
            {/* Account Dropdown Menu */}
            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg py-2">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-border/50 flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback>
                      {userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                
                {/* Menu Items */}
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-2xl h-10 px-4"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    // Navigate to account page if you have one
                  }}
                >
                  <User className="h-5 w-5 mr-3" />
                  Account
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-2xl h-10 px-4"
                  onClick={openSettings}
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
        
        {/* Add padding to avoid overlap with top right icons */}
        <div className="p-6 pt-16">
          <Outlet />
        </div>
      </div>
      
      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] relative flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 flex-shrink-0">
              <h2 className="text-2xl font-bold">Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 pt-0 scrollbar-modern">
              <div className="py-6">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl p-1 shadow-lg">
                    <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">General</TabsTrigger>
                    <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Profile</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Notifications</TabsTrigger>
                    <TabsTrigger value="ai" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AI Integration</TabsTrigger>
                    <TabsTrigger value="account" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Account</TabsTrigger>
                  </TabsList>
                
                <TabsContent value="general" className="mt-6">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>Configure your general app preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Dark Mode</Label>
                          <p className="text-sm text-muted-foreground">Enable dark theme for the app</p>
                        </div>
                        <Switch
                          checked={darkMode}
                          onCheckedChange={setDarkMode}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <div className="relative" ref={languageDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                            className="w-full rounded-2xl border border-gray-300 bg-white focus:ring-2 focus:ring-black focus:border-transparent py-2 px-3 text-sm text-left flex items-center justify-between"
                          >
                            <span>
                              {languageOptions.find(option => option.value === language)?.label || "Select language"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          </button>
                          
                          {isLanguageDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full rounded-2xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto z-[200]">
                              {languageOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setLanguage(option.value);
                                    setIsLanguageDropdownOpen(false);
                                  }}
                                  className={`w-full py-2 px-3 text-sm text-left hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between ${
                                    language === option.value ? "bg-gray-100" : ""
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {language === option.value && (
                                    <Check className="h-4 w-4 text-gray-500" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Change the app language</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Popover open={isTimezoneDropdownOpen} onOpenChange={setIsTimezoneDropdownOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-12 justify-between text-left font-normal rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-white/90 focus:ring-2 focus:ring-black focus:border-transparent"
                            >
                              <div className="flex items-center">
                                <span>
                                  {timezoneOptions.find(option => option.value === timezone)?.label || "Select timezone"}
                                  {timezone && ` (${getTimezoneOffset(timezone)})`}
                                </span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-h-48 overflow-y-auto z-[200]" align="start">
                            <div className="p-2">
                              {timezoneOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    setTimezone(option.value);
                                    setIsTimezoneDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center px-3 py-2 rounded-2xl text-left hover:bg-gray-100 transition-colors",
                                    timezone === option.value && "bg-black text-white hover:bg-gray-800"
                                  )}
                                >
                                  <span>{option.label} ({getTimezoneOffset(option.value)})</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <p className="text-sm text-muted-foreground">Set your local timezone for accurate scheduling</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="profile" className="mt-6">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle>Profile</CardTitle>
                      <CardDescription>Update your profile information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Avatar Section */}
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={userAvatar} alt={userName} />
                          <AvatarFallback className="text-lg">
                            {userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button 
                            variant="ghost" 
                            className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-accent"
                            onClick={() => {
                              // Create a hidden file input element
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.accept = 'image/*';
                              fileInput.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  // In a real app, you would upload the file to a server
                                  // For now, we'll just create a local preview
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setUserAvatar(e.target?.result as string);
                                    toast({
                                      title: "Avatar Updated",
                                      description: "Your profile picture has been updated.",
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              fileInput.click();
                            }}
                          >
                            Change Avatar
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or GIF (Max 5MB)</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Your name" 
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your.email@example.com" 
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        className="w-full mt-4 bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-accent"
                        onClick={() => {
                          // In a real app, you would save the profile information
                          toast({
                            title: "Profile Updated",
                            description: "Your profile information has been updated successfully.",
                          });
                        }}
                      >
                        Update Profile
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications" className="mt-6">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Manage your notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive push notifications</p>
                        </div>
                        <Switch
                          checked={notifications}
                          onCheckedChange={setNotifications}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="ai" className="mt-6">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle>AI Integration</CardTitle>
                      <CardDescription>Configure AI services and API keys</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Two-column layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Left Column - Model Providers */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-base font-semibold">Model Providers</Label>
                            <p className="text-sm text-muted-foreground">Choose your preferred AI model</p>
                          </div>
                        <div className="space-y-3">
                          {/* Google Gemini Provider */}
                          <div className="border rounded-2xl p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                               onClick={() => setSelectedModel('gemini-1.5-pro')}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Google size={24} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">Google Gemini</h4>
                                <p className="text-sm text-gray-500">Google's advanced AI models</p>
                              </div>
                              {selectedModel.includes('gemini') && (
                                <Check className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>

                          {/* OpenAI Provider */}
                          <div className="border rounded-2xl p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                               onClick={() => setSelectedModel('gpt-4o')}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                                <OpenAI size={24} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">OpenAI</h4>
                                <p className="text-sm text-gray-500">ChatGPT and GPT models</p>
                              </div>
                              {selectedModel.includes('gpt') && (
                                <Check className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {/* Groq Provider */}
                          <div className="border rounded-2xl p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                               onClick={() => setSelectedModel('llama-3.1-70b-versatile')}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                <Groq size={24} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">Groq</h4>
                                <p className="text-sm text-gray-500">Fast inference AI models</p>
                              </div>
                              {selectedModel.includes('llama') && (
                                <Check className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                          </div>
                        </div>
                        </div>

                        {/* Right Column - API Configuration */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-base font-semibold">API Configuration</Label>
                            <p className="text-sm text-muted-foreground">Configure your API key and test connection</p>
                          </div>

                          <div className="border rounded-2xl p-6 bg-gray-50/30">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="api-key" className="font-medium">API Key</Label>
                                <Input 
                                  id="api-key" 
                                  type="password" 
                                  placeholder="Enter your API key" 
                                  value={getCurrentApiKey()}
                                  onChange={(e) => updateCurrentApiKey(e.target.value)}
                                  className="rounded-xl border-gray-300"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Your API key for {(() => {
                                    if (selectedModel.includes('gemini')) return 'Google Gemini';
                                    if (selectedModel.includes('gpt')) return 'OpenAI';
                                    if (selectedModel.includes('llama')) return 'Groq';
                                    return 'the selected AI service';
                                  })()}
                                </p>
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                <Button 
                                  onClick={handleTestConnection}
                                  disabled={testStatus === "testing"}
                                  className={cn(
                                    "w-full rounded-xl font-medium transition-all",
                                    testStatus === "success" && "bg-green-500 hover:bg-green-600 text-white",
                                    testStatus === "error" && "bg-red-500 hover:bg-red-600 text-white",
                                    testStatus === "idle" && "bg-black hover:bg-gray-800 text-white"
                                  )}
                                >
                                  {testStatus === "testing" ? (
                                    <>
                                      <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                                      Testing Connection...
                                    </>
                                  ) : testStatus === "success" ? (
                                    <>
                                      <Check className="mr-2 h-4 w-4" />
                                      Connection Successful
                                    </>
                                  ) : testStatus === "error" ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                      </svg>
                                      Test Failed
                                    </>
                                  ) : (
                                    <>
                                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 12l2 2 4-4"/>
                                        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                        <path d="M3 12c1 0 3-1-3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                        <path d="M3 12h6m6 0h6"/>
                                      </svg>
                                      Test Connection
                                    </>
                                  )}
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    updateCurrentApiKey("");
                                    setTestStatus("idle");
                                    setTestMessage("");
                                  }}
                                  className="w-full rounded-xl border-gray-300 hover:bg-gray-100"
                                >
                                  Clear API Key
                                </Button>
                              </div>

                              {testMessage && (
                                <div className={cn(
                                  "text-sm p-3 rounded-xl font-medium",
                                  testStatus === "success" ? "bg-green-100 text-green-800 border border-green-200" : 
                                  testStatus === "error" ? "bg-red-100 text-red-800 border border-red-200" : 
                                  "bg-blue-100 text-blue-800 border border-blue-200"
                                )}>
                                  {testMessage}
                                </div>
                              )}


                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="account" className="mt-6">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle>Account</CardTitle>
                      <CardDescription>Manage your account settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        variant="ghost" 
                        className="w-full bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-accent"
                      >
                        Change Password
                      </Button>
                      <Separator />
                      <Button 
                        variant="destructive"
                        className="w-full rounded-2xl"
                      >
                        Delete Account
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              </div>
            </div>
            
            {/* Modal Footer - Sticky */}
            <div className="flex-shrink-0 border-t border-border/50 p-6 bg-background/95 backdrop-blur-sm rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={handleResetSettings}
                  className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-accent"
                >
                  Reset to Defaults
                </Button>
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;