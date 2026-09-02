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
import { SellersView } from './views/SellersView';
import { SellerLoginView } from './views/SellerLoginView';
import { getSellers, getStoreProfile } from './lib/store';
import { Seller } from './types';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { loadStoreData, startRealTimeSync, getEmailBySlug } from './lib/firebase-sync';

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeSeller, setActiveSeller] = useState<Seller | null>(null);
  const [isSellerPortalMode, setIsSellerPortalMode] = useState(false);
  const [sellerPortalOwner, setSellerPortalOwner] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('products');
  const [profileVersion, setProfileVersion] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [resolvedSellerEmail, setResolvedSellerEmail] = useState<string | null>(null);

  // Helper to update the browser URL when logged in as admin/seller
  const updateAdminUrl = (email: string) => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      // If we are in catalog or seller portal view, keep those intact
      if (searchParams.get('view') === 'catalog' || searchParams.get('portal') === 'seller') {
        return;
      }
      const profile = getStoreProfile(email);
      const storeIdentifier = profile.slug || profile.shopName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || email.split('@')[0];
      
      const currentUrl = new URL(window.location.href);
      if (storeIdentifier && currentUrl.searchParams.get('loja') !== storeIdentifier) {
        currentUrl.searchParams.set('loja', storeIdentifier);
        window.history.replaceState({}, '', currentUrl.toString());
      }
    } catch (e) {
      console.error("Error updating admin URL:", e);
    }
  };

  // Helper to clean the URL back to clean initial URL on logout
  const cleanAdminUrl = () => {
    try {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('loja')) {
        currentUrl.searchParams.delete('loja');
        window.history.replaceState({}, '', currentUrl.toString());
      }
    } catch (e) {
      console.error("Error cleaning admin URL:", e);
    }
  };

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
    // 1. Detect if we are in seller portal mode from URL
    const searchParams = new URLSearchParams(window.location.search);
    const portal = searchParams.get('portal');
    const owner = searchParams.get('owner');
    if (portal === 'seller' && owner) {
      setIsSellerPortalMode(true);
      setSellerPortalOwner(owner);
    }

    // 2. Check for a saved seller session
    const savedSession = localStorage.getItem('vitrine_pay_seller_session');
    if (savedSession) {
      try {
        const { ownerEmail, sellerId } = JSON.parse(savedSession);
        const sellers = getSellers(ownerEmail);
        const matched = sellers.find(s => s.id === sellerId);
        if (matched) {
          setUserEmail(ownerEmail);
          setActiveSeller(matched);
          setLoadingAuth(false);
          const loadData = async () => {
            setLoadingData(true);
            await loadStoreData(ownerEmail);
            setLoadingData(false);
          };
          loadData();
          return;
        }
      } catch (e) {
        console.error("Error restoring seller session:", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we are restoring or already have a seller logged in, don't overwrite it
      if (localStorage.getItem('vitrine_pay_seller_session')) {
        return;
      }

      if (user && user.email) {
        setUserEmail(user.email);
        if (!isCatalogMode) {
          setLoadingData(true);
          await loadStoreData(user.email);
          setLoadingData(false);
        }
      } else {
        setUserEmail(null);
        setActiveSeller(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [isCatalogMode]);

  useEffect(() => {
    if (!userEmail || isCatalogMode) return;

    // Update URL to match store name / slug
    updateAdminUrl(userEmail);

    const unsubscribe = startRealTimeSync(userEmail, () => {
      // Notify all views to refresh their local states
      window.dispatchEvent(new Event('vitrine_pay_data_synced'));
    });

    return () => unsubscribe();
  }, [userEmail, isCatalogMode, profileVersion]);

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
    if (isSellerPortalMode && sellerPortalOwner) {
      return (
        <SellerLoginView
          ownerId={sellerPortalOwner}
          onLoginSuccess={async (ownerEmail, seller) => {
            setUserEmail(ownerEmail);
            setActiveSeller(seller);
            setLoadingData(true);
            await loadStoreData(ownerEmail);
            updateAdminUrl(ownerEmail);
            setLoadingData(false);
          }}
          onBackToOwnerLogin={() => {
            setIsSellerPortalMode(false);
            // Remove from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('portal');
            url.searchParams.delete('owner');
            window.history.pushState({}, '', url.toString());
          }}
        />
      );
    }
    return (
      <LoginView
        onLogin={(email) => {
          setUserEmail(email);
          updateAdminUrl(email);
        }}
      />
    );
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem('vitrine_pay_seller_session');
      setActiveSeller(null);
      cleanAdminUrl();
      await signOut(auth);
      setUserEmail(null);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const renderView = () => {
    switch (currentTab) {
      case 'products':
        return <ProductsView userEmail={userEmail} activeSeller={activeSeller} />;
      case 'clients':
        return <ClientsView userEmail={userEmail} onNavigate={setCurrentTab} activeSeller={activeSeller} />;
      case 'orders':
        return <OrdersView userEmail={userEmail} onNavigate={setCurrentTab} activeSeller={activeSeller} />;
      case 'agenda':
        return <AgendaView userEmail={userEmail} activeSeller={activeSeller} />;
      case 'indicators':
        return <IndicatorsView userEmail={userEmail} activeSeller={activeSeller} />;
      case 'portal':
        return <PortalView userEmail={userEmail} />;
      case 'profile':
        return <ProfileView userEmail={userEmail} onProfileSave={() => setProfileVersion(v => v + 1)} />;
      case 'settings':
        return <SettingsView userEmail={userEmail} />;
      case 'sellers':
        return <SellersView userEmail={userEmail} />;
      default:
        return <ProductsView userEmail={userEmail} activeSeller={activeSeller} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <TopBar userEmail={userEmail} onLogout={handleLogout} profileVersion={profileVersion} />
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        userEmail={userEmail} 
        onLogout={handleLogout} 
        profileVersion={profileVersion} 
        activeSeller={activeSeller}
      />
      
      <main className="flex-1 mt-14 md:mt-0 md:ml-56 p-edge_margin max-w-7xl mx-auto w-full pb-20 md:pb-8">
        {renderView()}
      </main>
      <BottomNav 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        activeSeller={activeSeller}
        userEmail={userEmail}
      />
    </div>
  );
}


