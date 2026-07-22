import { BarChart2, ShoppingCart, Users, Package, Network, ClipboardList, UserCircle, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStoreProfile } from '../../lib/store';
import logoImg from '../../assets/logo.png';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userEmail?: string;
  onLogout?: () => void;
  profileVersion?: number;
}

export function Sidebar({ currentTab, onTabChange, userEmail, onLogout, profileVersion }: SidebarProps) {
  const profile = userEmail ? getStoreProfile(userEmail) : null;
  const shopName = profile?.shopName || 'Vitrine Pay';
  const userName = profile?.name || userEmail?.split('@')[0] || 'Iranildo';
  const userDisplayEmail = profile?.email || userEmail || 'iranildo.jobs@gmail.com';
  const logoUrl = profile?.logoUrl;

  const tabs = [
    { id: 'indicators', label: 'Indicadores', icon: BarChart2 },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'portal', label: 'Portal', icon: Network },
    { id: 'agenda', label: 'Tarefas', icon: ClipboardList },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <nav className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col py-lg bg-surface h-full w-56 border-r border-outline-variant shadow-xl mt-14 md:mt-0">
      <div className="px-4 mb-6 pt-4 md:pt-0">
        <h1 className="text-headline-md font-bold text-primary mb-4 hidden md:block flex items-center gap-2">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={shopName} 
              className="w-8 h-8 rounded-full object-cover border border-outline-variant"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src={logoImg}
              alt={shopName}
              className="w-8 h-8 object-contain shrink-0" 
              style={{
                filter: "brightness(0) saturate(100%) invert(18%) sepia(87%) saturate(2258%) hue-rotate(317deg) brightness(91%) contrast(98%)"
              }}
            />
          )}
          <span className="truncate">{shopName}</span>
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 space-y-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center w-full gap-3 px-3.5 py-2.5 rounded-full transition-all",
                isActive 
                  ? "bg-primary-container text-on-primary-container font-semibold translate-x-0.5" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <Icon size={18} className={cn(isActive && "fill-current", "shrink-0")} />
              <span className="text-body-md truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div className="px-4 mt-auto pb-4 flex items-center justify-between">
        <span className="text-body-sm text-on-surface-variant">v4.2.0</span>
        {onLogout && (
          <button onClick={onLogout} className="text-body-sm text-error hover:underline transition-colors">
            Sair
          </button>
        )}
      </div>
    </nav>
  );
}
