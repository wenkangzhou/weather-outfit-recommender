'use client';

interface SceneBadgeProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

export default function SceneBadge({ active, onClick, icon, label }: SceneBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
        active 
          ? 'bg-white text-gray-900 shadow-lg scale-[1.02]' 
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className={`font-medium ${active ? 'text-gray-900' : 'text-white'}`}>
        {label}
      </span>
    </button>
  );
}
