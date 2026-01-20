
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
    { id: AppTab.GALLERY, label: 'Asset Gallery', icon: '🖼️' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col sticky top-0 h-auto md:h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            E-Com Studio
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Studio Ready AI</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-900 text-white p-4 rounded-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Engine Status</p>
            </div>
            <p className="text-sm mt-1 font-medium">Gemini 2.5 Active</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
