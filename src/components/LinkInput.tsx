import React, { useState } from 'react';
import { ClipboardPaste, Share2, Clock, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import type { LinkItem } from '../lib/supabase';
import { motion } from 'motion/react';

interface LinkInputProps {
  onSuccess: (slug: string) => void;
}

type ExpiryOption = {
  label: string;
  value: number | null; // minutes or null for never
};

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1 min', value: 1},
  { label: '5 min', value: 5},
  { label: '10 minutes', value: 10 },
  { label: '1 hour', value: 60 },
  { label: '1 day', value: 24 * 60 },
  { label: '1 week', value: 7 * 24 * 60 },
  { label: 'Never', value: null },
];

export function LinkInput({ onSuccess }: LinkInputProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<ExpiryOption>(EXPIRY_OPTIONS[0]);

  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const parseLinks = (text: string): LinkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      // Check if it's a markdown header
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        return {
          type: 'header',
          content: line.trim()
        };
      }
      
      // Check for markdown format [title](url)
      const markdownMatch = line.match(/\[(.*?)\]\((.*?)\)/);
      if (markdownMatch) {
        return {
          type: 'link',
          title: markdownMatch[1],
          url: markdownMatch[2]
        };
      }
      
      // Check if it's a URL or plain text
      const trimmedLine = line.trim();
      if (isUrl(trimmedLine)) {
        return {
          type: 'link',
          url: trimmedLine
        };
      }
      
      // It's plain text content
      return {
        type: 'text',
        textContent: trimmedLine
      };
    });
  };

  const getIpAddress = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP:', error);
      throw new Error('Failed to get IP address');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const ipAddress = await getIpAddress();
      const links = parseLinks(input);
      const slug = nanoid(10);
      
      // Calculate expiry time based on selection
      let expiresAt: Date | null = null;
      
      if (selectedExpiry.value !== null) {
        expiresAt = new Date(Date.now() + selectedExpiry.value * 60 * 1000);
      }

      const { error } = await supabase
        .from('link_dumps')
        .insert({
          slug,
          links,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          ip_address: ipAddress
        });

      if (error) {
        if (error.message.includes('policy')) {
          setError('Rate limit reached: You can create up to 3 dumps per minute. Please wait a moment before trying again.');
        } else {
          setError(`Failed to create link dump: ${error.message}`);
        }
        return;
      }
      
      onSuccess(slug);
      setInput('');
    } catch (error) {
      console.error('Error creating link dump:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="w-full max-w-2xl space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Info size={20} />
        <span>You can create up to 3 dumps per minute</span>
      </motion.div>
      
      {error && (
        <motion.div
          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </motion.div>
      )}
      
      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <ClipboardPaste className="absolute top-3 left-3 text-gray-400" size={20} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your links or text here (one per line)&#10;Links: [Title](https://example.com) or just URLs&#10;Text: Any non-URL text will be displayed as content"
          className="w-full h-48 pl-10 pr-4 py-2 bg-light-800 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </motion.div>

      <motion.div 
        className="flex items-center gap-2 bg-light-800 dark:bg-dark-800 p-4 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Clock size={20} className="text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300 mr-2">Expires after:</span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1">
          {EXPIRY_OPTIONS.map((option) => (
            <motion.button
              key={option.label}
              type="button"
              onClick={() => setSelectedExpiry(option)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedExpiry.label === option.label
                  ? 'bg-purple-600 text-white dark:bg-purple-700'
                  : 'bg-light-700 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-light-600 dark:hover:bg-dark-600'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.button
        type="submit"
        disabled={loading || !input.trim()}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Share2 size={20} />
        {loading ? 'Creating...' : 'Generate Temporary Page'}
      </motion.button>
    </motion.form>
  );
}