/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { ProductsView } from './views/ProductsView';
import { ClientsView } from './views/ClientsView';
import { OrdersView } from './views/OrdersView';
import { AgendaView } from './views/AgendaView';
import { IndicatorsView } from './views/IndicatorsView';
import { LoginView } from './views/LoginView';
import { PortalView } from './views/PortalView';
import { CustomerCatalogView } from './views/CustomerCatalogView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { loadStoreData, startRealTimeSync, getEmailBySlug } from './lib/firebase-sync';

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('products');
  const [profileVersion, setProfileVersion] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [resolvedSellerEmail, setResolvedSellerEmail] = useState<string | null>(null);

  // Check if we are in customer catalog mode
  const searchParams = new URLSearchParams(window.location.search);
  const isCatalogMode = searchParams.get('view') === 'catalog';
  const sellerParam = searchParams.get('seller');

  useEffect(() => {
    if (isCatalogMode && sellerParam) {
      const initCatalog = async () => {
        let emailToLoad = sellerParam;
        
        // If it's not a valid email, treat it as a friendly slug and resolve it
        if (sellerParam && !sellerParam.includes('@')) {
          const resolvedEmail = await getEmailBySlug(sellerParam);
          if (resolvedEmail) {
            emailToLoad = resolvedEmail;
          }
        }
        
        setResolvedSellerEmail(emailToLoad);
        await loadStoreData(emailToLoad, true);
        setCatalogLoaded(true);
      };
      
      initCatalog();
    }
  }, [isCatalogMode, sellerParam]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        if (!isCatalogMode) {
          setLoadingData(true);
          await loadStoreData(user.email);
          setLoadingData(false);
        }
      } else {
        setUserEmail(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [isCatalogMode]);

  // Listen to incoming orders/clients in real-time instantly when owner is logged in
  useEffect(() => {
    if (!userEmail || isCatalogMode) return;

    const unsubscribe = startRealTimeSync(userEmail, () => {
      // Notify all views to refresh their local states
      window.dispatchEvent(new Event('vercos_data_synced'));
    });

    return () => unsubscribe();
  }, [userEmail, isCatalogMode]);

  if (isCatalogMode && sellerParam) {
    if (!catalogLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    return <CustomerCatalogView sellerEmail={resolvedSellerEmail || sellerParam} />;
  }

  if (loadingAuth || loadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-slate-500 text-sm">{loadingData ? 'Carregando seus dados...' : 'Verificando login...'}</p>
      </div>
    );
  }

  if (!userEmail) {
    return <LoginView onLogin={(email) => setUserEmail(email)} />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserEmail(null);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const renderView = () => {
    switch (currentTab) {
      case 'products':
        return <ProductsView userEmail={userEmail} />;
      case 'clients':
        return <ClientsView userEmail={userEmail} onNavigate={setCurrentTab} />;
      case 'orders':
        return <OrdersView userEmail={userEmail} onNavigate={setCurrentTab} />;
      case 'agenda':
        return <AgendaView userEmail={userEmail} />;
      case 'indicators':
        return <IndicatorsView userEmail={userEmail} />;
      case 'portal':
        return <PortalView userEmail={userEmail} />;
      case 'profile':
        return <ProfileView userEmail={userEmail} onProfileSave={() => setProfileVersion(v => v + 1)} />;
      case 'settings':
        return <SettingsView userEmail={userEmail} />;
      default:
        return <ProductsView userEmail={userEmail} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <TopBar userEmail={userEmail} onLogout={handleLogout} profileVersion={profileVersion} />
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} userEmail={userEmail} onLogout={handleLogout} profileVersion={profileVersion} />
      
      <main className="flex-1 mt-14 md:mt-0 md:ml-56 p-edge_margin max-w-7xl mx-auto w-full pb-20 md:pb-8">
        {renderView()}
      </main>
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}


