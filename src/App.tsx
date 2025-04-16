import React, { useState, useEffect } from 'react';
import { Moon, Sun, Link as LinkIcon, Home } from 'lucide-react';
import { LinkInput } from './components/LinkInput';
import { LinkView } from './components/LinkView';
import { motion } from 'motion/react';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Check URL for slug
  useEffect(() => {
    const slug = window.location.pathname.split('/').pop();
    if (slug && slug !== '/') setActiveSlug(slug);
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

  const goToHome = () => {
    window.history.pushState({}, '', '/');
    setActiveSlug(null);
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark text-gray-900 dark:text-gray-100 py-8 px-4">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.header 
          className="flex items-center justify-between mb-8"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div 
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.03 }}
            onClick={goToHome}
          >
            <LinkIcon className="text-purple-600 dark:text-purple-400" size={24} />
            <h1 className="text-xl font-bold">🧾 Text Dump</h1>
          </motion.div>
          <div className="flex gap-2">
            {activeSlug && (
              <motion.button
                onClick={goToHome}
                className="p-2 rounded-lg bg-light-800 dark:bg-dark-800 text-gray-700 dark:text-gray-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Go to home page"
              >
                <Home size={20} />
              </motion.button>
            )}
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-light-800 dark:bg-dark-800 shadow-sm hover:shadow transition-shadow"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </motion.button>
          </div>
        </motion.header>

        <main className="flex flex-col items-center justify-center gap-8">
          {activeSlug ? (
            <LinkView slug={activeSlug} onBackToHome={goToHome} />
          ) : (
            <LinkInput onSuccess={handleSuccess} />
          )}
        </main>
      </motion.div>
    </div>
  );
}

export default App;