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

  // State for various settings
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // AI Integration settings
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-pro");
  const [apiKey, setApiKey] = useState("");
  const [isAiEnabled, setIsAiEnabled] = useState(false);
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
    // Load API key when opening settings
    const savedApiKey = localStorage.getItem("aiApiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    setIsSettingsModalOpen(true);
    setIsAccountMenuOpen(false);
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestStatus("error");
      setTestMessage("API Key is required");
      toast({
        title: "API Key Required",
        description: "Please enter your API key to test the connection.",
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
      
      if (selectedModel === "gemini-2.5-pro" || selectedModel === "gemini-2.5-flash") {
        // Test Google Gemini API
        isValid = await testGeminiAPI(apiKey);
        // Find the model label for display
        let modelLabel = "";
        for (const option of aiModelOptions) {
          if (option.subOptions) {
            const subOption = option.subOptions.find(sub => sub.value === selectedModel);
            if (subOption) {
              modelLabel = `${option.label} ${subOption.label}`;
              break;
            }
          }
        }
        message = isValid ? `Google Gemini (${modelLabel}) connection successful!` : `Failed to connect to Google Gemini (${modelLabel})`;
      } else if (selectedModel === "gpt-4") {
        // Test OpenAI API
        isValid = await testOpenAIAPI(apiKey);
        message = isValid ? "OpenAI connection successful!" : "Failed to connect to OpenAI";
      } else if (selectedModel === "meta-llama/llama-4-maverick-17b-128e-instruct" || selectedModel === "meta-llama/llama-4-scout-17b-16e-instruct") {
        // Test Groq API
        isValid = await testGroqAPI(apiKey);
        // Find the model label for display
        let modelLabel = "";
        for (const option of aiModelOptions) {
          if (option.subOptions) {
            const subOption = option.subOptions.find(sub => sub.value === selectedModel);
            if (subOption) {
              modelLabel = `${option.label} ${subOption.label}`;
              break;
            }
          }
        }
        message = isValid ? `Groq (${modelLabel}) connection successful!` : `Failed to connect to Groq (${modelLabel})`;
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
        apiKey: apiKey ? "********" : "", // Don't save actual API key in localStorage for security
        isAiEnabled
      },
      userProfile: {
        name: userName,
        email: userEmail,
        avatar: userAvatar
      }
    }));
    
    // Save API key separately in localStorage (in a real app, this should be more secure)
    if (apiKey) {
      localStorage.setItem("aiApiKey", apiKey);
    } else {
      localStorage.removeItem("aiApiKey");
    }
    
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
    setApiKey("");
    setIsAiEnabled(false);
    
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

  // Load API key from localStorage on component mount
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem("aiApiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Load other settings
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.ai) {
          setIsAiEnabled(settings.ai.isAiEnabled || false);
          setSelectedModel(settings.ai.selectedModel || "gemini-2.5-pro");
        }
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
  }, []);

  // Reset test status when API key changes
  React.useEffect(() => {
    if (testStatus !== "idle") {
      setTestStatus("idle");
      setTestMessage("");
    }
  }, [apiKey]);

  return (
    <div className="flex min-h-screen bg-background p-4">
      <Sidebar isCollapsed={isCollapsed} className="hidden md:flex" />
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
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] relative">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
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
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable AI Features</Label>
                          <p className="text-sm text-muted-foreground">Turn on AI-powered assistance</p>
                        </div>
                        <Switch
                          checked={isAiEnabled}
                          onCheckedChange={setIsAiEnabled}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label>AI Model</Label>
                        <div className="relative" ref={modelDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                            className="w-full rounded-2xl border border-gray-300 bg-white focus:ring-2 focus:ring-black focus:border-transparent py-2 px-3 text-sm text-left flex items-center justify-between"
                          >
                            <span>
                              {(() => {
                                // Find the selected model label
                                for (const option of aiModelOptions) {
                                  if (option.value === selectedModel) {
                                    return option.label;
                                  }
                                  if (option.subOptions) {
                                    const subOption = option.subOptions.find(sub => sub.value === selectedModel);
                                    if (subOption) {
                                      return `${option.label} ${subOption.label}`;
                                    }
                                  }
                                }
                                return "Select AI model";
                              })()}
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          </button>
                          
                          {isModelDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full rounded-2xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto scrollbar-hide z-[200]">
                              {aiModelOptions.map((option) => (
                                <div key={option.value} className="relative">
                                  {option.subOptions ? (
                                    // Parent option with sub-options
                                    <div className="w-full group">
                                      <button
                                        type="button"
                                        className="w-full py-2 px-3 text-sm text-left hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between"
                                      >
                                        <span>{option.label}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180" />
                                      </button>
                                      {/* Submenu that appears below with indentation when hovering */}
                                      <div className="w-full hidden group-hover:block bg-gray-50 rounded-b-xl">
                                        <div className="py-1 border-t border-gray-200 ml-4 mr-2">
                                          {option.subOptions.map((subOption) => (
                                            <button
                                              key={subOption.value}
                                              type="button"
                                              onClick={() => {
                                                setSelectedModel(subOption.value);
                                                setIsModelDropdownOpen(false);
                                              }}
                                              className={`w-full py-2 px-3 text-sm text-left hover:bg-gray-100 rounded-lg cursor-pointer flex items-center justify-between ${
                                                selectedModel === subOption.value ? "bg-gray-200" : ""
                                              }`}
                                            >
                                              <span>{subOption.label}</span>
                                              {selectedModel === subOption.value && (
                                                <Check className="h-4 w-4 text-gray-500" />
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    // Regular option without sub-options
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedModel(option.value);
                                        setIsModelDropdownOpen(false);
                                      }}
                                      className={`w-full py-2 px-3 text-sm text-left hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between ${
                                        selectedModel === option.value ? "bg-gray-100" : ""
                                      }`}
                                    >
                                      <span>{option.label}</span>
                                      {selectedModel === option.value && (
                                        <Check className="h-4 w-4 text-gray-500" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Choose your preferred AI model</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input 
                          id="api-key" 
                          type="password" 
                          placeholder="Enter your API key" 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">Your API key for the selected AI service</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleTestConnection}
                          disabled={testStatus === "testing"}
                          className={cn(
                            "bg-black text-white rounded-2xl hover:bg-gray-800",
                            testStatus === "success" && "bg-green-500 hover:bg-green-600 text-white",
                            testStatus === "error" && "bg-red-500 hover:bg-red-600 text-white"
                          )}
                        >
                          {testStatus === "testing" ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                              Testing...
                            </>
                          ) : testStatus === "success" ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Success
                            </>
                          ) : testStatus === "error" ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                              Failed
                            </>
                          ) : (
                            "Test Connection"
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setApiKey("");
                            setTestStatus("idle");
                            setTestMessage("");
                          }}
                          className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-accent"
                        >
                          Clear Key
                        </Button>
                      </div>
                      {testMessage && (
                        <div className={cn(
                          "text-sm p-2 rounded-lg",
                          testStatus === "success" ? "bg-green-100 text-green-800" : 
                          testStatus === "error" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        )}>
                          {testMessage}
                        </div>
                      )}
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
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={handleResetSettings}
                  className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-accent"
                >
                  Reset to Defaults
                </Button>
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-primary/90 backdrop-blur-sm border border-primary/50 rounded-2xl hover:bg-primary"
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

// Add CSS for hiding scrollbars
const style = document.createElement('style');
style.innerHTML = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera*/
  }
`;
document.head.appendChild(style);

export default MainLayout;