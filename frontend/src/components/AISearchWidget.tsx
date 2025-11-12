import React, { useState } from 'react';
import { Plus, Mic, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventManager } from '@/utils/eventManager';

interface AISearchWidgetProps {
  className?: string;
  placeholder?: string;
}

const AISearchWidget: React.FC<AISearchWidgetProps> = ({ 
  className = '',
  placeholder = 'Ask anything'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasText, setHasText] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setHasText(value.length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Clear the input
      const query = inputValue.trim();
      setInputValue('');
      setHasText(false);
      
      // Trigger AI Assistant to open and process the query
      eventManager.triggerAIAssistant(query);
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim()) {
      // Clear the input
      const query = inputValue.trim();
      setInputValue('');
      setHasText(false);
      
      // Trigger AI Assistant to open and process the query
      eventManager.triggerAIAssistant(query);
    }
  };

  return (
    <div 
      className={`
        w-full relative px-4 sm:px-6 ${className}
      `}
    >
      <div 
        className="
          relative rounded-2xl bg-white border border-gray-200
          min-h-[60px] sm:min-h-[68px]
        "
      >
        
        <div className="relative flex items-end px-4 sm:px-6 py-4 sm:py-5 gap-3 sm:gap-4">
          {/* AI Icon */}
          <motion.div
            className="flex-shrink-0 mb-1"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="
              w-10 h-10 sm:w-11 sm:h-11
              rounded-xl bg-black
              flex items-center justify-center
            ">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Search Input */}
          <div className="flex-1 relative min-h-[36px] sm:min-h-[40px] flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="w-full">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="
                  w-full bg-transparent text-gray-800 placeholder-gray-400
                  outline-none border-none text-base sm:text-lg font-medium
                  py-2 sm:py-3 transition-all duration-300
                  leading-relaxed
                "
              />
            </form>
            

            
            {/* Focus indicator line */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-black"
              initial={{ width: 0 }}
              animate={{ width: isFocused ? "100%" : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 flex-shrink-0 mb-1">
            <motion.button
              className="
                p-2.5 sm:p-3 rounded-xl
                bg-gray-100 text-gray-600 
                hover:bg-gray-200 hover:text-gray-800
                transition-colors duration-200
                hidden sm:flex items-center justify-center
              "
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            
            {/* Microphone/Send Button - toggles based on input */}
            <AnimatePresence mode="wait" initial={false}>
              {hasText ? (
                <motion.button
                  key="send"
                  className="
                    p-2.5 sm:p-3 rounded-xl
                    bg-black text-white 
                    hover:bg-gray-800
                    transition-colors duration-75
                    flex items-center justify-center
                  "
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 1000, damping: 30, duration: 0.04 }}
                  onClick={handleSendClick}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  className="
                    p-2.5 sm:p-3 rounded-xl
                    bg-gray-100 text-gray-600 
                    hover:bg-gray-200 hover:text-gray-800
                    transition-colors duration-75
                    flex items-center justify-center
                  "
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 1000, damping: 30, duration: 0.04 }}
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Mobile responsive hint */}
      <motion.div
        className="sm:hidden absolute -bottom-8 left-0 right-0 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isFocused ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs text-gray-400">Swipe for more options</p>
      </motion.div>
    </div>
  );
};

export default AISearchWidget;