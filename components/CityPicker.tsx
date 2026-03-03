'use client';

import { useState, useMemo } from 'react';
import { MapPin, Search, X, ChevronRight, Navigation } from 'lucide-react';
import { CHINA_CITIES, HOT_CITIES, searchCities, Province, City } from '@/lib/cities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CityPickerProps {
  currentCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}

type ViewMode = 'list' | 'provinces' | 'cities';

export default function CityPicker({ currentCity, onSelect, onClose }: CityPickerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const searchResults = useMemo(() => {
    return searchCities(searchKeyword);
  }, [searchKeyword]);

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setViewMode('cities');
  };

  const handleCitySelect = (city: City) => {
    onSelect(city.name);
    onClose();
  };

  const handleLocate = () => {
    // 使用浏览器定位
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // 这里可以通过经纬度反查城市，简化处理先返回上海
          // 实际项目中可以调用高德/百度地图的逆地理编码API
          onSelect('上海');
          onClose();
        },
        () => {
          // 定位失败，默认上海
          onSelect('上海');
          onClose();
        }
      );
    } else {
      onSelect('上海');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 animate-fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-4 px-5 flex items-center gap-4 shrink-0">
          {viewMode === 'cities' ? (
            <Button variant="ghost" size="icon" onClick={() => setViewMode('provinces')} className="rounded-full">
              <ChevronRight className="rotate-180" size={20} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X size={20} />
            </Button>
          )}
          <h1 className="text-lg font-semibold">
            {viewMode === 'cities' ? selectedProvince?.name : '选择城市'}
          </h1>
        </header>

        {/* Search Bar - only show in list mode */}
        {viewMode === 'list' && (
          <div className="px-5 pb-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索城市"
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {viewMode === 'list' && !searchKeyword && (
            <div className="space-y-6">
              {/* Current Location */}
              <section>
                <button
                  onClick={handleLocate}
                  className="w-full flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-primary"
                >
                  <Navigation size={20} />
                  <span className="font-medium">定位到当前位置</span>
                </button>
              </section>

              {/* Current City */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">当前城市</h3>
                <button
                  onClick={() => onSelect(currentCity)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium"
                >
                  <MapPin size={16} />
                  {currentCity}
                </button>
              </section>

              {/* Hot Cities */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">热门城市</h3>
                <div className="flex flex-wrap gap-2">
                  {HOT_CITIES.map(city => (
                    <button
                      key={city.code}
                      onClick={() => handleCitySelect(city)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        currentCity === city.name
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* All Provinces Button */}
              <section>
                <button
                  onClick={() => setViewMode('provinces')}
                  className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors"
                >
                  <span className="font-medium">按省份选择</span>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              </section>
            </div>
          )}

          {viewMode === 'list' && searchKeyword && (
            <div className="space-y-2">
              {searchResults.length > 0 ? (
                searchResults.map(city => (
                  <button
                    key={city.code}
                    onClick={() => handleCitySelect(city)}
                    className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{city.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {(city as any).provinceName || ''}
                      </span>
                    </div>
                    {currentCity === city.name && (
                      <span className="text-xs text-primary">当前</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  未找到城市
                </div>
              )}
            </div>
          )}

          {viewMode === 'provinces' && (
            <div className="grid grid-cols-3 gap-3">
              {CHINA_CITIES.map(province => (
                <button
                  key={province.code}
                  onClick={() => handleProvinceSelect(province)}
                  className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-center"
                >
                  <span className="text-sm font-medium">{province.name}</span>
                </button>
              ))}
            </div>
          )}

          {viewMode === 'cities' && selectedProvince && (
            <div className="grid grid-cols-3 gap-3">
              {selectedProvince.cities.map(city => (
                <button
                  key={city.code}
                  onClick={() => handleCitySelect(city)}
                  className={`p-4 rounded-xl text-center transition-colors ${
                    currentCity === city.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border hover:bg-accent'
                  }`}
                >
                  <span className="text-sm font-medium">{city.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
