import { useState, useEffect, FormEvent } from 'react';
import { 
  Users, User, Plus, Edit2, Trash2, Copy, Check, ExternalLink, 
  Lock, Unlock, Info, Shield, Building2, Eye, HelpCircle, Save, X, Phone, Mail, Award, CheckSquare, Square, Radio, FileText, CheckCircle2,
  LayoutGrid, List, Trophy, TrendingUp, BarChart3, Medal, DollarSign, ShoppingBag
} from 'lucide-react';
import { getSellers, addSeller, updateSeller, deleteSeller, getStoreProfile, getOrders } from '../lib/store';
import { Seller, SellerPermissions, RepresentedItem, Order } from '../types';
import { cn } from '../lib/utils';

interface SellersViewProps {
  userEmail: string;
}

const defaultPermissions: SellerPermissions = {
  limitarAcessoClientes: false,
  permitirVincularTabelasPreco: false,
  permitirCadastrarClientes: true,
  permitirAlterarClientes: true,
  permitirCadastrarProdutos: false,
  permitirAlterarExcluirProdutos: false,
  permitirAlterarPedidoGerado: false,
  permitirAlterarStatusPedido: false,
  visualizarPedidosOutrosVendedores: true,
  permitirAcessoRelatorioComissoes: true,
  permitirDefinirMetas: false,
  permitirCadastrarAlterarTransportadoras: true,
  permitirCadastrarAlterarExcluirRoteiros: false,
};

export function SellersView({ userEmail }: SellersViewProps) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState<'sellers' | 'ranking'>('sellers');
  const [displayMode, setDisplayMode] = useState<'mosaico' | 'lista'>('mosaico');
  const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'Comum' | 'Administrador'>('Comum');
  const [permissions, setPermissions] = useState<SellerPermissions>({ ...defaultPermissions });
  const [representedList, setRepresentedList] = useState<RepresentedItem[]>([]);
  
  // Price Tables modal states
  const [showPriceTablesModal, setShowPriceTablesModal] = useState(false);
  const [selectedRepForTableModal, setSelectedRepForTableModal] = useState<string | null>(null);
  const [modalPriceTables, setModalPriceTables] = useState<string[]>([]);
  
  // Feedback states
  const [copiedSellerId, setCopiedSellerId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const storeProfile = getStoreProfile(userEmail);
  const shopName = storeProfile.shopName || 'perfumaria';

  useEffect(() => {
    loadSellersAndOrders();
    
    const handleSync = () => {
      loadSellersAndOrders();
    };

    window.addEventListener('vitrine_pay_data_synced', handleSync);
    return () => {
      window.removeEventListener('vitrine_pay_data_synced', handleSync);
    };
  }, [userEmail]);

  useEffect(() => {
    if (viewState === 'form') {
      setRepresentedList(prev => {
        if (prev.length === 0) {
          return [
            {
              id: 'rep-1',
              name: name || 'Nome do Vendedor',
              checked: true,
              commission: 5,
              maxDiscount: 10,
              maxMarkup: 20,
              saldoFlex: false,
              priceTables: 'Sem restrição'
            }
          ];
        }
        return prev.map((item, idx) => {
          if (idx === 0) {
            return { ...item, name: name || 'Nome do Vendedor' };
          }
          return item;
        });
      });
    }
  }, [name, viewState]);

  const loadSellersAndOrders = () => {
    const sellerData = getSellers(userEmail);
    const orderData = getOrders(userEmail);
    setSellers(sellerData);
    setOrders(orderData);
  };

  const getSellerPortalUrl = () => {
    const ownerId = storeProfile.slug || userEmail;
    const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
    return `${window.location.origin}${basePath}?portal=seller&owner=${encodeURIComponent(ownerId)}`;
  };

  const handleCreateNew = () => {
    setName('');
    setPhone('');
    setEmail('');
    setBio('');
    setRole('Comum');
    setPermissions({ ...defaultPermissions });
    
    // Initialize represented list with the current store profile shopName as default represented company
    const initialRepresented: RepresentedItem[] = [
      {
        id: 'rep-1',
        name: shopName,
        checked: true,
        commission: 5,
        maxDiscount: 10,
        maxMarkup: 20,
        saldoFlex: false,
        priceTables: 'Sem restrição'
      }
    ];
    setRepresentedList(initialRepresented);
    
    setCurrentSeller(null);
    setViewState('form');
  };

  const handleEdit = (seller: Seller) => {
    setCurrentSeller(seller);
    setName(seller.name);
    setPhone(seller.phone);
    setEmail(seller.email);
    setBio(seller.bio || '');
    setRole(seller.role);
    setPermissions({ ...defaultPermissions, ...seller.permissions });
    
    // Check if represented list is empty, initialize with shopName if so
    if (!seller.representedList || seller.representedList.length === 0) {
      setRepresentedList([
        {
          id: 'rep-1',
          name: shopName,
          checked: true,
          commission: 5,
          maxDiscount: 10,
          maxMarkup: 20,
          saldoFlex: false,
          priceTables: 'Sem restrição'
        }
      ]);
    } else {
      setRepresentedList(seller.representedList);
    }
    
    setViewState('form');
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Nome e E-mail são obrigatórios.');
      return;
    }

    const sellerData: Seller = {
      id: currentSeller ? currentSeller.id : `sel_${Math.random().toString(36).substr(2, 9)}`,
      name,
      phone,
      email,
      bio,
      role,
      permissions,
      representedList,
      avatarUrl: currentSeller?.avatarUrl || ''
    };

    if (currentSeller) {
      updateSeller(userEmail, sellerData);
    } else {
      addSeller(userEmail, sellerData);
    }

    loadSellersAndOrders();
    setViewState('list');
    setCurrentSeller(null);
  };

  const handleDelete = (id: string) => {
    deleteSeller(userEmail, id);
    setShowDeleteConfirm(null);
    loadSellersAndOrders();
  };

  const handleCopyPortalLink = (sellerEmail?: string, sellerPhone?: string) => {
    const url = getSellerPortalUrl();
    navigator.clipboard.writeText(url);
    const key = sellerEmail || 'portal_link';
    setCopiedSellerId(key);
    setTimeout(() => setCopiedSellerId(null), 2000);
  };

  const togglePermission = (key: keyof SellerPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRepresentedCheck = (id: string) => {
    setRepresentedList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    }));
  };

  const handleRepresentedChange = (id: string, field: keyof RepresentedItem, value: any) => {
    setRepresentedList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSavePriceTables = () => {
    if (selectedRepForTableModal) {
      const value = modalPriceTables.length === 0 || modalPriceTables.length === 4 
        ? 'Sem restrição' 
        : modalPriceTables.join(', ');
      handleRepresentedChange(selectedRepForTableModal, 'priceTables', value);
      setShowPriceTablesModal(false);
      setSelectedRepForTableModal(null);
    }
  };

  const activeSellersCount = sellers.length;

  return (
    <div className="animate-in fade-in duration-300 space-y-6 pb-20 md:pb-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[#851b42]">
            <Users size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Configurações de Equipe</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Gerenciamento de Vendedores</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cadastre vendedores, defina permissões personalizadas de acesso e comissões específicas por representada.
          </p>
        </div>
        
        {viewState === 'list' && (
          <button
            type="button"
            onClick={handleCreateNew}
            className="bg-[#851b42] hover:bg-[#5e132e] text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#851b42]/10"
          >
            <Plus size={15} /> Cadastrar Vendedor
          </button>
        )}
      </div>

      {viewState === 'list' ? (
        <div className="space-y-6">
          
          {/* TABS: CADASTROS DE VENDEDORES VS RANKING DE VENDEDORES */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('sellers')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 border",
                activeTab === 'sellers'
                  ? "bg-[#851b42] text-white border-[#851b42] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Users size={15} /> Cadastros ({sellers.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ranking')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 border",
                activeTab === 'ranking'
                  ? "bg-[#851b42] text-white border-[#851b42] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Trophy size={15} className={activeTab === 'ranking' ? "text-amber-300" : "text-amber-500"} /> Ranking de Vendedores & Comissões
            </button>
          </div>

          {activeTab === 'sellers' ? (
            <div className="space-y-6">
              {/* SELLER PORTAL QUICK INSTRUCTION */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 max-w-2xl">
                  <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Portal do Vendedor Integrado
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">Seus vendedores acessam a plataforma por um link exclusivo</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Cada vendedor cadastrado pode fazer login no portal utilizando apenas o <strong>E-mail</strong> e o <strong>Telefone/Celular</strong> cadastrados por você. Não precisam de senha. Ao entrar, o painel deles exibirá apenas os módulos que você permitir nas opções de segurança.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyPortalLink()}
                    className={cn(
                      "py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border",
                      copiedSellerId === 'portal_link'
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-800"
                    )}
                  >
                    {copiedSellerId === 'portal_link' ? (
                      <>
                        <Check size={14} /> Link Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar Link do Portal
                      </>
                    )}
                  </button>
                  <a
                    href={getSellerPortalUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    Testar Portal <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* VIEW MODE SELECTOR (MOSAICO VS LISTA) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 border border-slate-200/60 p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Exibição:</span>
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('mosaico')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer",
                        displayMode === 'mosaico'
                          ? "bg-[#851b42] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <LayoutGrid size={14} /> Mosaico
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('lista')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer",
                        displayMode === 'lista'
                          ? "bg-[#851b42] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <List size={14} /> Lista
                    </button>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-slate-500 pr-1">
                  {sellers.length} {sellers.length === 1 ? 'vendedor cadastrado' : 'vendedores cadastrados'}
                </span>
              </div>

              {/* SELLERS DISPLAY */}
              {sellers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center max-w-xl mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#851b42]/5 text-[#851b42] flex items-center justify-center">
                    <Users size={28} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold text-slate-800">Nenhum vendedor cadastrado</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Comece cadastrando seu primeiro vendedor para que ele possa utilizar a plataforma Vitrine Pay com as permissões que você definir.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="bg-[#851b42] hover:bg-[#5e132e] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Cadastrar Primeiro Vendedor
                  </button>
                </div>
              ) : displayMode === 'mosaico' ? (
                /* MOSAICO (GRID CARDS) MODE */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellers.map((seller) => (
                    <div key={seller.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Seller Photo Circle */}
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0 overflow-hidden font-black">
                          {seller.avatarUrl ? (
                            <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                          ) : (
                            seller.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Seller details */}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{seller.name}</h4>
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                              seller.role === 'Administrador' 
                                ? "bg-purple-100 text-purple-800" 
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {seller.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                            <Mail size={12} className="shrink-0" /> {seller.email}
                          </p>
                          {seller.phone && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                              <Phone size={12} className="shrink-0" /> {seller.phone}
                            </p>
                          )}
                          {seller.bio && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-1 bg-slate-50 p-1.5 rounded-md">
                              "{seller.bio}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions area */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Comissão: {seller.representedList?.[0]?.commission || 5}%
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyPortalLink(seller.email, seller.phone)}
                            className={cn(
                              "py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer",
                              copiedSellerId === seller.email
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-100"
                            )}
                            title="Copiar dados de acesso do portal"
                          >
                            {copiedSellerId === seller.email ? 'Acesso Copiado!' : 'Copiar Acesso'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(seller)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-[#851b42]/10 hover:text-[#851b42] text-slate-500 transition-colors border border-slate-100 cursor-pointer"
                            title="Editar vendedor"
                          >
                            <Edit2 size={13} />
                          </button>
                          
                          {showDeleteConfirm === seller.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-100">
                              <button
                                type="button"
                                onClick={() => handleDelete(seller.id)}
                                className="text-[9px] font-bold text-red-600 px-1.5 py-1 hover:bg-red-100 rounded"
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(null)}
                                className="text-[9px] font-bold text-slate-500 px-1.5 py-1 hover:bg-slate-100 rounded"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(seller.id)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors border border-slate-100 cursor-pointer"
                              title="Excluir vendedor"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LISTA (TABLE) MODE */
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-4">Vendedor</th>
                          <th className="py-3.5 px-4">Função</th>
                          <th className="py-3.5 px-4">E-mail</th>
                          <th className="py-3.5 px-4">Telefone</th>
                          <th className="py-3.5 px-4 text-center">Comissão</th>
                          <th className="py-3.5 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {sellers.map((seller) => {
                          const repCommission = seller.representedList?.[0]?.commission || 5;
                          return (
                            <tr key={seller.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-extrabold overflow-hidden shrink-0">
                                    {seller.avatarUrl ? (
                                      <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                                    ) : (
                                      seller.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-800 block">{seller.name}</span>
                                    {seller.bio && <span className="text-[10px] text-slate-400 italic block">{seller.bio}</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={cn(
                                  "text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block",
                                  seller.role === 'Administrador' ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"
                                )}>
                                  {seller.role}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-semibold">{seller.email}</td>
                              <td className="py-3.5 px-4 text-slate-600 font-semibold">{seller.phone || '-'}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-xs font-black text-[#851b42] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                                  {repCommission}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPortalLink(seller.email, seller.phone)}
                                    className={cn(
                                      "py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer",
                                      copiedSellerId === seller.email
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                                    )}
                                  >
                                    {copiedSellerId === seller.email ? 'Copiado!' : 'Copiar Acesso'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(seller)}
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-[#851b42]/10 hover:text-[#851b42] text-slate-500 transition-colors border border-slate-100 cursor-pointer"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  {showDeleteConfirm === seller.id ? (
                                    <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-100">
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(seller.id)}
                                        className="text-[9px] font-bold text-red-600 px-1.5 py-1 hover:bg-red-100 rounded"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(null)}
                                        className="text-[9px] font-bold text-slate-500 px-1.5 py-1 hover:bg-slate-100 rounded"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setShowDeleteConfirm(seller.id)}
                                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors border border-slate-100 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* RANKING DE VENDEDORES & COMISSÕES TAB */
            <div className="space-y-6">
              {(() => {
                const validOrders = orders.filter(o => o.status !== 'canceled');

                const rankingData = sellers.map(seller => {
                  const sellerIdLower = seller.id.trim().toLowerCase();
                  const sellerEmailLower = seller.email.trim().toLowerCase();
                  const sellerNameLower = seller.name.trim().toLowerCase();

                  const sellerOrders = validOrders.filter(o => {
                    const oSellerId = (o.sellerId || '').trim().toLowerCase();
                    const oRepName = (o.representedName || '').trim().toLowerCase();
                    
                    if (oSellerId) {
                      if (oSellerId === sellerIdLower || oSellerId === sellerEmailLower || oSellerId === sellerNameLower) {
                        return true;
                      }
                    }
                    if (oRepName) {
                      if (oRepName === sellerNameLower || oRepName === sellerEmailLower) {
                        return true;
                      }
                    }
                    return false;
                  });

                  const totalSales = sellerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                  const ordersCount = sellerOrders.length;

                  // Find checked represented item
                  const checkedRepItem = seller.representedList?.find(r => r.checked);
                  const repItem = checkedRepItem || seller.representedList?.[0];
                  const isCommissionChecked = checkedRepItem ? true : false;
                  const commissionRate = repItem ? (repItem.commission || 0) : 0;

                  let commissionValue = totalSales;
                  let isCommissionActive = false;

                  if (isCommissionChecked && commissionRate > 0) {
                    commissionValue = totalSales * (commissionRate / 100);
                    isCommissionActive = true;
                  } else {
                    // When not marked, displays the full total amount in ranking of commissions
                    commissionValue = totalSales;
                    isCommissionActive = false;
                  }

                  return {
                    seller,
                    totalSales,
                    ordersCount,
                    commissionRate,
                    isCommissionChecked,
                    isCommissionActive,
                    commissionValue
                  };
                }).sort((a, b) => b.totalSales - a.totalSales);

                const maxSales = rankingData.length > 0 && rankingData[0].totalSales > 0 ? rankingData[0].totalSales : 1;
                const grandTotalSales = rankingData.reduce((sum, r) => sum + r.totalSales, 0);
                const grandTotalCommissions = rankingData.reduce((sum, r) => sum + r.commissionValue, 0);
                const grandTotalOrders = rankingData.reduce((sum, r) => sum + r.ordersCount, 0);
                const topSeller = rankingData.length > 0 ? rankingData[0] : null;

                return (
                  <div className="space-y-6">
                    {/* STATS HEADER CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-[#851b42] to-[#5e132e] rounded-2xl p-4 text-white shadow-md space-y-1">
                        <div className="flex items-center justify-between opacity-80">
                          <span className="text-[10px] font-black uppercase tracking-wider">Vendas do Time</span>
                          <TrendingUp size={16} />
                        </div>
                        <p className="text-xl font-black">
                          R$ {grandTotalSales.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-[10px] opacity-70">Total acumulado de pedidos</p>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-emerald-600">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Comissões Totais</span>
                          <DollarSign size={16} />
                        </div>
                        <p className="text-xl font-black text-slate-800">
                          R$ {grandTotalCommissions.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-[10px] text-slate-400">Valores a pagar/calculados</p>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-amber-500">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Líder de Vendas</span>
                          <Trophy size={16} />
                        </div>
                        <p className="text-sm font-black text-slate-800 truncate">
                          {topSeller && topSeller.totalSales > 0 ? topSeller.seller.name : 'Nenhum pedido'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold">
                          {topSeller && topSeller.totalSales > 0 ? `R$ ${topSeller.totalSales.toFixed(2).replace('.', ',')}` : 'Sem vendas'}
                        </p>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-blue-600">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pedidos Faturados</span>
                          <ShoppingBag size={16} />
                        </div>
                        <p className="text-xl font-black text-slate-800">
                          {grandTotalOrders}
                        </p>
                        <p className="text-[10px] text-slate-400">Total de pedidos finalizados</p>
                      </div>
                    </div>

                    {/* RANKING LIST */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Trophy size={18} className="text-amber-500" />
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            Pódio de Vendedores e Comissões
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">
                          Ordenado pelo maior volume de vendas
                        </span>
                      </div>

                      {rankingData.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          Nenhum vendedor cadastrado.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rankingData.map((item, idx) => {
                            const isFirst = idx === 0 && item.totalSales > 0;
                            const isSecond = idx === 1 && item.totalSales > 0;
                            const isThird = idx === 2 && item.totalSales > 0;
                            const pctOfMax = maxSales > 0 ? (item.totalSales / maxSales) * 100 : 0;

                            return (
                              <div 
                                key={item.seller.id}
                                className={cn(
                                  "p-4 rounded-xl border transition-all space-y-3",
                                  isFirst 
                                    ? "bg-amber-50/40 border-amber-200 shadow-sm" 
                                    : isSecond
                                    ? "bg-slate-50/70 border-slate-200"
                                    : isThird
                                    ? "bg-orange-50/30 border-orange-200"
                                    : "bg-white border-slate-100 hover:border-slate-200"
                                )}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  {/* Left: Position badge & seller info */}
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs",
                                      isFirst ? "bg-amber-400 text-amber-950" :
                                      isSecond ? "bg-slate-300 text-slate-800" :
                                      isThird ? "bg-amber-700 text-white" :
                                      "bg-slate-100 text-slate-500 border border-slate-200"
                                    )}>
                                      {isFirst ? '1º' : isSecond ? '2º' : isThird ? '3º' : `${idx + 1}º`}
                                    </div>

                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden font-extrabold text-slate-500 flex items-center justify-center shrink-0">
                                      {item.seller.avatarUrl ? (
                                        <img src={item.seller.avatarUrl} alt={item.seller.name} className="w-full h-full object-cover" />
                                      ) : (
                                        item.seller.name.charAt(0).toUpperCase()
                                      )}
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-black text-slate-800">{item.seller.name}</h4>
                                        {isFirst && (
                                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                            <Trophy size={10} /> Campeão
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-bold">
                                        {item.ordersCount} {item.ordersCount === 1 ? 'pedido realizado' : 'pedidos realizados'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Right: Sales volume & Commission */}
                                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                                    <div className="text-left sm:text-right">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total de Vendas</span>
                                      <span className="text-sm font-black text-slate-800">
                                        R$ {item.totalSales.toFixed(2).replace('.', ',')}
                                      </span>
                                    </div>

                                    <div className="text-right bg-slate-50 border border-slate-200/80 p-2 rounded-xl">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Valor de Comissão</span>
                                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                                        {item.isCommissionActive ? (
                                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                                            {item.commissionRate}%
                                          </span>
                                        ) : (
                                          <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                                            Valor Total
                                          </span>
                                        )}
                                        <span className="text-xs font-black text-[#851b42]">
                                          R$ {item.commissionValue.toFixed(2).replace('.', ',')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-1 pt-1">
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        isFirst ? "bg-amber-500" : "bg-[#851b42]"
                                      )}
                                      style={{ width: `${Math.max(pctOfMax, 2)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      ) : (
        /* FORM VIEW (REGISTRATION / EDIT) MATCHING THE THREE SCREENSHOT IMAGES */
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
          
          {/* SECTION 1: INFORMAÇÕES PESSOAIS (IMAGE 1) */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <User size={18} className="text-[#851b42]" /> Informações Pessoais
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Profile Photo Placeholder */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center overflow-hidden shrink-0">
                  <User size={48} className="text-slate-300" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Foto do Perfil</span>
              </div>

              {/* Personal Info Fields */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    * Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="obrigatório"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 outline-none transition-all text-slate-800 text-sm bg-slate-50/50 hover:bg-slate-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 outline-none transition-all text-slate-800 text-sm bg-slate-50/50 hover:bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    * E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="obrigatório"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 outline-none transition-all text-slate-800 text-sm bg-slate-50/50 hover:bg-slate-50"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Biography with Character Counter */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Biografia <Info size={14} className="text-slate-400 cursor-help" title="Fale um pouco sobre o vendedor" />
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 140))}
                placeholder="Insira uma breve biografia..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 outline-none transition-all text-slate-800 text-sm bg-slate-50/50 hover:bg-slate-50 resize-none"
              />
              <div className="text-right text-[10px] text-slate-400 font-bold">
                {140 - bio.length} caracteres restantes
              </div>
            </div>
          </div>

          {/* SECTION 2: PERMISSÕES (IMAGE 2) */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield size={18} className="text-[#851b42]" /> Permissões
            </h2>

            <div className="space-y-4">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Perfil do usuário
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* COMUM PANEL */}
                <div 
                  className={cn(
                    "border rounded-2xl p-5 transition-all cursor-pointer relative flex flex-col justify-between",
                    role === 'Comum' 
                      ? "border-[#851b42] bg-[#851b42]/5 shadow-xs" 
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                  onClick={() => setRole('Comum')}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        role === 'Comum' ? "border-[#851b42]" : "border-slate-300"
                      )}>
                        {role === 'Comum' && <div className="w-2.5 h-2.5 rounded-full bg-[#851b42]" />}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800">Comum</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-7">
                      Tem acesso apenas aos próprios clientes, agendamentos, pedidos e comissões. Altere as opções abaixo para personalizar as permissões:
                    </p>
                  </div>

                  {/* CUSTOM PERMISSIONS BOX */}
                  {role === 'Comum' && (
                    <div className="border-t border-slate-200/60 mt-5 pt-4 pl-7 space-y-5 text-left text-slate-700">
                      
                      {/* CLIENTS */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
                          Clientes
                        </span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.limitarAcessoClientes} 
                              onChange={() => togglePermission('limitarAcessoClientes')}
                              className="accent-[#851b42] rounded"
                            />
                            Limitar acesso aos clientes <Info size={12} className="text-slate-400 inline cursor-help" title="Vendedor só verá os clientes expressamente vinculados a ele" />
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirVincularTabelasPreco} 
                              onChange={() => togglePermission('permitirVincularTabelasPreco')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir vincular tabelas de preço por cliente
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirCadastrarClientes} 
                              onChange={() => togglePermission('permitirCadastrarClientes')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir cadastrar novos clientes
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirAlterarClientes} 
                              onChange={() => togglePermission('permitirAlterarClientes')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir alterar clientes
                          </label>
                        </div>
                      </div>

                      {/* PRODUCTS */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
                          Produtos
                        </span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirCadastrarProdutos} 
                              onChange={() => togglePermission('permitirCadastrarProdutos')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir cadastrar novos produtos <Info size={12} className="text-slate-400 inline cursor-help" title="Permite criar novos itens de catálogo" />
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirAlterarExcluirProdutos} 
                              onChange={() => togglePermission('permitirAlterarExcluirProdutos')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir alterar e excluir produtos <Info size={12} className="text-slate-400 inline cursor-help" title="Permite editar valores ou excluir itens" />
                          </label>
                        </div>
                      </div>

                      {/* ORDERS */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
                          Pedidos
                        </span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirAlterarPedidoGerado} 
                              onChange={() => togglePermission('permitirAlterarPedidoGerado')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir alterar o pedido depois de gerado
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirAlterarStatusPedido} 
                              onChange={() => togglePermission('permitirAlterarStatusPedido')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir alterar o status do pedido
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.visualizarPedidosOutrosVendedores} 
                              onChange={() => togglePermission('visualizarPedidosOutrosVendedores')}
                              className="accent-[#851b42] rounded"
                            />
                            Visualizar pedidos feitos por outros vendedores no detalhamento do cliente <Info size={12} className="text-slate-400 inline cursor-help" title="Visualização agregada de históricos" />
                          </label>
                        </div>
                      </div>

                      {/* INDICATORS & REPORTS */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
                          Indicadores e Relatórios
                        </span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirAcessoRelatorioComissoes} 
                              onChange={() => togglePermission('permitirAcessoRelatorioComissoes')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir acesso ao relatório de Comissões
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirDefinirMetas} 
                              onChange={() => togglePermission('permitirDefinirMetas')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir definir metas
                          </label>
                        </div>
                      </div>

                      {/* OTHERS */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
                          Outros
                        </span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirCadastrarAlterarTransportadoras} 
                              onChange={() => togglePermission('permitirCadastrarAlterarTransportadoras')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir cadastrar e alterar transportadoras
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={permissions.permitirCadastrarAlterarExcluirRoteiros} 
                              onChange={() => togglePermission('permitirCadastrarAlterarExcluirRoteiros')}
                              className="accent-[#851b42] rounded"
                            />
                            Permitir cadastrar, alterar e excluir roteiros
                          </label>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* ADMINISTRADOR PANEL */}
                <div 
                  className={cn(
                    "border rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-start h-fit",
                    role === 'Administrador' 
                      ? "border-[#851b42] bg-[#851b42]/5 shadow-xs" 
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                  onClick={() => setRole('Administrador')}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        role === 'Administrador' ? "border-[#851b42]" : "border-slate-300"
                      )}>
                        {role === 'Administrador' && <div className="w-2.5 h-2.5 rounded-full bg-[#851b42]" />}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800">Administrador</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-7">
                      Tem acesso total ao sistema, podendo visualizar e alterar representadas, produtos, tabelas de preço, clientes, pedidos e comissões, inclusive de outros usuários.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* SECTION 3: REPRESENTADAS (IMAGE 3) */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={18} className="text-[#851b42]" /> Representadas
              </h2>
              <p className="text-xs text-slate-500">
                Defina quais representadas este usuário terá acesso, e qual será a comissão.
              </p>
            </div>

            {/* Representadas Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 w-12 text-center">
                        <CheckSquare size={14} className="text-[#851b42] mx-auto" />
                      </th>
                      <th className="py-3 px-4 min-w-[200px]">Representada</th>
                      <th className="py-3 px-4 text-center w-32">Comissão (%)</th>
                      <th className="py-3 px-4 text-center w-36">Desconto máx. (%)</th>
                      <th className="py-3 px-4 text-center w-36">Acréscimo máx. (%)</th>
                      <th className="py-3 px-4 text-center w-24">Saldo Flex</th>
                      <th className="py-3 px-4 text-center min-w-[150px]">Tabelas de preço</th>
                      <th className="py-3 px-4 text-center w-28">Definir tabelas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {representedList.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700">
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleRepresentedCheck(item.id)}
                            className="accent-[#851b42] rounded"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.name}:
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            value={item.commission}
                            onChange={(e) => handleRepresentedChange(item.id, 'commission', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-center outline-none focus:border-[#851b42]"
                            disabled={!item.checked}
                            min={0}
                            max={100}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-1.5 justify-center bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 w-28 mx-auto">
                            <Lock size={12} className="text-purple-600" />
                            <input
                              type="number"
                              value={item.maxDiscount}
                              onChange={(e) => handleRepresentedChange(item.id, 'maxDiscount', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent text-center border-none outline-none font-bold text-slate-700"
                              disabled={!item.checked}
                              placeholder="Livre"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-1.5 justify-center bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 w-28 mx-auto">
                            <Lock size={12} className="text-purple-600" />
                            <input
                              type="number"
                              value={item.maxMarkup}
                              onChange={(e) => handleRepresentedChange(item.id, 'maxMarkup', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent text-center border-none outline-none font-bold text-slate-700"
                              disabled={!item.checked}
                              placeholder="Livre"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={item.saldoFlex}
                            onChange={(e) => handleRepresentedChange(item.id, 'saldoFlex', e.target.checked)}
                            className="accent-[#851b42] rounded"
                            disabled={!item.checked}
                          />
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-bold">
                          {item.priceTables}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRepForTableModal(item.id);
                              const currentTables = item.priceTables === 'Sem restrição' ? [] : item.priceTables.split(', ');
                              setModalPriceTables(currentTables);
                              setShowPriceTablesModal(true);
                            }}
                            className="bg-[#5c134f] hover:bg-[#430e3a] text-white font-bold py-1.5 px-3 rounded-lg text-[10px] flex items-center gap-1 mx-auto cursor-pointer"
                            disabled={!item.checked}
                          >
                            <FileText size={12} /> Definir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FORM ACTIONS */}
          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setViewState('list');
                setCurrentSeller(null);
              }}
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#851b42] hover:bg-[#5e132e] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <Save size={14} /> Salvar Vendedor
            </button>
          </div>

        </form>
      )}

      {showPriceTablesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col p-6 animate-in zoom-in-95 duration-200 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <FileText className="text-[#851b42]" size={18} /> Definir Tabelas de Preço
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Selecione quais tabelas de preço estarão disponíveis para este vendedor.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                'Preço de Tabela',
                'Preço Distribuidor (5%)',
                'Preço Atacado (10%)',
                'Preço Especial (15%)'
              ].map((table) => {
                const isChecked = modalPriceTables.includes(table);
                return (
                  <label key={table} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setModalPriceTables(prev => prev.filter(t => t !== table));
                        } else {
                          setModalPriceTables(prev => [...prev, table]);
                        }
                      }}
                      className="accent-[#851b42] rounded h-4 w-4"
                    />
                    <span>{table}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowPriceTablesModal(false);
                  setSelectedRepForTableModal(null);
                }}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePriceTables}
                className="px-5 py-2.5 bg-[#851b42] hover:bg-[#5e132e] text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
