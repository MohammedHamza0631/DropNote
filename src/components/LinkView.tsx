import React, { useEffect, useState } from 'react';
import { Clock, ExternalLink, HelpCircle, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { LinkDump, LinkItem } from '../lib/supabase';

interface LinkViewProps {
  slug: string;
}

export function LinkView({ slug }: LinkViewProps) {
  const [dump, setDump] = useState<LinkDump | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

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
    };

    fetchDump();
  }, [slug]);

  useEffect(() => {
    if (!dump) return;

    const updateTimer = () => {
      const now = new Date().getTime();
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
  }, [dump]);

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
  
  // Render a single link item based on its type
  const renderLinkItem = (item: LinkItem, index: number) => {
    if (item.type === 'header') {
      // Get header level by counting # symbols
      const headerLevel = (item.content?.match(/^#+/) || [''])[0].length;
      const headerContent = item.content?.replace(/^#+\s+/, '') || '';
      
      // Apply different styles based on header level
      let headerClass = 'text-gray-900 dark:text-gray-100 font-bold py-2';
      let fontSize = 'text-lg';
      
      if (headerLevel === 1) fontSize = 'text-2xl';
      else if (headerLevel === 2) fontSize = 'text-xl';
      else if (headerLevel === 3) fontSize = 'text-lg';
      else fontSize = 'text-base';
      
      return (
        <div key={index} className={`${headerClass} ${fontSize} px-4 pt-3 pb-1`}>
          {headerContent}
        </div>
      );
    }
    
    // It's a link
    return (
      <a
        key={index}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 hover:bg-light-700 dark:hover:bg-dark-700 transition-colors"
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
          <span className="text-blue-600 dark:text-blue-400 block truncate">
            {item.title || (item.url && getTruncatedUrl(item.url)) || ''}
          </span>
          {!item.title && item.url && (
            <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
              {getDomainFromUrl(item.url)}
            </span>
          )}
        </div>
        <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
      </a>
    );
  };

  if (error) {
    return (
      <div className="w-full max-w-2xl p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!dump) {
    return (
      <div className="w-full max-w-2xl p-8 bg-light-800 dark:bg-dark-800 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-light-700 dark:bg-dark-700 rounded w-3/4"></div>
          <div className="h-4 bg-light-700 dark:bg-dark-700 rounded"></div>
          <div className="h-4 bg-light-700 dark:bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
        <Clock size={20} />
        <span>This link will expire in {timeLeft}</span>
      </div>

      <div className="flex items-center gap-2 bg-light-800 dark:bg-dark-800 p-4 rounded-lg">
        <div className="flex-1 font-mono text-sm text-gray-600 dark:text-gray-400 truncate">
          {window.location.href}
        </div>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
      
      <div className="bg-light-800 dark:bg-dark-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {dump.links.map((item, index) => renderLinkItem(item, index))}
      </div>
    </div>
  );
}