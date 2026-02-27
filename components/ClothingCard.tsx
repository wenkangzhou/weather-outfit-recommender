'use client';

import { ClothingItem } from '@/types';
import { Card } from '@/components/ui/card';

interface ClothingCardProps {
  item: ClothingItem;
  label: string;
  onReplace: () => void;
}

export default function ClothingCard({ item, label, onReplace }: ClothingCardProps) {
  const getIcon = () => {
    switch (item.category) {
      case 'top': return '👕';
      case 'bottom': return '👖';
      case 'socks': return '🧦';
      case 'shoes': return '👟';
      default: return '👔';
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
      <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
        {getIcon()}
      </div>
      <div className="p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
          {label}
        </div>
        <div className="font-medium text-sm truncate">
          {item.name}
        </div>
        <button
          onClick={onReplace}
          className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
        >
          更换
        </button>
      </div>
    </Card>
  );
}
