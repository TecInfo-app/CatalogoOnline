import { UserCircle, Search, Menu, LogOut } from 'lucide-react';
import { getStoreProfile } from '../../lib/store';
import logoImg from '../../assets/logo.png';

interface TopBarProps {
  userEmail?: string;
  onLogout?: () => void;
  profileVersion?: number;
}

export function TopBar({ userEmail, onLogout, profileVersion }: TopBarProps) {
  const profile = userEmail ? getStoreProfile(userEmail) : null;
  const shopName = profile?.shopName || 'Vitrine Pay';
  const logoUrl = profile?.logoUrl;

  return (
    <header className="md:hidden flex justify-between items-center px-edge_margin h-14 w-full fixed top-0 z-50 bg-primary shadow-md transition-colors duration-200">
      <div className="flex items-center gap-2 text-on-primary min-w-0">
        <Menu size={24} className="md:hidden mr-1 shrink-0" />
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={shopName} 
            className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <img 
            src={logoImg}
            alt={shopName}
            className="w-6 h-6 object-contain shrink-0" 
            style={{
              filter: "brightness(0) invert(1)"
            }}
          />
        )}
        <span className="text-headline-sm font-bold ml-1 truncate">{shopName}</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-on-primary/90 hover:bg-primary-container/20 p-2 rounded-full transition-colors">
          <Search size={20} />
        </button>
        {onLogout && (
          <button onClick={onLogout} className="text-on-primary/90 hover:bg-error hover:text-white p-2 rounded-full transition-colors" title="Sair">
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
