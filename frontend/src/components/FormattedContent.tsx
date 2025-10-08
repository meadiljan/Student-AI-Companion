import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedContentProps {
  content: string;
  className?: string;
}

const FormattedContent = ({ content, className = '' }: FormattedContentProps) => {
  // Check if content contains HTML tags
  // More specific regex to avoid false positives
  const isHtmlContent = /<\/?[a-z][\s\S]*>/i.test(content);
  
  if (isHtmlContent) {
    // For HTML content, render as HTML
    // Add error handling to prevent crashes
    try {
      return (
        <div 
          className={`${className} formatted-content`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    } catch (error) {
      // Fallback to plain text if HTML rendering fails
      return <div className={className}>{content}</div>;
    }
  } else {
    // For plain text or markdown content, render as markdown
    // Apply className to a wrapper div since ReactMarkdown doesn't accept className directly
    return (
      <div className={`${className} formatted-content`}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
};

export default FormattedContent;