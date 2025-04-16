import React, { useState, useEffect } from 'react';
import { Moon, Sun, Link } from 'lucide-react';
import { LinkInput } from './components/LinkInput';
import { LinkView } from './components/LinkView';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Check URL for slug
  React.useEffect(() => {
    const slug = window.location.pathname.split('/').pop();
    if (slug) setActiveSlug(slug);
  }, []);

  // Initialize theme based on system preference
  useEffect(() => {
    // Check for user preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleSuccess = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    window.history.pushState({}, '', `/${slug}`);
    setActiveSlug(slug);
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark text-gray-900 dark:text-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Link className="text-blue-600 dark:text-blue-400" size={24} />
            <h1 className="text-xl font-bold">🧾 Link Dump</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-light-800 dark:bg-dark-800 shadow-sm hover:shadow transition-shadow"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </header>

        <main className="flex flex-col items-center justify-center gap-8">
          {activeSlug ? (
            <LinkView slug={activeSlug} />
          ) : (
            <LinkInput onSuccess={handleSuccess} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;