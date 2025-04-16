import React, { useState } from 'react';
import { ClipboardPaste, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import type { LinkItem } from '../lib/supabase';

interface LinkInputProps {
  onSuccess: (slug: string) => void;
}

export function LinkInput({ onSuccess }: LinkInputProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
      
      // Otherwise just treat as URL
      return {
        type: 'link',
        url: line.trim()
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
    try {
      const ipAddress = await getIpAddress();
      const links = parseLinks(input);
      const slug = nanoid(10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error } = await supabase
        .from('link_dumps')
        .insert({
          slug,
          links,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress
        });

      if (error) throw error;
      onSuccess(slug);
      setInput('');
    } catch (error) {
      console.error('Error creating link dump:', error);
      alert('Failed to create link dump. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div className="relative">
        <ClipboardPaste className="absolute top-3 left-3 text-gray-400" size={20} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your links here (one per line)&#10;Or use markdown: [Title](https://example.com)"
          className="w-full h-48 pl-10 pr-4 py-2 bg-light-800 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Share2 size={20} />
        {loading ? 'Creating...' : 'Generate Temporary Page'}
      </button>
    </form>
  );
}