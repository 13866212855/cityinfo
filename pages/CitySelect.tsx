import React, { useState, useEffect } from 'react';
import { api } from '../services/supabase';

interface CitySelectProps {
    currentCity: string;
    onSelect: (city: string) => void;
    onBack: () => void;
}

const CitySelect: React.FC<CitySelectProps> = ({ currentCity, onSelect, onBack }) => {
    // Selection State
    const [path, setPath] = useState<string[]>([]); // e.g. ['安徽省', '阜阳市']
    
    // Data State
    const [locationData, setLocationData] = useState<Record<string, any>>({});
    const [popularCities, setPopularCities] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            const [loc, pop] = await Promise.all([
                api.getGlobalConfig('location_data'),
                api.getGlobalConfig('popular_cities')
            ]);
            
            if (loc) setLocationData(loc);
            if (pop) setPopularCities(pop);
            
            // Fallback if DB empty (Optional, strictly requested to move to DB, but for robustness)
            if (!loc && !pop) {
                // If totally empty, maybe show error or empty state. 
                // For smoother transition, we just leave them empty, 
                // assuming the migration script was run.
            }
            setIsLoading(false);
        };
        fetchConfig();
    }, []);

    // Derived state for current level data
    const getCurrentLevelData = () => {
        if (Object.keys(locationData).length === 0) return [];

        if (path.length === 0) return Object.keys(locationData); // Province List
        if (path.length === 1) return Object.keys(locationData[path[0]] || {}); // City List
        if (path.length === 2) return Object.keys(locationData[path[0]][path[1]] || {}); // District List
        if (path.length === 3) return locationData[path[0]][path[1]][path[2]] || []; // Town List
        return [];
    };

    const handleItemClick = (item: string) => {
        const nextPath = [...path, item];
        
        // If we reached the Town level (Level 4, index 3), or if data is missing for next level, finish selection
        // In this mock data structure, Town is the last level (path length becomes 4)
        if (path.length === 3) {
            onSelect(item); // Return just the town name (or you could return full path)
        } else {
            setPath(nextPath);
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        setPath(path.slice(0, index + 1));
    };

    const handleReset = () => {
        setPath([]);
    };

    const currentList = getCurrentLevelData();
    const isRoot = path.length === 0;

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <div className="p-4 flex items-center border-b border-gray-100 sticky top-0 bg-white z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center">
                    <i className="fa-solid fa-xmark text-gray-500 text-lg"></i>
                </button>
                <span className="font-bold text-lg flex-1 text-center pr-8">选择地区</span>
            </div>

            <div className="p-4">
                {/* Loading State */}
                {isLoading && (
                    <div className="py-20 text-center text-gray-400">
                        <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> 加载城市数据...
                    </div>
                )}

                {!isLoading && (
                    <>
                        {/* Current Selection / Breadcrumbs */}
                        <div className="mb-4">
                            <h3 className="text-xs text-gray-400 font-medium mb-2">当前位置</h3>
                            {isRoot ? (
                                <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-lg border border-blue-100">
                                    <i className="fa-solid fa-location-crosshairs"></i>
                                    <span className="font-bold">{currentCity}</span>
                                    <span className="text-xs ml-auto text-gray-400">已定位</span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span 
                                        onClick={handleReset} 
                                        className="text-gray-500 cursor-pointer hover:text-primary"
                                    >
                                        中国
                                    </span>
                                    {path.map((p, idx) => (
                                        <React.Fragment key={idx}>
                                            <span className="text-gray-300">/</span>
                                            <span 
                                                onClick={() => idx < path.length - 1 ? handleBreadcrumbClick(idx) : null}
                                                className={`cursor-pointer ${idx === path.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500 hover:text-primary'}`}
                                            >
                                                {p}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Popular Cities (Only show at root level) */}
                        {isRoot && popularCities.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs text-gray-400 font-medium mb-3">热门城市</h3>
                                <div className="grid grid-cols-4 gap-3">
                                    {popularCities.map(city => (
                                        <button
                                            key={city}
                                            onClick={() => onSelect(city)}
                                            className="py-2 rounded-lg text-sm bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100 truncate"
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selection List */}
                        <div>
                            <h3 className="text-xs text-gray-400 font-medium mb-3">
                                {path.length === 0 ? '选择省份/直辖市' : 
                                path.length === 1 ? '选择城市' : 
                                path.length === 2 ? '选择区/县' : '选择乡镇/街道'}
                            </h3>
                            <div className="flex flex-col">
                                {currentList.map(item => (
                                    <button 
                                        key={item} 
                                        onClick={() => handleItemClick(item)}
                                        className="border-b border-gray-50 py-3.5 flex items-center justify-between text-gray-700 active:bg-gray-50 text-left"
                                    >
                                        <span className="text-base">{item}</span>
                                        <i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
                                    </button>
                                ))}
                                {currentList.length === 0 && (
                                    <div className="py-10 text-center text-gray-400 text-sm">
                                        暂无下级数据
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CitySelect;