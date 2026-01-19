
import React from 'react';
import { AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: AppTab.PRODUCT_STUDIO, label: 'Product Studio', icon: '📸' },
    { id: AppTab.MODEL_STUDIO, label: 'Model Studio', icon: '👤' },
    { id: AppTab.TRY_ON, label: 'Virtual Try-On', icon: '👗' },
    { id: AppTab.BATCH_STUDIO, label: 'Sequence Mode', icon: '⚡' },
    { id: AppTab.GALLERY, label: 'Asset Gallery', icon: '🖼️' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col sticky top-0 h-auto md:h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            E-Com Studio
          </h1>
          <p className="text-xs text-slate-500 font-medium">POWERED BY GEMINI AI</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-900 text-white p-4 rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Status</p>
            <p className="text-sm mt-1">Ready for Studio</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
