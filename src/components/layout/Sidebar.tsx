import { BarChart2, ShoppingCart, Users, Package, Network, ClipboardList, UserCircle, Settings, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStoreProfile } from '../../lib/store';
import { Seller } from '../../types';
import logoImg from '../../assets/shop-logo.png';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userEmail?: string;
  onLogout?: () => void;
  profileVersion?: number;
  activeSeller?: Seller | null;
}

export function Sidebar({ currentTab, onTabChange, userEmail, onLogout, profileVersion, activeSeller }: SidebarProps) {
  const profile = userEmail ? getStoreProfile(userEmail) : null;
  const shopName = profile?.shopName || 'Vitrine Pay';
  
  // Custom display name/role if seller is logged in
  const userName = activeSeller 
    ? activeSeller.name 
    : (profile?.name || userEmail?.split('@')[0] || 'Iranildo');
    
  const userDisplayEmail = activeSeller 
    ? `${activeSeller.role} - Portal` 
    : (profile?.email || userEmail || 'iranildo.jobs@gmail.com');
    
  const logoUrl = profile?.logoUrl;

  const baseTabs = [
    { id: 'indicators', label: 'Indicadores', icon: BarChart2 },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'portal', label: 'Portal', icon: Network },
    { id: 'agenda', label: 'Tarefas', icon: ClipboardList },
    { id: 'sellers', label: 'Vendedores', icon: UserCheck },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  // Dynamic filter based on activeSeller permissions
  let tabs = baseTabs;
  if (activeSeller) {
    if (activeSeller.role === 'Comum') {
      tabs = baseTabs.filter(tab => {
        // Hide management tabs for Comum sellers
        if (tab.id === 'sellers' || tab.id === 'settings' || tab.id === 'portal' || tab.id === 'profile') return false;
        
        // Check indicators permission
        if (tab.id === 'indicators') {
          return activeSeller.permissions.permitirAcessoRelatorioComissoes;
        }
        return true;
      });
    } else if (activeSeller.role === 'Administrador') {
      // Admin sellers can see most things but we still keep profile/sellers/settings to the main owner for safety, or let them see depending on standard practices. Let's hide sellers and settings to prevent other sellers configuration change.
      tabs = baseTabs.filter(tab => tab.id !== 'sellers' && tab.id !== 'settings' && tab.id !== 'profile');
    }
  }

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
              className="h-8 w-auto object-contain shrink-0" 
            />
          )}
          <span className="truncate">{shopName}</span>
        </h1>
        {/* User Info Capsule */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mt-2">
          <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
          <p className="text-[10px] text-slate-400 font-medium truncate">{userDisplayEmail}</p>
        </div>
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

