// AI Service for Assistant Page
// Extracted from AIAssistantSearchBar for reusability

export interface AIProvider {
  name: string;
  value: string;
  models: string[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'Gemini',
    value: 'gemini',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash']
  },
  {
    name: 'OpenAI',
    value: 'openai', 
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt-4o-mini']
  },
  {
    name: 'Groq',
    value: 'groq',
    models: ['meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.3-70b-versatile']
  }
];

// Function to call Gemini API
export const callGeminiAPI = async (query: string, apiKey: string, model: string = 'gemini-2.5-pro'): Promise<string> => {
  try {
    // Map the internal model names to Gemini API model names
    const modelMap: Record<string, string> = {
      "gemini-2.5-pro": "gemini-2.5-pro",
      "gemini-2.5-flash": "gemini-2.5-flash"
    };
    
    const selectedModel = modelMap[model] || "gemini-2.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: query
          }]
        }]
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error for model ${selectedModel}:`, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if the response has the expected structure
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || "No text content in response";
      }
    }
    
    // Fallback if structure is different
    return data.candidates?.[0]?.content?.parts?.[0]?.text || `No response from Gemini ${selectedModel}`;
  } catch (error) {
    console.error("Gemini API call error:", error);
    return `Error calling Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// Function to call OpenAI API
export const callOpenAIAPI = async (query: string, apiKey: string, model: string = 'gpt-3.5-turbo'): Promise<string> => {
  try {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: query }],
          temperature: 0.7,
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "No response from OpenAI";
  } catch (error) {
    console.error("OpenAI API call error:", error);
    return `Error calling OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// Function to call Groq API
export const callGroqAPI = async (query: string, apiKey: string, model: string = 'meta-llama/llama-4-maverick-17b-128e-instruct'): Promise<string> => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: query }],
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error for model ${model}:`, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || `No response from Groq ${model}`;
  } catch (error) {
    console.error("Groq API call error:", error);
    return `Error calling Groq API: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// Main AI service function that routes to appropriate provider
export const callAIService = async (query: string, overrideModel?: string): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('aiApiKey');
    let selectedModel = overrideModel || localStorage.getItem('selectedAiModel') || 'gemini-2.5-pro';
    
    // Handle auto mode - fallback to Gemini 2.5 Pro for now
    if (selectedModel === 'auto') {
      selectedModel = 'gemini-2.5-pro';
      console.log('🤖 Auto mode detected, using Gemini 2.5 Pro');
    }
    
    console.log(`🔄 Using AI Model: ${selectedModel}`);
    
    if (!apiKey) {
      return "No AI API key configured. Please set up your API key in the settings.";
    }
    
    let response: string;
    
    // Determine provider from model name with better logic
    if (selectedModel.includes('gemini')) {
      console.log('📡 Calling Gemini API');
      response = await callGeminiAPI(query, apiKey, selectedModel);
    } else if (selectedModel.includes('gpt') || selectedModel.includes('openai')) {
      console.log('📡 Calling OpenAI API');
      response = await callOpenAIAPI(query, apiKey, selectedModel);
    } else if (selectedModel.includes('llama') || selectedModel.includes('meta-llama/')) {
      console.log('📡 Calling Groq API for Llama model');
      response = await callGroqAPI(query, apiKey, selectedModel);
    } else {
      // Find provider from AI_PROVIDERS for exact match
      const provider = AI_PROVIDERS.find(p => p.models.includes(selectedModel));
      if (provider) {
        switch (provider.value) {
          case 'gemini':
            response = await callGeminiAPI(query, apiKey, selectedModel);
            break;
          case 'openai':
            response = await callOpenAIAPI(query, apiKey, selectedModel);
            break;
          case 'groq':
            response = await callGroqAPI(query, apiKey, selectedModel);
            break;
          default:
            console.warn(`Unknown provider for model ${selectedModel}, falling back to Gemini`);
            response = await callGeminiAPI(query, apiKey, 'gemini-2.5-pro');
        }
      } else {
        // Log the attempt for debugging and fallback to Gemini
        console.warn(`Model ${selectedModel} not found in providers, falling back to Gemini`);
        response = await callGeminiAPI(query, apiKey, 'gemini-2.5-pro');
      }
    }
    
    return response;
  } catch (error) {
    console.error("AI Service error:", error);
    return `Error getting AI response: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// Function to format AI response with HTML
export const formatAIResponse = (response: string): string => {
  // Basic markdown-like formatting to HTML
  let formatted = response;
  
  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert _underline_ to <u>
  formatted = formatted.replace(/_(.*?)_/g, '<u>$1</u>');
  
  // Convert bullet points to HTML lists
  formatted = formatted.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> elements in <ul>
  formatted = formatted.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Convert line breaks to paragraphs
  formatted = formatted.split('\n\n').map(paragraph => {
    if (paragraph.trim() && !paragraph.includes('<li>') && !paragraph.includes('<ul>')) {
      return `<p>${paragraph.trim()}</p>`;
    }
    return paragraph;
  }).join('\n');
  
  return formatted;
};