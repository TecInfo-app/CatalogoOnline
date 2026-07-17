import { BarChart2, Receipt, Users, Package, Menu, CalendarDays } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  // Mobile uses slightly different icons/labels sometimes, but we'll stick closely to the provided screens.
  // We'll define a mapping based on the active tab context if needed, but here's a generic one.
  const tabs = [
    { id: 'indicators', label: 'Indicadores', icon: BarChart2 },
    { id: 'orders', label: 'Pedidos', icon: Receipt },
    { id: 'clients', label: 'Clientes', icon: Users },
    // Depending on the screen, the 4th item varies. In Agenda it's Agenda, in Products it's Products.
    // Let's use a dynamic approach or just include the top 4 and 'Mais'
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
    { id: 'more', label: 'Mais', icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 h-16 bg-surface-container-lowest border-t border-outline-variant shadow-lg pb-safe">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;
        
        // If we are on products tab, let's swap agenda for products dynamically to match screens
        if (tab.id === 'agenda' && currentTab === 'products') {
          tab.id = 'products';
          tab.label = 'Produtos';
          tab.icon = Package;
        }

        return (
          <button
            key={tab.id}
            onClick={() => tab.id !== 'more' && onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center pt-1 w-full h-full rounded-lg transition-colors px-1",
              isActive 
                ? "text-primary border-t-2 border-primary bg-surface-container-low" 
                : "text-on-surface-variant hover:bg-surface-container-low"
            )}
          >
            <Icon size={20} className={cn("mb-1", isActive && "fill-current")} />
            <span className="text-[10px] leading-tight font-body-sm">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
