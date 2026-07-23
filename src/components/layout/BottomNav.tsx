import { useState } from 'react';
import { BarChart2, Receipt, Users, Package, Menu, CalendarDays, Network, UserCircle, Settings, X, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Seller } from '../../types';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeSeller?: Seller | null;
}

export function BottomNav({ currentTab, onTabChange, activeSeller }: BottomNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamic tabs based on user permissions
  let tabs = [
    { id: 'indicators', label: 'Indicadores', icon: BarChart2 },
    { id: 'orders', label: 'Pedidos', icon: Receipt },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
    { id: 'more', label: 'Mais', icon: Menu },
  ];

  if (activeSeller && activeSeller.role === 'Comum' && !activeSeller.permissions.permitirAcessoRelatorioComissoes) {
    // If indicators are hidden, swap with Products tab as a top-level choice
    tabs = [
      { id: 'products', label: 'Produtos', icon: Package },
      { id: 'orders', label: 'Pedidos', icon: Receipt },
      { id: 'clients', label: 'Clientes', icon: Users },
      { id: 'agenda', label: 'Agenda', icon: CalendarDays },
      { id: 'more', label: 'Mais', icon: Menu },
    ];
  }

  // Dynamic options inside the 'Mais' drawer
  let moreOptions = [
    { id: 'indicators', label: 'Indicadores', icon: BarChart2 },
    { id: 'orders', label: 'Pedidos', icon: Receipt },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'portal', label: 'Portal', icon: Network },
    { id: 'agenda', label: 'Tarefas / Agenda', icon: CalendarDays },
    { id: 'sellers', label: 'Vendedores', icon: UserCheck },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (activeSeller) {
    if (activeSeller.role === 'Comum') {
      moreOptions = moreOptions.filter(tab => {
        if (tab.id === 'sellers' || tab.id === 'settings' || tab.id === 'portal' || tab.id === 'profile') return false;
        if (tab.id === 'indicators') return activeSeller.permissions.permitirAcessoRelatorioComissoes;
        return true;
      });
    } else if (activeSeller.role === 'Administrador') {
      // Admin sellers can access everything except direct seller management/settings/profile of the primary store owner
      moreOptions = moreOptions.filter(tab => tab.id !== 'sellers' && tab.id !== 'settings' && tab.id !== 'profile');
    }
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 h-16 bg-surface-container-lowest border-t border-outline-variant shadow-lg pb-safe">
        {tabs.map((tab) => {
          let tabId = tab.id;
          let tabLabel = tab.label;
          let TabIcon = tab.icon;
          
          // Swap logic if we didn't filter out indicators but current view is products
          if (tabId === 'agenda' && currentTab === 'products' && (!activeSeller || activeSeller.role !== 'Comum' || activeSeller.permissions.permitirAcessoRelatorioComissoes)) {
            tabId = 'products';
            tabLabel = 'Produtos';
            TabIcon = Package;
          }

          const isActive = currentTab === tabId || (tab.id === 'more' && isMenuOpen);

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'more') {
                  setIsMenuOpen(!isMenuOpen);
                } else {
                  onTabChange(tabId);
                  setIsMenuOpen(false);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center pt-1 w-full h-full rounded-lg transition-colors px-1 cursor-pointer",
                isActive 
                  ? "text-[#851b42] border-t-2 border-[#851b42] bg-[#851b42]/5" 
                  : "text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              <TabIcon size={20} className={cn("mb-1", isActive && "fill-current")} />
              <span className="text-[10px] leading-tight font-black">{tabLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Slide-up drawer for 'Mais' */}
      {isMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMenuOpen(false)} 
            className="fixed inset-0 bg-black/60 z-100 transition-opacity duration-200"
          />
          
          {/* Drawer Sheet */}
          <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl z-110 overflow-y-auto p-5 pb-10 flex flex-col gap-4 animate-in slide-in-from-bottom duration-250 border-t border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Menu size={18} className="text-[#851b42]" />
                <h3 className="text-sm font-black text-slate-800">Mais Opções</h3>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Grid of Tabs */}
            <div className="grid grid-cols-2 gap-3">
              {moreOptions.map((mTab) => {
                const isActive = currentTab === mTab.id;
                const MIcon = mTab.icon;
                return (
                  <button
                    key={mTab.id}
                    onClick={() => {
                      onTabChange(mTab.id);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-[#851b42]/10 border-[#851b42]/20 text-[#851b42] font-black"
                        : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      isActive ? "bg-[#851b42] text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      <MIcon size={16} />
                    </div>
                    <span className="text-xs font-black">{mTab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
