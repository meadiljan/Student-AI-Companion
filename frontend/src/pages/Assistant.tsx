import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Zap, 
  Search, 
  Globe, 
  X,
  Calendar,
  BookOpen,
  Clock,
  Flag,
  Github,
  Chrome,
  FileText,
  Calculator,
  Map,
  Mail,
  Settings,
  MessageCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Mic,
  Loader2,
  ChevronDown,
  Bot,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { callAIService, formatAIResponse, AI_PROVIDERS } from '@/services/aiService';
import { eventManager } from '@/utils/eventManager';
import { Gemini, OpenAI, Groq, Google, Meta } from '@lobehub/icons';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  modelUsed?: string; // Store which model was used for this response
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: Date;
  category?: string;
}

// Function to generate dynamic conversation title based on context
const generateConversationTitle = (userQuery: string, aiResponse: string): string => {
  // Remove HTML tags from AI response for analysis
  const cleanResponse = aiResponse.replace(/<[^>]*>/g, '').trim();
  
  // Extract key topics and concepts
  const query = userQuery.toLowerCase();
  const response = cleanResponse.toLowerCase();
  
  // Common academic/educational keywords and their context
  const topicKeywords = {
    mathematics: ['math', 'calculus', 'algebra', 'geometry', 'equation', 'formula', 'solve', 'calculate'],
    physics: ['physics', 'quantum', 'mechanics', 'energy', 'force', 'velocity', 'wave', 'particle'],
    chemistry: ['chemistry', 'molecule', 'atom', 'reaction', 'element', 'compound', 'bond'],
    programming: ['code', 'program', 'javascript', 'python', 'react', 'function', 'algorithm', 'debug'],
    writing: ['essay', 'write', 'writing', 'paper', 'thesis', 'argument', 'paragraph', 'grammar'],
    research: ['research', 'study', 'analysis', 'data', 'source', 'citation', 'methodology'],
    history: ['history', 'historical', 'war', 'empire', 'revolution', 'ancient', 'medieval'],
    biology: ['biology', 'cell', 'dna', 'gene', 'organism', 'evolution', 'protein', 'ecosystem'],
    literature: ['literature', 'novel', 'poem', 'author', 'theme', 'character', 'symbolism'],
    psychology: ['psychology', 'behavior', 'cognitive', 'mind', 'emotion', 'therapy', 'brain'],
    economics: ['economics', 'market', 'supply', 'demand', 'inflation', 'gdp', 'trade'],
    philosophy: ['philosophy', 'ethics', 'moral', 'existence', 'consciousness', 'logic', 'metaphysics']
  };

  // Detect the main topic
  let detectedTopic = '';
  let maxMatches = 0;
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matches = keywords.filter(keyword => 
      query.includes(keyword) || response.includes(keyword)
    ).length;
    
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedTopic = topic;
    }
  }

  // Generate title based on query patterns and detected topic
  const queryWords = userQuery.split(' ');
  
  // If query is a question
  if (query.includes('how to') || query.includes('how do')) {
    const action = queryWords.slice(queryWords.findIndex(w => w.toLowerCase() === 'to') + 1, queryWords.findIndex(w => w.toLowerCase() === 'to') + 4).join(' ');
    return `How to ${action}${detectedTopic ? ` (${detectedTopic.charAt(0).toUpperCase() + detectedTopic.slice(1)})` : ''}`;
  }
  
  if (query.includes('what is') || query.includes('what are')) {
    const concept = queryWords.slice(queryWords.findIndex(w => w.toLowerCase() === 'is' || w.toLowerCase() === 'are') + 1, queryWords.findIndex(w => w.toLowerCase() === 'is' || w.toLowerCase() === 'are') + 4).join(' ');
    return `Understanding ${concept}${detectedTopic ? ` in ${detectedTopic.charAt(0).toUpperCase() + detectedTopic.slice(1)}` : ''}`;
  }
  
  if (query.includes('explain') || query.includes('describe')) {
    const concept = queryWords.slice(1, 4).join(' ');
    return `${detectedTopic ? detectedTopic.charAt(0).toUpperCase() + detectedTopic.slice(1) + ': ' : ''}${concept}`;
  }
  
  if (query.includes('help') && query.includes('with')) {
    const withIndex = queryWords.findIndex(w => w.toLowerCase() === 'with');
    const task = queryWords.slice(withIndex + 1, withIndex + 4).join(' ');
    return `Help with ${task}${detectedTopic ? ` (${detectedTopic.charAt(0).toUpperCase() + detectedTopic.slice(1)})` : ''}`;
  }

  if (query.includes('solve') || query.includes('calculate')) {
    return `${detectedTopic ? detectedTopic.charAt(0).toUpperCase() + detectedTopic.slice(1) + ' ' : ''}Problem Solving`;
  }

  if (query.includes('write') || query.includes('essay')) {
    const topic = queryWords.slice(queryWords.findIndex(w => w.toLowerCase().includes('write')) + 1, queryWords.findIndex(w => w.toLowerCase().includes('write')) + 4).join(' ');
    return `Writing: ${topic || 'Essay Help'}`;
  }

  // Default: Extract key nouns from the query
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'can', 'you', 'help', 'me', 'i', 'need', 'want'];
  const keyWords = queryWords
    .filter(word => word.length > 2 && !stopWords.includes(word.toLowerCase()))
    .slice(0, 3)
    .join(' ');

  if (keyWords) {
    return `${detectedTopic ? detectedTopic.charAt(0).toUpperCase() + detectedTopic.slice(1) + ': ' : ''}${keyWords.charAt(0).toUpperCase() + keyWords.slice(1)}`;
  }

  // Fallback
  return detectedTopic 
    ? `${detectedTopic.charAt(0).toUpperCase() + detectedTopic.slice(1)} Discussion`
    : 'AI Conversation';
};

const Assistant: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'auto' | 'research' | 'all'>('auto');
  const [isChatMode, setIsChatMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isWelcomeScrollable, setIsWelcomeScrollable] = useState(false);
  const [isChatScrollable, setIsChatScrollable] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [expandedProviders, setExpandedProviders] = useState<string[]>(['gemini']); // Default expand Gemini
  const [activeProvider, setActiveProvider] = useState<string>('google');
  const [showConversationList, setShowConversationList] = useState(false);
  const welcomeTextareaRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('aiConversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(conversationsWithDates);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  }, []);

  // Save conversations to localStorage whenever conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('aiConversations', JSON.stringify(conversations));
    }
  }, [conversations]);
  const chatTextareaRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Function to start a new conversation
  const startNewConversation = () => {
    setMessages([]);
    setIsChatMode(false);
    setCurrentConversationId(null);
    setInputValue('');
    
    // Clear contentEditable divs
    if (welcomeTextareaRef.current) welcomeTextareaRef.current.innerHTML = '';
    if (chatTextareaRef.current) chatTextareaRef.current.innerHTML = '';
  };

  // Function to load an existing conversation
  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversationId);
      setIsChatMode(true);
    }
  };

  // Auto-resize function for contentEditable divs
  const adjustContentEditableHeight = (element: HTMLDivElement, maxHeight: number) => {
    element.style.height = 'auto';
    const newHeight = Math.min(element.scrollHeight, maxHeight);
    element.style.height = newHeight + 'px';
    
    // Check if scrolling is needed and update state
    const needsScrolling = element.scrollHeight > maxHeight;
    
    if (element === welcomeTextareaRef.current) {
      setIsWelcomeScrollable(needsScrolling);
    } else if (element === chatTextareaRef.current) {
      setIsChatScrollable(needsScrolling);
    }
  };

  // Effect to adjust height and sync content when input value changes
  useEffect(() => {
    const currentRef = isChatMode ? chatTextareaRef.current : welcomeTextareaRef.current;
    if (currentRef) {
      // Sync content if it differs (avoiding cursor reset)
      if (currentRef.innerHTML !== inputValue) {
        currentRef.innerHTML = inputValue;
      }
      const maxHeight = 160; // Same max height for both welcome and chat
      adjustContentEditableHeight(currentRef, maxHeight);
    }
  }, [inputValue, isChatMode]);

  // Reset scrollbar states when switching modes
  useEffect(() => {
    if (isChatMode) {
      setIsWelcomeScrollable(false);
    } else {
      setIsChatScrollable(false);
    }
  }, [isChatMode]);

  const handleInputChange = (element: HTMLDivElement) => {
    const content = element.innerHTML || '';
    setInputValue(content);
    
    // Auto-adjust height (same for both welcome and chat)
    const maxHeight = 160;
    adjustContentEditableHeight(element, maxHeight);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync active provider when opening the dropdown
  useEffect(() => {
    if (isModelDropdownOpen) {
      try {
        const providerKey = getProviderForModel(selectedModel);
        setActiveProvider(providerKey || 'google');
      } catch (e) {
        setActiveProvider('google');
      }
    }
  }, [isModelDropdownOpen, selectedModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: inputValue.trim(),
        sender: 'user',
        timestamp: new Date()
      };

      // If it's the first message, initialize chat mode
      if (!isChatMode) {
        setMessages([userMessage]);
        setIsChatMode(true);
      } else {
        // Add to existing conversation
        setMessages(prev => [...prev, userMessage]);
      }
      
      const currentInput = inputValue.trim();
      setInputValue('');
      
      // Clear the contentEditable div
      const currentRef = isChatMode ? chatTextareaRef.current : welcomeTextareaRef.current;
      if (currentRef) {
        currentRef.innerHTML = '';
      }
      
      // Get real AI response
      setIsLoadingResponse(true);
      
      try {
        // Pass the currently selected model to the AI service
        const rawResponse = await callAIService(currentInput, selectedModel);
        const formattedResponse = formatAIResponse(rawResponse);
        
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: formattedResponse,
          sender: 'assistant',
          timestamp: new Date(),
          modelUsed: selectedModel // Store the model that was used for this response
        };

        console.log(`💬 Response generated with model: ${selectedModel}`);
        
        // Update messages
        const newMessages = isChatMode ? [...messages, userMessage, aiResponse] : [userMessage, aiResponse];
        setMessages(prev => [...prev, aiResponse]);

        // Generate dynamic title and create/update conversation
        if (!isChatMode) {
          // This is a new conversation
          const conversationTitle = generateConversationTitle(currentInput, formattedResponse);
          const newConversation: Conversation = {
            id: Date.now().toString(),
            title: conversationTitle,
            messages: [userMessage, aiResponse],
            timestamp: new Date()
          };
          
          setCurrentConversationId(newConversation.id);
          setConversations(prev => [newConversation, ...prev]);
          
          console.log(`📝 New conversation created: "${conversationTitle}"`);
        } else {
          // Update existing conversation
          if (currentConversationId) {
            setConversations(prev => prev.map(conv => 
              conv.id === currentConversationId 
                ? { ...conv, messages: [...conv.messages, userMessage, aiResponse], timestamp: new Date() }
                : conv
            ));
          }
        }
        
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: '<p><strong>Error:</strong> Failed to get AI response. Please check your API key configuration and try again.</p>',
          sender: 'assistant',
          timestamp: new Date(),
          modelUsed: selectedModel // Store the model that was attempted for this error
        };
        setMessages(prev => [...prev, errorResponse]);
        
        // Also update conversation with error message
        if (!isChatMode) {
          const conversationTitle = generateConversationTitle(currentInput, 'Error getting AI response');
          const newConversation: Conversation = {
            id: Date.now().toString(),
            title: conversationTitle,
            messages: [userMessage, errorResponse],
            timestamp: new Date()
          };
          
          setCurrentConversationId(newConversation.id);
          setConversations(prev => [newConversation, ...prev]);
        } else if (currentConversationId) {
          setConversations(prev => prev.map(conv => 
            conv.id === currentConversationId 
              ? { ...conv, messages: [...conv.messages, userMessage, errorResponse], timestamp: new Date() }
              : conv
          ));
        }
      } finally {
        setIsLoadingResponse(false);
      }
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim()) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  // Toggle provider expansion
  const toggleProvider = (providerValue: string) => {
    setExpandedProviders(prev => 
      prev.includes(providerValue) 
        ? prev.filter(p => p !== providerValue)
        : [...prev, providerValue]
    );
  };

  // Get organized models by provider with Auto option
  const getOrganizedModels = () => {
    const autoOption = {
      value: 'auto',
      label: 'Auto',
      provider: 'Intelligent Selection',
      isAuto: true
    };

    const providerGroups = AI_PROVIDERS.map(provider => ({
      ...provider,
      displayName: provider.name === 'Gemini' ? 'Google Gemini' : provider.name,
      models: provider.models.map(model => {
        let displayName = model;
        
        // Clean up model names for better display
        if (model.includes('gemini')) {
          displayName = model.replace('gemini-', '').replace('-', ' ').toUpperCase();
        } else if (model.includes('gpt')) {
          displayName = model.toUpperCase().replace('-', ' ');
        } else if (model.includes('llama')) {
          const parts = model.split('/');
          displayName = parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        return {
          value: model,
          label: displayName,
          provider: provider.name
        };
      })
    }));

    return { autoOption, providerGroups };
  };

  // Get all models flat (for backward compatibility)
  const getAllModels = () => {
    const { autoOption, providerGroups } = getOrganizedModels();
    const modelOptions = providerGroups.flatMap(provider => provider.models);
    return [autoOption, ...modelOptions];
  };

  // Get current model display name
  const getCurrentModelName = () => {
    if (selectedModel === 'auto') {
      return 'Auto';
    }
    const allModels = getAllModels();
    const currentModel = allModels.find(model => model.value === selectedModel);
    return currentModel ? currentModel.label : 'Auto';
  };

  // Helper function to get model name for a specific model (for message headers)
  const getModelNameForMessage = (modelId?: string) => {
    if (!modelId || modelId === 'auto') {
      return 'Auto';
    }
    
    // Find the model in our allModels array
    const allModels = getAllModels();
    const modelData = allModels.find(m => m.value === modelId);
    return modelData ? modelData.label : 'AI Assistant';
  };

  // Helper function to get provider icon for a specific model (for message headers)
  const getProviderIconForMessage = (modelId?: string, size: number = 12) => {
    if (!modelId || modelId === 'auto') {
      return <Sparkles className={`w-3 h-3 text-purple-600`} />;
    }
    
    // Check if it's a Llama model (Meta models)
    if (modelId.includes('llama')) {
      return <Meta size={size} />;
    }
    
    const provider = AI_PROVIDERS.find(p => p.models.includes(modelId));
    if (!provider) {
      return <Sparkles className={`w-3 h-3 text-purple-600`} />;
    }
    
    switch (provider.value) {
      case 'gemini':
        return <Gemini size={size} />;
      case 'openai':
        return <OpenAI size={size} />;
      case 'groq':
        // Check if it's a Llama model specifically
        if (modelId.includes('llama')) {
          return <Meta size={size} />;
        }
        return <Groq size={size} />;
      default:
        return <Sparkles className={`w-3 h-3 text-purple-600`} />;
    }
  };

  // Get provider icon based on selected model
  const getProviderIcon = (size: number = 16) => {
    if (selectedModel === 'auto') {
      return <Sparkles className={`w-${size/4} h-${size/4}`} />;
    }
    
    // Check if it's a Llama model (Meta models)
    if (selectedModel.includes('llama')) {
      return <Meta size={size} />;
    }
    
    const provider = AI_PROVIDERS.find(p => p.models.includes(selectedModel));
    if (!provider) {
      return <Sparkles className={`w-${size/4} h-${size/4}`} />;
    }
    
    switch (provider.value) {
      case 'gemini':
        return <Gemini size={size} />;
      case 'openai':
        return <OpenAI size={size} />;
      case 'groq':
        // Check if it's a Llama model specifically
        if (selectedModel.includes('llama')) {
          return <Meta size={size} />;
        }
        return <Groq size={size} />;
      default:
        return <Sparkles className={`w-${size/4} h-${size/4}`} />;
    }
  };

  // Get provider header icon for the left sidebar
  const getProviderHeaderIcon = (providerValue: string, size: number = 16) => {
    switch (providerValue) {
      case 'gemini':
        return <Google size={size} />;
      case 'openai':
        return <OpenAI size={size} />;
      case 'groq':
        return <Groq size={size} />;
      default:
        return <Bot className={`w-${size/4} h-${size/4}`} />;
    }
  };

  // Get provider icon for any model (for dropdown items)
  const getModelProviderIcon = (modelValue: string, size: number = 12) => {
    if (modelValue === 'auto') {
      return <Sparkles className={`w-${size/4} h-${size/4}`} />;
    }
    
    // Check if it's a Llama model (Meta models)
    if (modelValue.includes('llama')) {
      return <Meta size={size} />;
    }
    
    const provider = AI_PROVIDERS.find(p => p.models.includes(modelValue));
    if (!provider) {
      return <Sparkles className={`w-${size/4} h-${size/4}`} />;
    }
    
    switch (provider.value) {
      case 'gemini':
        return <Gemini size={size} />;
      case 'openai':
        return <OpenAI size={size} />;
      case 'groq':
        // Check if it's a Llama model specifically
        if (modelValue.includes('llama')) {
          return <Meta size={size} />;
        }
        return <Groq size={size} />;
      default:
        return <Sparkles className={`w-${size/4} h-${size/4}`} />;
    }
  };

  // Get provider key (mapped to logo file name) for a model
  const getProviderForModel = (modelValue: string) => {
    if (modelValue === 'auto') return 'auto';
    // try to find provider by model listing
    const provider = AI_PROVIDERS.find(p => p.models.includes(modelValue));
    if (provider) {
      // map Gemini provider to google logo
      if (provider.value === 'gemini') return 'google';
      return provider.value; // 'openai' or 'groq'
    }
    // fallback: check localStorage provider
    const savedProvider = localStorage.getItem('selectedAiProvider');
    if (savedProvider) {
      if (savedProvider === 'gemini') return 'google';
      return savedProvider;
    }
    return 'google';
  };

  const getProviderLogoSrc = (modelValue: string) => {
    const key = getProviderForModel(modelValue);
    if (key === 'auto') return '/logos/google.svg'; // show google-like spark by default
    return `/logos/${key}.svg`;
  };

  // Update model selection and save to localStorage
  const handleModelSelect = (modelValue: string) => {
    setSelectedModel(modelValue);
    setSelectedMode('auto');
    setIsModelDropdownOpen(false);
    
    // Handle auto selection
    if (modelValue === 'auto') {
      // For auto mode, set default provider and model
      localStorage.setItem('selectedAiModel', 'gemini-2.5-pro');
      localStorage.setItem('selectedAiProvider', 'gemini');
    } else {
      // Save specific model to localStorage for the AI service
      localStorage.setItem('selectedAiModel', modelValue);
      
      // Determine and save the provider
      const provider = AI_PROVIDERS.find(p => p.models.includes(modelValue));
      if (provider) {
        localStorage.setItem('selectedAiProvider', provider.value);
      }
    }

    // Update settings to sync with other components
    const savedSettings = localStorage.getItem("appSettings");
    let settings = {};
    
    try {
      if (savedSettings) {
        settings = JSON.parse(savedSettings);
      }
    } catch (e) {
      console.error("Failed to parse saved settings", e);
    }

    // Update the AI model in settings
    const updatedSettings = {
      ...settings,
      ai: {
        ...(settings as any).ai,
        selectedModel: modelValue === 'auto' ? 'gemini-2.5-pro' : modelValue
      }
    };

    localStorage.setItem("appSettings", JSON.stringify(updatedSettings));
    
    // Notify other components of the settings change via event manager
    eventManager.notifySettingsChange({ 
      selectedModel: modelValue === 'auto' ? 'gemini-2.5-pro' : modelValue 
    });
  };

  // Load saved model on component mount and listen for settings changes
  useEffect(() => {
    // Load initial model from localStorage
    const savedModel = localStorage.getItem('selectedAiModel');
    if (savedModel) {
      setSelectedModel(savedModel);
    }

    // Load from appSettings as fallback
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings && !savedModel) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.ai?.selectedModel) {
          setSelectedModel(settings.ai.selectedModel);
        }
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }

    // Listen for settings changes from other components
    const handleSettingsChange = (settings: { selectedModel: string }) => {
      setSelectedModel(settings.selectedModel);
    };

    eventManager.addSettingsChangeListener(handleSettingsChange);

    return () => {
      eventManager.removeSettingsChangeListener(handleSettingsChange);
    };
  }, []);

  const appIntegrations = [
    { icon: Calendar, name: 'Calendar' },
    { icon: BookOpen, name: 'Notes' },
    { icon: Clock, name: 'Tasks' },
    { icon: Flag, name: 'Goals' },
    { icon: Github, name: 'GitHub' },
    { icon: Chrome, name: 'Browser' },
    { icon: FileText, name: 'Documents' },
    { icon: Calculator, name: 'Calculator' },
    { icon: Map, name: 'Maps' },
    { icon: Mail, name: 'Email' },
    { icon: Settings, name: 'Settings' }
  ];

  // Function to format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get recent conversations with preview
  const getRecentChats = () => {
    return conversations.slice(0, 6).map(conv => ({
      id: conv.id,
      title: conv.title,
      preview: conv.messages.length > 0 
        ? conv.messages[0].content.length > 100 
          ? conv.messages[0].content.substring(0, 100) + '...'
          : conv.messages[0].content
        : 'No preview available',
      timestamp: formatRelativeTime(conv.timestamp),
      category: conv.category || 'General'
    }));
  };

  const recentChats = getRecentChats();

  const renderWelcomeScreen = () => (
    <motion.div 
      className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Container */}
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* AI Icon */}
        <div className="flex justify-center">
          <motion.div 
            className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 360] 
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight">
            How can I help you today?
          </h1>
        </div>

        {/* Main Search Container */}
        <motion.div 
          className="relative"
          layout
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div className={`
            relative rounded-2xl bg-white border-2 transition-all duration-300 shadow-sm
            ${isFocused ? 'border-gray-900 shadow-lg shadow-gray-900/10' : 'border-gray-200'}
            min-h-[100px] p-4
          `}>
            {/* Main Input Area */}
            <form onSubmit={handleSubmit} className="flex-1">
              <div
                ref={welcomeTextareaRef}
                contentEditable={!isLoadingResponse}
                onInput={(e) => handleInputChange(e.currentTarget)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                data-placeholder="Ask, search, or make anything... (Press Enter to send)"
                className={`
                  w-full bg-transparent text-gray-900 text-sm
                  outline-none border-none resize-none leading-relaxed min-h-[40px] max-h-40
                  ${isWelcomeScrollable ? 'overflow-y-auto scrollbar-modern pr-2' : 'overflow-hidden'}
                  ${isLoadingResponse ? 'opacity-50 cursor-not-allowed' : ''}
                  rich-text-editor
                `}
                style={{ 
                  height: 'auto',
                  minHeight: '40px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              />
            </form>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {/* Left Side - Mode Buttons */}
              <div className="flex items-center gap-2">
                {/* AI Model Dropdown */}
                <div className="relative" ref={modelDropdownRef}>
                  <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${selectedMode === 'auto' 
                        ? 'bg-gray-900 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }
                    `}
                  >
                    {getProviderIcon(16)}
                    <span className="max-w-[120px] truncate">{getCurrentModelName()}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-0' : 'rotate-180'}`} />
                  </button>

                  <AnimatePresence>
                    {isModelDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 w-[350px] bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                      >
                        {/* Two-column layout: left = providers, right = models */}
                        <div className="flex">
                          {/* Left: Providers */}
                          <div className="w-36 border-r border-gray-100">
                            <div className="py-2">
                              {/* Auto as first item */}
                              <button
                                onClick={() => handleModelSelect('auto')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${selectedModel === 'auto' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-medium">Auto</span>
                                {selectedModel === 'auto' && (
                                  <div className="w-2 h-2 bg-gray-900 rounded-full ml-auto" />
                                )}
                              </button>

                              {/* Providers list */}
                              {getOrganizedModels().providerGroups.map((provider) => (
                                <button
                                  key={provider.value}
                                  onClick={() => setActiveProvider(provider.value)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${activeProvider === provider.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                  {getProviderHeaderIcon(provider.value, 16)}
                                  <span className="text-xs font-medium flex-1">{provider.displayName}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Right: Models for active provider */}
                          <div className="flex-1 max-h-64 overflow-y-auto scrollbar-modern">
                            <div className="p-2">
                              {/* Show message when auto is selected */}
                              {activeProvider === 'auto' ? (
                                <div className="p-4 text-center text-gray-500">
                                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-sm">Intelligent model selection</p>
                                  <p className="text-xs mt-1">Let AI choose the best model for your query</p>
                                </div>
                              ) : (
                              // Models for specific provider
                              (() => {
                                const { providerGroups } = getOrganizedModels();
                                const provider = providerGroups.find(p => p.value === activeProvider);
                                if (!provider) return <div className="text-sm text-gray-500 px-3 py-2">No models found.</div>;

                                return provider.models.map((model) => (
                                  <button
                                    key={model.value}
                                    onClick={() => handleModelSelect(model.value)}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150 hover:bg-gray-50 flex items-center justify-between group ${selectedModel === model.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {getModelProviderIcon(model.value, 12)}
                                      <span className="font-medium">{model.label}</span>
                                    </div>
                                    {selectedModel === model.value && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                                  </button>
                                ));
                              })())}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => setSelectedMode('research')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${selectedMode === 'research' 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <Search className="w-4 h-4" />
                  Research
                </button>

                <button
                  onClick={() => setSelectedMode('all')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${selectedMode === 'all' 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">All sources</span>
                  <span className="sm:hidden">All</span>
                </button>
              </div>

              {/* Right Side - Microphone/Send Button */}
              <div className="flex items-center">
                <AnimatePresence mode="wait">
                  {!inputValue.trim() ? (
                    <motion.button
                      key="microphone"
                      type="button"
                      className="
                        flex items-center justify-center px-3 py-2 rounded-xl bg-gray-100 text-gray-600
                        hover:bg-gray-200 hover:text-gray-700 border border-gray-200
                        transition-all duration-200 shadow-sm
                      "
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="send-active"
                      onClick={handleSendClick}
                      disabled={isLoadingResponse}
                      className={`
                        flex items-center justify-center px-3 py-2 rounded-xl transition-all duration-200
                        shadow-sm hover:shadow-md
                        ${isLoadingResponse 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                        }
                      `}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={!isLoadingResponse ? { scale: 1.02 } : {}}
                      whileTap={!isLoadingResponse ? { scale: 0.98 } : {}}
                      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                      title={isLoadingResponse ? "Processing..." : "Send message"}
                    >
                      {isLoadingResponse ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Chats Section */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Recent Chats</h2>
              <p className="text-gray-500 text-sm">Continue where you left off</p>
            </div>
          </div>

          {/* Chat Cards Horizontal Scroll */}
          <div className="relative">
            {/* Left Arrow */}
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-gray-300 hover:shadow-md transition-all duration-200"
              onClick={() => {
                const container = document.getElementById('chats-container');
                if (container) {
                  container.scrollLeft -= 300;
                }
              }}
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            {/* Right Arrow */}
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-gray-300 hover:shadow-md transition-all duration-200"
              onClick={() => {
                const container = document.getElementById('chats-container');
                if (container) {
                  container.scrollLeft += 300;
                }
              }}
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>

            {/* Scrollable Container */}
            <div 
              id="chats-container"
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollBehavior: 'smooth' }}
            >
              {recentChats.length > 0 ? recentChats.slice(0, 5).map((chat, index) => (
                <div
                  key={chat.id}
                  onClick={() => loadConversation(chat.id)}
                  className="
                    bg-white border border-gray-200 rounded-lg p-3 
                    hover:border-gray-300 hover:shadow-md
                    transition-all duration-200 cursor-pointer
                    group flex-shrink-0 w-64 hover:-translate-y-0.5
                  "
                >
                {/* Chat Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                      <MessageCircle className="w-3 h-3 text-gray-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                      {chat.category}
                    </span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <MoreHorizontal className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                {/* Chat Content */}
                <div className="mb-2">
                  <h3 className="font-medium text-sm text-gray-900 mb-1 group-hover:text-gray-700 transition-colors truncate">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed overflow-hidden" style={{ 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical' as const 
                  }}>
                    {chat.preview}
                  </p>
                </div>

                {/* Chat Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{chat.timestamp}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-400">Saved</span>
                  </div>
                </div>
                </div>
              )) : (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs">Start chatting to see your conversation history</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* View All Button */}
          <div className="text-center mt-4">
            <button className="
              px-4 py-2 border border-gray-200 text-gray-600 rounded-lg
              hover:border-gray-300 hover:bg-gray-50 transition-all duration-200
              font-medium text-sm
            ">
              View All Chats
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderChatInterface = () => (
    <motion.div 
      className="min-h-screen bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Chat Header */}
      <motion.div 
        className="border-b border-gray-200 px-4 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsChatMode(false);
                setMessages([]);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                {selectedModel === 'auto' ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <div className="text-white">
                    {getProviderIcon(16)}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{getCurrentModelName()}</h1>
                {currentConversationId && (
                  <p className="text-xs text-gray-500">
                    {conversations.find(c => c.id === currentConversationId)?.title || 'Conversation'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConversationList(!showConversationList)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chats ({conversations.length})
            </button>
            <button
              onClick={startNewConversation}
              className="px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Online</span>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List Sidebar */}
        <AnimatePresence>
          {showConversationList && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring", damping: 20 }}
              className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                  <button
                    onClick={() => setShowConversationList(false)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {conversations.length > 0 ? (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          loadConversation(conversation.id);
                          setShowConversationList(false);
                        }}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-all duration-200 group
                          ${currentConversationId === conversation.id 
                            ? 'bg-blue-100 border border-blue-200' 
                            : 'bg-white hover:bg-gray-100 border border-gray-200'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className={`
                              font-medium text-sm truncate
                              ${currentConversationId === conversation.id ? 'text-blue-900' : 'text-gray-900'}
                            `}>
                              {conversation.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatRelativeTime(conversation.timestamp)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {conversation.messages.some(m => m.modelUsed) && (
                              <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <Bot className="w-2 h-2 text-gray-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Start a new chat to begin</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className={`
                max-w-2xl p-4 rounded-2xl
                ${message.sender === 'user' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-900'
                }
              `}>
                {message.sender === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <div className="text-white">
                        {getProviderIconForMessage(message.modelUsed, 12)}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">{getModelNameForMessage(message.modelUsed)}</span>
                  </div>
                )}
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: message.content }}
                />
                <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Loading Indicator */}
          {isLoadingResponse && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="max-w-2xl p-4 rounded-2xl bg-gray-100 text-gray-900">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      {selectedModel === 'auto' ? (
                        <Sparkles className="w-3 h-3 text-white" />
                      ) : (
                        <div className="text-white">
                          {getProviderIcon(12)}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{getCurrentModelName()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <span className="ml-2">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <motion.div 
        className="border-t border-gray-200 p-4 bg-white/80 backdrop-blur-sm sticky bottom-0"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className={`
            relative rounded-2xl bg-white border-2 transition-all duration-300 shadow-sm
            ${isFocused ? 'border-gray-900 shadow-lg shadow-gray-900/10' : 'border-gray-200'}
            min-h-[100px] p-4
          `}>
            {/* Main Input Area */}
            <form onSubmit={handleSubmit} className="flex-1">
              <div
                ref={chatTextareaRef}
                contentEditable={!isLoadingResponse}
                onInput={(e) => handleInputChange(e.currentTarget)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                data-placeholder="Type your message... (Press Enter to send)"
                className={`
                  w-full bg-transparent text-gray-900 text-sm
                  outline-none border-none resize-none leading-relaxed min-h-[40px] max-h-40
                  ${isChatScrollable ? 'overflow-y-auto scrollbar-modern pr-2' : 'overflow-hidden'}
                  ${isLoadingResponse ? 'opacity-50 cursor-not-allowed' : ''}
                  rich-text-editor
                `}
                style={{ 
                  height: 'auto',
                  minHeight: '40px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              />
            </form>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {/* Left Side - Mode Buttons */}
              <div className="flex items-center gap-2">
                {/* AI Model Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${selectedMode === 'auto' 
                        ? 'bg-gray-900 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }
                    `}
                  >
                    {getProviderIcon(16)}
                    <span className="max-w-[120px] truncate">{getCurrentModelName()}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-0' : 'rotate-180'}`} />
                  </button>

                  <AnimatePresence>
                    {isModelDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                      >
                        <div className="max-h-64 overflow-y-auto scrollbar-modern">
                          {(() => {
                            const { autoOption, providerGroups } = getOrganizedModels();
                            return (
                              <div>
                                {/* Auto Option */}
                                <button
                                  key={autoOption.value}
                                  onClick={() => handleModelSelect(autoOption.value)}
                                  className={`
                                    w-full text-left px-3 py-2 text-sm transition-colors duration-150
                                    hover:bg-gray-50 flex items-center justify-between group
                                    ${selectedModel === autoOption.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                                  `}
                                >
                                  <div className="flex items-center gap-2">
                                    {getModelProviderIcon('auto', 12)}
                                    <span className="font-medium">{autoOption.label}</span>
                                  </div>
                                  {selectedModel === autoOption.value && (
                                    <div className="w-2 h-2 bg-gray-900 rounded-full" />
                                  )}
                                </button>
                                
                                <div className="my-2 border-t border-gray-100" />
                                
                                {/* Provider Groups */}
                                {providerGroups.map((provider) => (
                                  <div key={provider.value} className="mb-1">
                                    {/* Provider Header */}
                                    <button
                                      onClick={() => toggleProvider(provider.value)}
                                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-between transition-colors duration-150"
                                    >
                                      <span className="flex items-center gap-2">
                                        {getProviderHeaderIcon(provider.value, 12)}
                                        {provider.displayName}
                                      </span>
                                      <ChevronRightIcon 
                                        className={`w-3 h-3 transition-transform duration-200 ${
                                          expandedProviders.includes(provider.value) ? 'rotate-90' : ''
                                        }`}
                                      />
                                    </button>
                                    
                                    {/* Provider Models */}
                                    <AnimatePresence>
                                      {expandedProviders.includes(provider.value) && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          {provider.models.map((model) => (
                                            <button
                                              key={model.value}
                                              onClick={() => handleModelSelect(model.value)}
                                              className={`
                                                w-full text-left pl-8 pr-3 py-2 text-sm transition-colors duration-150
                                                hover:bg-gray-50 flex items-center justify-between group
                                                ${selectedModel === model.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                                              `}
                                            >
                                              <div className="flex items-center gap-2">
                                                {getModelProviderIcon(model.value, 12)}
                                                <span className="font-medium">{model.label}</span>
                                              </div>
                                              {selectedModel === model.value && (
                                                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                                              )}
                                            </button>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => setSelectedMode('research')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${selectedMode === 'research' 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <Search className="w-4 h-4" />
                  Research
                </button>

                <button
                  onClick={() => setSelectedMode('all')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${selectedMode === 'all' 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">All sources</span>
                  <span className="sm:hidden">All</span>
                </button>
              </div>

              {/* Right Side - Microphone/Send Button */}
              <div className="flex items-center">
                <AnimatePresence mode="wait">
                  {!inputValue.trim() ? (
                    <motion.button
                      key="microphone-chat"
                      type="button"
                      className="
                        flex items-center justify-center px-3 py-2 rounded-xl bg-gray-100 text-gray-600
                        hover:bg-gray-200 hover:text-gray-700 border border-gray-200
                        transition-all duration-200 shadow-sm
                      "
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="send-chat"
                      onClick={handleSendClick}
                      disabled={isLoadingResponse}
                      className={`
                        flex items-center justify-center px-3 py-2 rounded-xl transition-all duration-200
                        shadow-sm hover:shadow-md
                        ${isLoadingResponse 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                        }
                      `}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={!isLoadingResponse ? { scale: 1.02 } : {}}
                      whileTap={!isLoadingResponse ? { scale: 0.98 } : {}}
                      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                      title={isLoadingResponse ? "Processing..." : "Send message"}
                    >
                      {isLoadingResponse ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {!isChatMode ? renderWelcomeScreen() : renderChatInterface()}
    </AnimatePresence>
  );
};

export default Assistant;