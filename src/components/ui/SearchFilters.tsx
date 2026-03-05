import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { type VideoFilters } from '../../services/video.service';

interface SearchFiltersProps {
    onSearch: (query: string, filters: VideoFilters) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [modality, setModality] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSearch = () => {
        onSearch(query, {
            category: category || undefined,
            modality: modality || undefined
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="bg-black p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-brand-red/20 mb-8 font-sans">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-brand-red/20 rounded-lg leading-5 bg-brand-dark text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange sm:text-sm transition-all"
                        placeholder="Buscar por atleta, evento ou equipe..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="md:hidden flex items-center px-4 py-3 border border-brand-red/20 rounded-lg text-sm font-bold font-heading uppercase tracking-wider text-gray-300 bg-brand-dark hover:bg-brand-dark/80 transition-colors w-full justify-center"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                </button>

                <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 w-full md:w-auto`}>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full pl-3 pr-10 py-3 text-base border-brand-red/20 bg-brand-dark text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-lg font-medium"
                    >
                        <option value="">Todas Categorias</option>
                        <option value="Pesos Pesados">Pesos Pesados</option>
                        <option value="Leve">Peso Leve</option>
                        <option value="Absoluto">Absoluto</option>
                    </select>

                    <select
                        value={modality}
                        onChange={(e) => setModality(e.target.value)}
                        className="block w-full pl-3 pr-10 py-3 text-base border-brand-red/20 bg-brand-dark text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-lg font-medium"
                    >
                        <option value="">Todas Modalidades</option>
                        <option value="MMA">MMA</option>
                        <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                        <option value="Muay Thai">Muay Thai</option>
                    </select>

                    <button
                        onClick={handleSearch}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white font-black font-heading uppercase italic tracking-widest rounded-lg hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all transform hover:-translate-y-0.5"
                    >
                        Buscar
                    </button>
                </div>
            </div>
        </div>
    );
}
