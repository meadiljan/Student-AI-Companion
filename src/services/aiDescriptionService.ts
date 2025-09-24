/**
 * AI Description Generation Service
 * Automatically generates task descriptions based on titles using AI
 */

export async function generateTaskDescription(title: string): Promise<string> {
  // Don't generate for very short titles that are likely incomplete
  if (!title || title.trim().length < 3) {
    return 'Complete this task according to requirements.';
  }

  const cleanTitle = title.trim();
  
  const prompt = `Generate a concise, helpful description for a task titled "${cleanTitle}". 
  
  Guidelines:
  - Keep it brief (1-2 sentences, max 150 characters)
  - Focus on actionable details and context
  - Use professional, clear language
  - Don't repeat the title verbatim
  - Make it specific and helpful for task completion
  
  Examples:
  Title: "Complete Math Homework"
  Description: "Finish algebra problems from chapter 5 and review calculus concepts for upcoming quiz."
  
  Title: "Research Market Trends"
  Description: "Analyze current market data and competitor strategies to inform quarterly business planning."
  
  Title: "Fix Login Bug"
  Description: "Debug authentication issue causing users to get logged out unexpectedly during session."
  
  Now generate a description for: "${cleanTitle}"
  
  Return only the description text, no quotes or additional formatting.`;

  try {
    // Use the browser's built-in AI if available (Chrome's experimental AI API)
    if ('ai' in window && 'languageModel' in (window as any).ai) {
      const session = await (window as any).ai.languageModel.create({
        temperature: 0.7,
        topK: 3,
      });
      
      const result = await session.prompt(prompt);
      session.destroy();
      
      // Clean up the result
      let description = result.trim();
      // Remove quotes if they exist
      description = description.replace(/^["'](.*)["']$/, '$1');
      
      // Ensure it's not too long
      if (description.length > 150) {
        description = description.substring(0, 147) + '...';
      }
      
      return description || generateFallbackDescription(cleanTitle);
    }
    
    // Fallback to a simple template-based approach if AI not available
    return generateFallbackDescription(cleanTitle);
    
  } catch (error) {
    console.log('AI description generation failed, using fallback:', error);
    return generateFallbackDescription(cleanTitle);
  }
}

function generateFallbackDescription(title: string): string {
  // Simple template-based fallback descriptions
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('homework') || lowerTitle.includes('assignment')) {
    return 'Complete assigned work and review materials for understanding.';
  }
  
  if (lowerTitle.includes('meeting') || lowerTitle.includes('call')) {
    return 'Attend scheduled meeting and participate in discussions.';
  }
  
  if (lowerTitle.includes('research') || lowerTitle.includes('study')) {
    return 'Gather information and analyze findings for the project.';
  }
  
  if (lowerTitle.includes('review') || lowerTitle.includes('check')) {
    return 'Examine and evaluate the specified items or content.';
  }
  
  if (lowerTitle.includes('fix') || lowerTitle.includes('debug') || lowerTitle.includes('bug')) {
    return 'Identify and resolve the technical issue or problem.';
  }
  
  if (lowerTitle.includes('write') || lowerTitle.includes('draft')) {
    return 'Compose and structure the required written content.';
  }
  
  if (lowerTitle.includes('design') || lowerTitle.includes('create')) {
    return 'Plan and develop the specified deliverable or solution.';
  }
  
  if (lowerTitle.includes('test') || lowerTitle.includes('exam')) {
    return 'Prepare for and complete the scheduled assessment.';
  }
  
  if (lowerTitle.includes('plan') || lowerTitle.includes('organize')) {
    return 'Structure and coordinate the necessary activities and resources.';
  }
  
  // Generic fallback
  return 'Complete this task according to requirements and timeline.';
}