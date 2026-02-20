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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="Buscar por atleta, evento ou equipe..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="md:hidden flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                </button>

                <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 w-full md:w-auto`}>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                    >
                        <option value="">Todas Categorias</option>
                        <option value="Pesos Pesados">Pesos Pesados</option>
                        <option value="Leve">Peso Leve</option>
                        <option value="Absoluto">Absoluto</option>
                    </select>

                    <select
                        value={modality}
                        onChange={(e) => setModality(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                    >
                        <option value="">Todas Modalidades</option>
                        <option value="MMA">MMA</option>
                        <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                        <option value="Muay Thai">Muay Thai</option>
                    </select>

                    <button
                        onClick={handleSearch}
                        className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Buscar
                    </button>
                </div>
            </div>
        </div>
    );
}
