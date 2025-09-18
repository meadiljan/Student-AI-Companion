import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  const updateActiveFormats = () => {
    const formats: Record<string, boolean> = {};
    
    // Check for active formats using document.queryCommandState
    formats.bold = document.queryCommandState('bold');
    formats.italic = document.queryCommandState('italic');
    formats.underline = document.queryCommandState('underline');
    formats.insertUnorderedList = document.queryCommandState('insertUnorderedList');
    formats.insertOrderedList = document.queryCommandState('insertOrderedList');
    formats.justifyLeft = document.queryCommandState('justifyLeft');
    formats.justifyCenter = document.queryCommandState('justifyCenter');
    formats.justifyRight = document.queryCommandState('justifyRight');
    
    setActiveFormats(formats);
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    // Update active formats after command execution
    setTimeout(updateActiveFormats, 0);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveFormats();
  };

  const handleSelectionChange = () => {
    if (isFocused) {
      updateActiveFormats();
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isFocused]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;
      
      // Bold: Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        executeCommand('bold');
      }
      // Italic: Ctrl+I or Cmd+I
      else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        executeCommand('italic');
      }
      // Underline: Ctrl+U or Cmd+U
      else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        executeCommand('underline');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocused]);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      // Only set content if it's different to avoid cursor reset
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  return (
    <div className="border rounded-2xl overflow-hidden bg-background">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        <Button
          variant={activeFormats.bold ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('bold');
          }}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={activeFormats.italic ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('italic');
          }}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={activeFormats.underline ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('underline');
          }}
          className="h-8 w-8 p-0"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          variant={activeFormats.insertUnorderedList ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('insertUnorderedList');
          }}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={activeFormats.insertOrderedList ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('insertOrderedList');
          }}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          variant={activeFormats.justifyLeft ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('justifyLeft');
          }}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={activeFormats.justifyCenter ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('justifyCenter');
          }}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={activeFormats.justifyRight ? "default" : "ghost"}
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('justifyRight');
          }}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => {
          setIsFocused(true);
          // Update formats when focus is gained
          setTimeout(updateActiveFormats, 0);
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        onClick={updateActiveFormats}
        className="w-full min-h-[200px] p-4 bg-background resize-none focus:outline-none rounded-b-2xl rich-text-editor"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: '1.5',
          direction: 'ltr',
          textAlign: 'left',
          minHeight: '200px'
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;