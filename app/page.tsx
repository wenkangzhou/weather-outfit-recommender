'use client';

import { useState } from 'react';
import { Shirt, User } from 'lucide-react';
import OutfitTab from '@/components/OutfitTab';
import SettingsTab from '@/components/SettingsTab';

type Tab = 'outfit' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('outfit');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
          <h1 className="text-xl font-bold text-center">今日穿搭</h1>
          <p className="text-center text-primary-100 text-sm">基于天气的智能推荐</p>
        </header>

        {/* Tab Content */}
        <div className="pb-20">
          {activeTab === 'outfit' ? <OutfitTab /> : <SettingsTab />}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex">
          <button
            onClick={() => setActiveTab('outfit')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'outfit'
                ? 'text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Shirt size={24} />
            <span className="text-xs">今日穿搭</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'settings'
                ? 'text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <User size={24} />
            <span className="text-xs">我的</span>
          </button>
        </nav>
      </div>
    </main>
  );
}
