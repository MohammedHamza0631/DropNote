import React, { useEffect, useState } from 'react';
import { Clock, ExternalLink, HelpCircle, Copy, Check, Home, InfinityIcon, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { LinkDump, LinkItem } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface LinkViewProps {
  slug: string;
  onBackToHome: () => void;
}

export function LinkView({ slug, onBackToHome }: LinkViewProps) {
  const [dump, setDump] = useState<LinkDump | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);
  const [textContent, setTextContent] = useState<string>('');

  useEffect(() => {
    const fetchDump = async () => {
      const { data, error } = await supabase
        .from('link_dumps')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        setError('This link dump has expired or does not exist.');
        return;
      }

      setDump(data);
      
      // Check if it's a permanent link
      if (data.expires_at === null) {
        setIsPermanent(true);
      }

      // Combine all text content into one string
      const combinedText = data.links
        .filter((item: LinkItem) => item.type === 'text')
        .map((item: LinkItem) => item.textContent)
        .join('\n\n');
      
      setTextContent(combinedText);
    };

    fetchDump();
  }, [slug]);

  useEffect(() => {
    if (!dump || isPermanent) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      // Skip if expires_at is null (permanent link)
      if (!dump.expires_at) return;
      
      const expires = new Date(dump.expires_at).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setError('This link dump has expired.');
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dump, isPermanent]);

  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return '';
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract domain from URL for display
  const getDomainFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  // Get a truncated version of the URL for display
  const getTruncatedUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname.substring(0, 20) + (urlObj.pathname.length > 20 ? '...' : '');
    } catch {
      return url.substring(0, 30) + (url.length > 30 ? '...' : '');
    }
  };
  
  // Render only headers and links, text content is shown separately
  const renderLinkItem = (item: LinkItem, index: number) => {
    if (item.type === 'header') {
      // Get header level by counting # symbols
      const headerLevel = (item.content?.match(/^#+/) || [''])[0].length;
      const headerContent = item.content?.replace(/^#+\s+/, '') || '';
      
      // Apply different styles based on header level
      const headerClass = 'text-gray-900 dark:text-gray-100 font-bold py-2';
      let fontSize = 'text-lg';
      
      if (headerLevel === 1) fontSize = 'text-2xl';
      else if (headerLevel === 2) fontSize = 'text-xl';
      else if (headerLevel === 3) fontSize = 'text-lg';
      else fontSize = 'text-base';
      
      return (
        <motion.div 
          key={index} 
          className={`${headerClass} ${fontSize} px-4 pt-3 pb-1`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {headerContent}
        </motion.div>
      );
    }
    
    // Skip rendering text items as they're combined
    if (item.type === 'text') {
      return null;
    }
    
    // It's a link
    return (
      <motion.a
        key={index}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 hover:bg-light-700 dark:hover:bg-dark-700 transition-colors"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
      >
        {item.url && getFaviconUrl(item.url) ? (
          <img
            src={getFaviconUrl(item.url)}
            alt=""
            className="w-6 h-6 flex-shrink-0"
          />
        ) : (
          <HelpCircle size={24} className="text-gray-400 flex-shrink-0" />
        )}
        <div className="flex-1 overflow-hidden">
          <span className="text-purple-600 dark:text-purple-400 block truncate">
            {item.title || (item.url && getTruncatedUrl(item.url)) || ''}
          </span>
          {!item.title && item.url && (
            <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
              {getDomainFromUrl(item.url)}
            </span>
          )}
        </div>
        <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
      </motion.a>
    );
  };

  if (error) {
    return (
      <motion.div 
        className="w-full max-w-2xl p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-center flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-red-600 dark:text-red-400">{error}</p>
        
        <motion.button
          onClick={onBackToHome}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white px-4 py-2 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home size={18} />
          <span>Go to Home</span>
        </motion.button>
      </motion.div>
    );
  }

  if (!dump) {
    return (
      <motion.div 
        className="w-full max-w-2xl p-8 bg-light-800 dark:bg-dark-800 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-light-700 dark:bg-dark-700 rounded w-3/4"></div>
          <div className="h-4 bg-light-700 dark:bg-dark-700 rounded"></div>
          <div className="h-4 bg-light-700 dark:bg-dark-700 rounded"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-2xl space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className={`flex items-center gap-2 p-3 rounded-lg ${
          isPermanent 
            ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
            : 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
        }`}
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isPermanent ? (
          <>
            <InfinityIcon size={20} />
            <span>Permanent link - never expires</span>
          </>
        ) : (
          <>
            <Clock size={20} />
            <span>This link will expire in {timeLeft}</span>
          </>
        )}
      </motion.div>

      <motion.div 
        className="flex items-center gap-2 bg-light-800 dark:bg-dark-800 p-4 rounded-lg"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex-1 font-mono text-sm text-gray-600 dark:text-gray-400 truncate">
          {window.location.href}
        </div>
        <motion.button
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </motion.button>
      </motion.div>
      
      {/* Display single text box if there's text content */}
      {textContent && (
        <motion.div
          className="bg-light-800 dark:bg-dark-800 rounded-lg p-4 overflow-hidden"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-start gap-3">
            <FileText className="text-purple-500 flex-shrink-0 mt-1" size={18} />
            <div className="w-full bg-light-700/30 dark:bg-dark-700/30 rounded-lg p-5 shadow-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {textContent}
            </div>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        className="bg-light-800 dark:bg-dark-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence>
          {dump.links.map((item, index) => renderLinkItem(item, index))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}