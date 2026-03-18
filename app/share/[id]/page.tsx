'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OutfitRecommendation, WeatherData } from '@/types';
import { Cloud, Wind, Droplets, MapPin, ArrowRight } from 'lucide-react';

interface ShareData {
  outfit: OutfitRecommendation;
  weather: WeatherData;
  location: string;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    
    // 从 localStorage 读取分享数据
    const stored = localStorage.getItem(`share_${id}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setShareData(data);
      } catch (e) {
        console.error('Failed to parse share data:', e);
      }
    }
    setLoading(false);
  }, [params.id]);

  const handleViewMyCity = () => {
    // 清除可能存在的旧天气数据，让用户重新定位
    localStorage.removeItem('weather_data');
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </main>
    );
  }

  if (!shareData) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-5 py-20 text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-xl font-semibold mb-2">分享已过期</h1>
          <p className="text-muted-foreground mb-6">这套穿搭分享链接已失效，来生成你自己的穿搭吧</p>
          <Button onClick={() => router.push('/')} className="w-full">
            去首页看看
          </Button>
        </div>
      </main>
    );
  }

  const { outfit, weather, location } = shareData;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm text-primary mb-3">
            <MapPin size={14} />
            朋友分享的穿搭
          </div>
          <h1 className="text-2xl font-bold">
            {location} · {Math.round(weather.temp)}°C
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* 穿搭卡片 */}
        <Card className="overflow-hidden mb-6">
          {/* 天气信息 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud size={32} />
                <div>
                  <div className="text-3xl font-bold">{Math.round(weather.temp)}°</div>
                  <div className="text-blue-100 text-sm">体感 {Math.round(weather.feelsLike)}°</div>
                </div>
              </div>
              <div className="text-right text-sm text-blue-100 space-y-1">
                <div className="flex items-center gap-1">
                  <Wind size={14} />
                  {weather.windSpeed}m/s
                </div>
                <div className="flex items-center gap-1">
                  <Droplets size={14} />
                  {weather.humidity}%
                </div>
              </div>
            </div>
          </div>

          {/* 穿搭详情 */}
          <div className="p-5 space-y-4">
            {/* 场景标签 */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {outfit.outfit.scene === 'commute' ? '🚶 通勤' : '🏃 跑步'}
              </span>
              {outfit.reasoningData && (
                <span className="text-xs text-muted-foreground">
                  目标 {outfit.reasoningData.targetTemp}°C
                </span>
              )}
            </div>

            {/* 衣物列表 */}
            <div className="space-y-3">
              <OutfitItem label="上衣" item={outfit.outfit.top} />
              {outfit.layeredTops && outfit.layeredTops.length > 0 && (
                <>
                  {outfit.layeredTops.slice(1).map((item, i) => (
                    <OutfitItem key={i} label={`叠穿 ${i + 2}`} item={item} />
                  ))}
                </>
              )}
              <OutfitItem label="下装" item={outfit.outfit.bottom} />
              <OutfitItem label="袜子" item={outfit.outfit.socks} />
              <OutfitItem label="鞋子" item={outfit.outfit.shoes} />
              {outfit.outfit.hat && (
                <OutfitItem label="帽子" item={outfit.outfit.hat} />
              )}
            </div>

            {/* 推荐理由 */}
            {outfit.reasoning && (
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">{outfit.reasoning}</p>
              </div>
            )}
          </div>
        </Card>

        {/* CTA 按钮 */}
        <div className="space-y-3">
          <Button onClick={handleViewMyCity} className="w-full" size="lg">
            <MapPin size={18} className="mr-2" />
            查看我的城市穿搭
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full">
            去首页看看
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Weather Style · 智能穿搭推荐
        </div>
      </div>
    </main>
  );
}

function OutfitItem({ label, item }: { label: string; item: { name: string; color?: string; imageUrl?: string } }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: item.color || '#ccc' }} />
        )}
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{item.name}</div>
      </div>
    </div>
  );
}
