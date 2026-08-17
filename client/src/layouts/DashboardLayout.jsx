import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader/AppHeader';
import { Sidebar } from '../components/layout/Sidebar/Sidebar';
import { searchApi } from '../api/apiServices';
import { FiSearch, FiX, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchApi.globalSearch(searchQuery);
        setSearchResults(res.data.data.results || []);
      } catch (_) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans">
      <AppHeader
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} />

        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* Central Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-[#DDE3ED] overflow-hidden">
            <div className="p-4 border-b border-[#DDE3ED] flex items-center gap-3">
              <FiSearch className="text-xl text-[#5A6A7E]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Institutions, Safe IDs, Inspections, Officers..."
                className="w-full text-sm font-medium text-[#1A2332] outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {isSearching ? (
                <div className="p-6 text-center text-xs text-[#5A6A7E]">Searching platform database...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5A6A7E]">
                  {searchQuery ? 'No matching government records found.' : 'Type to start searching...'}
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(item.link);
                      }}
                      className="p-3 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer border border-transparent hover:border-[#DDE3ED] transition"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 mr-2">
                          {item.type}
                        </span>
                        <span className="text-xs font-semibold text-[#1A2332]">{item.title}</span>
                        <p className="text-[11px] text-[#5A6A7E] mt-0.5">{item.subtitle}</p>
                      </div>
                      <FiExternalLink className="text-slate-400 text-sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
