'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OutfitRecommendation, WeatherData } from '@/types';
import { getOutfitShare } from '@/lib/supabase';
import { Cloud, Wind, Droplets, MapPin, ArrowRight } from 'lucide-react';
import '@/i18n';

interface ShareData {
  outfit: OutfitRecommendation;
  weather: WeatherData;
  location: string;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShare = async () => {
      const id = params.id as string;
      
      // 从数据库获取分享数据
      const data = await getOutfitShare(id);
      console.log('[SharePage] Loaded from DB:', id, !!data);
      
      if (data) {
        setShareData({
          outfit: data.outfit,
          weather: data.weather,
          location: data.location,
          createdAt: data.createdAt,
        });
      }
      setLoading(false);
    };
    
    loadShare();
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
          <h1 className="text-xl font-semibold mb-2">{t('share.expired')}</h1>
          <p className="text-muted-foreground mb-6">{t('share.expiredDesc')}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            {t('share.goHome')}
          </Button>
        </div>
      </main>
    );
  }

  const { outfit, weather, location } = shareData;
  const isZh = i18n.language === 'zh';

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-8">
        {/* 朋友分享的标签 */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm text-primary">
            <MapPin size={14} />
            {t('share.fromFriend')}
          </div>
        </div>

        {/* 穿搭卡片 */}
        <Card className="overflow-hidden mb-6">
          {/* 天气信息 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4">
            {/* 城市和日期 */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{location}</span>
              <span className="text-blue-100 text-sm">
                {new Date().toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud size={32} />
                <div>
                  <div className="text-3xl font-bold">{Math.round(weather.temp)}°</div>
                  <div className="text-blue-100 text-sm">{t('weather.feelsLike')} {Math.round(weather.feelsLike)}°</div>
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
                {outfit.outfit.scene === 'commute' ? `🚶 ${t('scene.commute')}` : `🏃 ${t('scene.running')}`}
              </span>
              {outfit.reasoningData && (
                <span className="text-xs text-muted-foreground">
                  {t('outfit.reasoning.target', { 
                    scene: outfit.outfit.scene === 'commute' ? t('scene.commute') : t('scene.running'),
                    temp: outfit.reasoningData.targetTemp 
                  })}
                </span>
              )}
            </div>

            {/* 衣物列表 */}
            <div className="space-y-3">
              <OutfitItem label={t('clothing.top')} item={outfit.outfit.top} icon="👕" />
              {outfit.layeredTops && outfit.layeredTops.length > 0 && (
                <>
                  {outfit.layeredTops.slice(1).map((item, i) => (
                    <OutfitItem key={i} label={`${t('outfit.layer')} ${i + 2}`} item={item} icon="👔" />
                  ))}
                </>
              )}
              <OutfitItem label={t('clothing.bottom')} item={outfit.outfit.bottom} icon="👖" />
              <OutfitItem label={t('clothing.socks')} item={outfit.outfit.socks} icon="🧦" />
              <OutfitItem label={t('clothing.shoes')} item={outfit.outfit.shoes} icon="👟" />
              {outfit.outfit.hat && (
                <OutfitItem label={t('clothing.hat')} item={outfit.outfit.hat} icon="🧢" />
              )}
            </div>

            {/* 推荐理由 - 使用 reasoningData 组装多语言文本 */}
            {outfit.reasoningData && (
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const data = outfit.reasoningData!;
                    const parts: string[] = [];
                    
                    // 层数信息
                    if (data.layerCount && data.layerTypes) {
                      const layerNames: Record<string, string> = {
                        base: t('outfit.reasoning.layerBase'),
                        mid: t('outfit.reasoning.layerMid'),
                        outer: t('outfit.reasoning.layerOuter')
                      };
                      const layerDesc = data.layerTypes.map((t: string) => layerNames[t] || t).join('+');
                      parts.push(`${data.layerCount}${isZh ? '层' : ' layers'}(${layerDesc})`);
                    }
                    
                    // 保暖覆盖率
                    if (data.coverage !== undefined) {
                      parts.push(t('outfit.reasoning.coverage', { coverage: data.coverage }));
                    }
                    
                    // 场景和目标温度
                    const sceneLabel = data.scene === 'commute' 
                      ? t('scene.commute')
                      : data.runType 
                        ? t(`runType.${data.runType}`)
                        : t('scene.running');
                    parts.push(t('outfit.reasoning.target', { scene: sceneLabel, temp: data.targetTemp }));
                    
                    // 雨天提示
                    if (data.isRaining) {
                      parts.push(t('outfit.reasoning.rain'));
                    }
                    
                    return parts.join(' · ');
                  })()}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* CTA 按钮 */}
        <div className="space-y-3">
          <Button onClick={handleViewMyCity} className="w-full" size="lg">
            <MapPin size={18} className="mr-2" />
            {t('share.viewMyCity')}
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full">
            {t('share.goHome')}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Weather Style · {isZh ? '智能穿搭推荐' : 'Smart Outfit Recommender'}
        </div>
      </div>
    </main>
  );
}

function OutfitItem({ label, item, icon }: { label: string; item: { name: string; color?: string; imageUrl?: string }; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden text-lg"
        style={{ 
          backgroundColor: item.color && item.color.startsWith('#') ? item.color : '#f1f5f9'
        }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{item.name}</div>
      </div>
    </div>
  );
}
