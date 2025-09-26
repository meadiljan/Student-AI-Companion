export interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  icon: string;
  color: string;
}

export interface CourseMatch {
  courseId: string;
  confidence: number;
  matchedTerms: string[];
}

/**
 * Service for intelligently detecting and matching courses based on user queries
 */
class CourseDetectionService {
  // Course keywords mapping - maps course IDs to related terms and keywords
  private courseKeywords: Record<string, string[]> = {
    'advanced-typography': [
      'typography', 'typeface', 'font', 'fonts', 'webfont', 'variable fonts',
      'type design', 'lettering', 'text design', 'font optimization',
      'elara vance', 'prof. elara vance', 'typography assignment',
      'font project', 'type project'
    ],
    'ux-for-mobile': [
      'ux', 'user experience', 'mobile', 'mobile design', 'ui', 'user interface',
      'smartphone', 'mobile app', 'gesture', 'navigation', 'accessibility',
      'figma', 'prototype', 'mobile first', 'responsive', 'touch',
      'arion quinn', 'dr. arion quinn', 'mobile ux', 'app design'
    ],
    'digital-illustration': [
      'illustration', 'digital art', 'drawing', 'procreate', 'digital drawing',
      'brush', 'digital painting', 'layers', 'masks', 'color theory',
      'portfolio', 'art project', 'digital design', 'visual art',
      'aria beaumont', 'illustration assignment', 'art assignment'
    ],
    'web-development': [
      'web development', 'web dev', 'programming', 'coding', 'html', 'css',
      'javascript', 'js', 'react', 'redux', 'frontend', 'web programming',
      'website', 'web app', 'development', 'code', 'coding project',
      'leo rivera', 'prof. leo rivera', 'programming assignment'
    ],
    'art-history': [
      'art history', 'renaissance', 'impressionism', 'art movement', 'masters',
      'modern art', 'art analysis', 'art study', 'historical art',
      'art research', 'art essay', 'art paper', 'art exam',
      'helena shaw', 'dr. helena shaw', 'art history assignment'
    ],
    'calculus-i': [
      'calculus', 'math', 'mathematics', 'limits', 'derivatives', 'integrals',
      'continuity', 'differential', 'integral calculus', 'calc',
      'mathematical analysis', 'math assignment', 'math homework',
      'kenji tanaka', 'prof. kenji tanaka', 'calculus assignment'
    ]
  };

  // Subject area keywords for broader matching
  private subjectAreas: Record<string, string[]> = {
    design: ['advanced-typography', 'ux-for-mobile', 'digital-illustration'],
    technology: ['web-development', 'ux-for-mobile'],
    art: ['digital-illustration', 'art-history'],
    mathematics: ['calculus-i'],
    academic: ['art-history', 'calculus-i']
  };

  /**
   * Detect the most appropriate course for a given user query
   */
  public detectCourse(query: string, availableCourses: Course[]): string | null {
    if (!query || query.trim().length === 0) {
      return null;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const matches: CourseMatch[] = [];

    // Check each available course for matches
    for (const course of availableCourses) {
      const courseMatch = this.matchCourse(normalizedQuery, course.id);
      if (courseMatch.confidence > 0) {
        matches.push(courseMatch);
      }
    }

    // Sort by confidence and return the best match
    if (matches.length > 0) {
      matches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = matches[0];
      
      // Only return if confidence is above threshold
      if (bestMatch.confidence >= 0.3) {
        // Find the course and return its title instead of ID
        const foundCourse = availableCourses.find(c => c.id === bestMatch.courseId);
        return foundCourse ? foundCourse.title : null;
      }
    }

    return null;
  }

  /**
   * Get multiple course suggestions for a query
   */
  public suggestCourses(query: string, availableCourses: Course[], maxSuggestions: number = 3): CourseMatch[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const matches: CourseMatch[] = [];

    for (const course of availableCourses) {
      const courseMatch = this.matchCourse(normalizedQuery, course.id);
      if (courseMatch.confidence > 0.1) {
        matches.push(courseMatch);
      }
    }

    return matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  }

  /**
   * Match a query against a specific course
   */
  private matchCourse(normalizedQuery: string, courseId: string): CourseMatch {
    const keywords = this.courseKeywords[courseId] || [];
    const matchedTerms: string[] = [];
    let confidence = 0;

    // Direct keyword matching
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      
      if (normalizedQuery.includes(normalizedKeyword)) {
        matchedTerms.push(keyword);
        
        // Higher confidence for exact matches
        if (normalizedQuery === normalizedKeyword) {
          confidence += 1.0;
        }
        // Medium confidence for word boundaries
        else if (this.hasWordBoundary(normalizedQuery, normalizedKeyword)) {
          confidence += 0.8;
        }
        // Lower confidence for substring matches
        else {
          confidence += 0.4;
        }
      }
    }

    // Fuzzy matching for similar terms
    for (const keyword of keywords) {
      if (!matchedTerms.includes(keyword)) {
        const similarity = this.calculateSimilarity(normalizedQuery, keyword.toLowerCase());
        if (similarity > 0.7) {
          matchedTerms.push(keyword);
          confidence += similarity * 0.6;
        }
      }
    }

    // Subject area matching
    for (const [subject, courseIds] of Object.entries(this.subjectAreas)) {
      if (courseIds.includes(courseId) && normalizedQuery.includes(subject)) {
        confidence += 0.3;
        matchedTerms.push(`${subject} area`);
      }
    }

    // Instructor name matching gets high confidence
    for (const keyword of keywords) {
      if (keyword.toLowerCase().includes('prof.') || keyword.toLowerCase().includes('dr.')) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          confidence += 0.9;
        }
      }
    }

    return {
      courseId,
      confidence: Math.min(confidence, 1.0), // Cap at 1.0
      matchedTerms: [...new Set(matchedTerms)] // Remove duplicates
    };
  }

  /**
   * Check if a keyword appears at word boundaries in the query
   */
  private hasWordBoundary(query: string, keyword: string): boolean {
    const wordBoundaryRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return wordBoundaryRegex.test(query);
  }

  /**
   * Calculate string similarity using simple character-based approach
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get course context for AI prompts
   */
  public getCourseContext(courseTitle: string | null, availableCourses: Course[]): string {
    if (!courseTitle || courseTitle === 'General') {
      return "This task is not associated with any specific course.";
    }

    const course = availableCourses.find(c => c.title === courseTitle);
    if (!course) {
      return `This task is associated with the course: ${courseTitle}`;
    }

    return `This task is associated with the course: ${course.title} (${course.instructor})`;
  }

  /**
   * Validate if a course title exists in the available courses
   */
  public isValidCourse(courseTitle: string | null, availableCourses: Course[]): boolean {
    if (!courseTitle) return false;
    return availableCourses.some(course => course.title === courseTitle);
  }
}

// Export singleton instance
export const courseDetectionService = new CourseDetectionService();