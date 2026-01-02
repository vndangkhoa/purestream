import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
            setIsOpen(false);
            setQuery('');
        }
    };

    return (
        <div className={`relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 shadow-2xl overflow-hidden group ${isOpen ? 'w-full max-w-md px-4' : 'w-12 h-12 justify-center'}`}>
            {/* Search Icon / Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`text-white p-3 hover:text-white transition-colors duration-300 ${isOpen ? '' : 'w-full h-full flex items-center justify-center'}`}
            >
                <Search size={isOpen ? 18 : 20} className={isOpen ? 'opacity-60' : ''} />
            </button>

            {/* Input Field */}
            <form onSubmit={handleSubmit} className={`flex-1 flex items-center transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search TikTok Clean..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 ml-2 font-medium py-2"
                    autoFocus={isOpen}
                />
            </form>

            {isOpen && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 to-gray-300/10 pointer-events-none" />
            )}
        </div>
    );
};
