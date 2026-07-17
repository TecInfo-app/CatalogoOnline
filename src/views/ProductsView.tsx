import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  Plus, 
  Minus,
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Heart, 
  ShoppingCart, 
  Sparkles, 
  Settings, 
  MoreVertical, 
  ChevronDown, 
  Check, 
  Package, 
  DollarSign, 
  HelpCircle,
  FolderPlus,
  CheckCircle,
  AlertCircle,
  XCircle,
  Ticket
} from 'lucide-react';
import { getProducts, getCoupons, saveCoupons } from '../lib/store';
import { Product, Coupon } from '../types';
import { cn } from '../lib/utils';
import { ProductFormModal } from '../components/ProductFormModal';
import { ImportExportModal } from '../components/ImportExportModal';

export function ProductsView({ userEmail }: { userEmail: string }) {
  // Main tabs: 'produtos' or 'promocoes'
  const [topMainTab, setTopMainTab] = useState<'produtos' | 'promocoes'>('produtos');

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);

  // Coupon Form state
  const [couponCode, setCouponCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [couponType, setCouponType] = useState<'fidelidade' | 'aniversario' | 'valor_pedido' | 'cupom'>('cupom');
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponDiscountValue, setCouponDiscountValue] = useState(0);
  const [couponMinOrderValue, setCouponMinOrderValue] = useState(0);
  const [couponIsActive, setCouponIsActive] = useState(true);
  const [couponIsFirstOrderOnly, setCouponIsFirstOrderOnly] = useState(false);
  const [couponMinOrdersRequired, setCouponMinOrdersRequired] = useState(0);
  const [couponExpiryDate, setCouponExpiryDate] = useState('');

  useEffect(() => {
    if (couponToEdit) {
      setCouponCode(couponToEdit.code);
      setCouponName(couponToEdit.name);
      setCouponType(couponToEdit.type);
      setCouponDiscountType(couponToEdit.discountType);
      setCouponDiscountValue(couponToEdit.discountValue);
      setCouponMinOrderValue(couponToEdit.minOrderValue || 0);
      setCouponIsActive(couponToEdit.isActive !== false);
      setCouponIsFirstOrderOnly(couponToEdit.isFirstOrderOnly || false);
      setCouponMinOrdersRequired(couponToEdit.minOrdersRequired || 0);
      setCouponExpiryDate(couponToEdit.expiryDate || '');
    } else {
      setCouponCode('');
      setCouponName('');
      setCouponType('cupom');
      setCouponDiscountType('percentage');
      setCouponDiscountValue(0);
      setCouponMinOrderValue(0);
      setCouponIsActive(true);
      setCouponIsFirstOrderOnly(false);
      setCouponMinOrdersRequired(0);
      setCouponExpiryDate('');
    }
  }, [couponToEdit]);

  // Products storage state
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'mosaic'>('list'); // 'list' is default as requested/shown in 2nd image
  
  // Tabs for the top sub-navigation (Match 2nd Image)
  const [topSubTab, setTopSubTab] = useState<'produtos' | 'estoque'>('produtos');
  const [stockSubFilter, setStockSubFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Categories list
  const [categories, setCategories] = useState<string[]>(['Sem categoria', 'Bolsas', 'Mochilas', 'Acessórios']);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Storage key for items
  const getStorageKey = (key: string) => `vercos_${userEmail}_${key}`;

  // Initial load
  useEffect(() => {
    // Load products
    const loadedProducts = getProducts(userEmail);
    setProducts(loadedProducts);

    // Load custom categories if exist
    const savedCats = localStorage.getItem(getStorageKey('product_categories'));
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    }

    // Load coupons
    setCoupons(getCoupons(userEmail));
  }, [userEmail]);

  const saveCouponsToStorage = (updatedCoupons: Coupon[]) => {
    saveCoupons(userEmail, updatedCoupons);
    setCoupons(updatedCoupons);
  };

  // Coupon Handlers
  const handleSaveCoupon = (payload: Omit<Coupon, 'id'> & { id?: string }) => {
    let updated: Coupon[];
    if (payload.id) {
      // Edit
      updated = coupons.map(c => c.id === payload.id ? { ...c, ...payload } as Coupon : c);
    } else {
      // Create new
      const newCoupon: Coupon = {
        ...payload,
        id: `cpn-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };
      updated = [...coupons, newCoupon];
    }
    saveCouponsToStorage(updated);
    setIsCouponModalOpen(false);
    setCouponToEdit(null);
  };

  const handleToggleCouponActive = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    saveCouponsToStorage(updated);
  };

  const handleDeleteCoupon = (id: string) => {
    const updated = coupons.filter(c => c.id !== id);
    saveCouponsToStorage(updated);
  };

  // Save products helper
  const saveProductsToStorage = (updatedProducts: Product[]) => {
    localStorage.setItem(getStorageKey('products'), JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
  };

  // Add Category Helper
  const handleAddCategory = (newCat: string) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem(getStorageKey('product_categories'), JSON.stringify(updated));
  };

  // Handle Save product from modal
  const handleSaveProduct = (payload: Omit<Product, 'id'> & { id?: string }, keepOpen = false) => {
    let updated: Product[];
    if (payload.id) {
      // Edit
      updated = products.map(p => p.id === payload.id ? { ...p, ...payload } as Product : p);
    } else {
      // Create new
      const newProduct: Product = {
        ...payload,
        id: `prd-${Math.floor(100000 + Math.random() * 900000)}`,
      } as Product;
      updated = [...products, newProduct];
    }
    saveProductsToStorage(updated);
    
    if (!keepOpen) {
      setIsFormModalOpen(false);
      setProductToEdit(null);
    }
  };

  // Handle Delete product
  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      const updated = products.filter(p => p.id !== productToDelete);
      saveProductsToStorage(updated);
      setProductToDelete(null);
    }
  };

  // Toggle single product promo status
  const handleTogglePromo = (id: string) => {
    const updated = products.map(p => {
      if (p.id === id) {
        const isPromo = !p.isPromo;
        return {
          ...p,
          isPromo,
          originalPrice: isPromo ? Math.round(p.price * 1.2) : undefined
        };
      }
      return p;
    });
    saveProductsToStorage(updated);
  };

  // Toggle product active status (for catalog visibility)
  const handleToggleActive = (id: string) => {
    const updated = products.map(p => {
      if (p.id === id) {
        return {
          ...p,
          isActive: p.isActive === false ? true : false
        };
      }
      return p;
    });
    saveProductsToStorage(updated);
  };

  // Update product stock with status auto-calculation
  const handleUpdateStock = (productId: string, newStock: number) => {
    const safeStock = Math.max(0, newStock);
    let newStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (safeStock === 0) {
      newStatus = 'out_of_stock';
    } else if (safeStock <= 5) {
      newStatus = 'low_stock';
    }

    const updated = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stock: safeStock,
          status: newStatus
        };
      }
      return p;
    });
    saveProductsToStorage(updated);
  };

  // Handle Bulk Import
  const handleBulkImport = (imported: Product[]) => {
    // Add only new (by checking name or SKU, or simply append)
    const updated = [...products];
    imported.forEach(p => {
      // Check duplicate SKU
      const existsIdx = updated.findIndex(u => u.sku === p.sku);
      if (existsIdx > -1) {
        updated[existsIdx] = { ...updated[existsIdx], ...p };
      } else {
        updated.push(p);
      }
    });
    saveProductsToStorage(updated);
  };

  // Filtered Products List
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'Todas' || 
      product.category === selectedCategory ||
      (selectedCategory === 'Sem categoria' && !product.category);

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.status !== 'out_of_stock') ||
      (statusFilter === 'inactive' && product.status === 'out_of_stock');

    let matchesStock = true;
    if (topSubTab === 'estoque') {
      if (stockSubFilter === 'ok') {
        matchesStock = product.status === 'in_stock' || (product.stock !== undefined && product.stock > 5);
      } else if (stockSubFilter === 'low') {
        matchesStock = product.status === 'low_stock' || (product.stock !== undefined && product.stock > 0 && product.stock <= 5);
      } else if (stockSubFilter === 'out') {
        matchesStock = product.status === 'out_of_stock' || product.stock === 0;
      }
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* MAIN TOP NAVIGATION BAR (Matches Product/Promo/Featured theme) */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 -mx-6 md:-mx-8 px-6 md:px-8 py-3 flex flex-wrap gap-6 items-center justify-between shadow-xs">
        <div className="flex gap-8">
          <button 
            type="button"
            onClick={() => setTopMainTab('produtos')}
            className={cn(
              "text-sm pb-2 px-1 relative flex items-center gap-1.5 transition-colors",
              topMainTab === 'produtos' ? "font-extrabold text-[#4c3780] border-b-2 border-[#4c3780]" : "font-semibold text-slate-400 hover:text-slate-600"
            )}
          >
            <Package size={16} /> PRODUTOS
          </button>
          <button 
            type="button"
            onClick={() => setTopMainTab('promocoes')}
            className={cn(
              "text-sm pb-2 px-1 relative flex items-center gap-1.5 transition-colors",
              topMainTab === 'promocoes' ? "font-extrabold text-[#4c3780] border-b-2 border-[#4c3780]" : "font-semibold text-slate-400 hover:text-slate-600"
            )}
          >
            <Sparkles size={16} /> PROMOÇÕES
          </button>
        </div>
      </div>

      {topMainTab === 'promocoes' ? (
        <div className="animate-in fade-in duration-300 space-y-6">
          {/* Header Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Cupons</p>
              <p className="text-xl font-black text-[#4c3780]">{coupons.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promoções Ativas</p>
              <p className="text-xl font-black text-emerald-600">
                {coupons.filter(c => c.isActive !== false).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fidelidade & Niver</p>
              <p className="text-xl font-black text-blue-600">
                {coupons.filter(c => c.type === 'fidelidade' || c.type === 'aniversario').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regras de Pedido</p>
              <p className="text-xl font-black text-amber-600">
                {coupons.filter(c => c.type === 'valor_pedido').length}
              </p>
            </div>
          </div>

          {/* Action Bar for Coupons */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between animate-in slide-in-from-bottom duration-300">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Gerenciador de Cupons & Promoções</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Defina regras de fidelidade, cupons digitáveis e descontos automáticos por valor de pedido.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCouponToEdit(null);
                setIsCouponModalOpen(true);
              }}
              className="bg-[#4c3780] hover:bg-[#3c2a68] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} /> Novo Cupom / Promoção
            </button>
          </div>

          {/* List of Coupons */}
          {coupons.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
                <Ticket size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Nenhuma promoção ou cupom cadastrado.</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1">Crie promoções de Fidelidade, Aniversário, Desconto por Valor do Pedido, ou cupons manuais digitáveis para engajar seus clientes!</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCouponToEdit(null);
                  setIsCouponModalOpen(true);
                }}
                className="bg-[#4c3780] hover:bg-[#3c2a68] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all mx-auto cursor-pointer"
              >
                Cadastrar Primeiro Cupom
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {coupons.map(coupon => {
                const isPromoActive = coupon.isActive !== false;
                const discLabel = coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue.toFixed(2).replace('.', ',')}`;
                
                return (
                  <div 
                    key={coupon.id} 
                    className={cn(
                      "bg-white rounded-2xl border transition-all flex overflow-hidden shadow-xs relative",
                      isPromoActive ? "border-slate-100 hover:shadow-md hover:border-slate-200/80" : "border-slate-200 bg-slate-50/50 grayscale-[40%]"
                    )}
                  >
                    {/* Left visual ticket part */}
                    <div className={cn(
                      "w-28 flex flex-col items-center justify-center text-white p-4 text-center shrink-0 border-r-2 border-dashed border-slate-100/40 relative select-none",
                      coupon.type === 'fidelidade' ? "bg-blue-500" :
                      coupon.type === 'aniversario' ? "bg-pink-500" :
                      coupon.type === 'valor_pedido' ? "bg-amber-500" : "bg-[#4c3780]"
                    )}>
                      {/* Decorative ticket cutouts */}
                      <div className="absolute top-0 right-0 -mr-2 w-4 h-4 bg-slate-50 rounded-full" />
                      <div className="absolute bottom-0 right-0 -mr-2 w-4 h-4 bg-slate-50 rounded-full" />

                      <p className="text-lg font-black tracking-tight">{discLabel}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-90">DESCONTO</p>
                    </div>

                    {/* Middle info part */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider",
                            coupon.type === 'fidelidade' ? "bg-blue-50 text-blue-600" :
                            coupon.type === 'aniversario' ? "bg-pink-50 text-pink-600" :
                            coupon.type === 'valor_pedido' ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"
                          )}>
                            {coupon.type === 'fidelidade' ? '🤝 Fidelidade' :
                             coupon.type === 'aniversario' ? '🎂 Aniversário' :
                             coupon.type === 'valor_pedido' ? '💰 Regra de Pedido' : '🎫 Cupom'}
                          </span>
                          {!isPromoActive && (
                            <span className="text-[8px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">Inativo</span>
                          )}
                        </div>

                        <h3 className="text-xs font-extrabold text-slate-800 line-clamp-1">{coupon.name}</h3>
                        
                        <div className="flex flex-col gap-1 pt-1">
                          {coupon.type === 'cupom' ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider select-all">
                                Código: {coupon.code}
                              </span>
                              {coupon.isFirstOrderOnly && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                  1º Pedido
                                </span>
                              )}
                            </div>
                          ) : coupon.type === 'valor_pedido' ? (
                            <span className="text-[10px] font-semibold text-slate-500">
                              Pedido Mínimo: R$ {coupon.minOrderValue?.toFixed(2).replace('.', ',')}
                            </span>
                          ) : coupon.type === 'fidelidade' ? (
                            <span className="text-[10px] font-semibold text-slate-500">
                              🤝 Mín. de pedidos: <strong className="text-slate-700">{coupon.minOrdersRequired || 0}</strong>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500">
                              🎂 No aniversário do cliente
                            </span>
                          )}

                          {coupon.expiryDate && (
                            <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                              📅 Válido até: {coupon.expiryDate.split('-').reverse().join('/')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer controls */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-50/50 mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleCouponActive(coupon.id)}
                            className={cn(
                              "w-10 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center cursor-pointer",
                              isPromoActive ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                            )}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                          </button>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none">
                            {isPromoActive ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setCouponToEdit(coupon);
                              setIsCouponModalOpen(true);
                            }}
                            className="w-7 h-7 rounded-lg border border-slate-100 hover:border-[#4c3780]/20 text-slate-500 hover:text-[#4c3780] hover:bg-purple-50/50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="w-7 h-7 rounded-lg border border-slate-100 hover:border-red-100 text-slate-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ──────────────────────────────────────────────────────── */}
          {/* SUB HEADER TAB BAR */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="border-b border-slate-200/60 pb-1 flex gap-6 items-center overflow-x-auto hide-scrollbar">
        <button
          type="button"
          onClick={() => setTopSubTab('produtos')}
          className={cn(
            "pb-2.5 text-xs font-bold tracking-wider relative transition-all uppercase flex items-center gap-2",
            topSubTab === 'produtos' ? 'text-slate-800 border-b-2 border-slate-800 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          📄 Produtos e tabelas
        </button>
        <button
          type="button"
          onClick={() => {
            setTopSubTab('estoque');
          }}
          className={cn(
            "pb-2.5 text-xs font-bold tracking-wider relative transition-all uppercase flex items-center gap-2",
            topSubTab === 'estoque' ? 'text-slate-800 border-b-2 border-slate-800 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          📦 Gerenciar estoque
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* MAIN ACTIONS & FILTER BAR (Match second image) */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Left Side Actions: Add, Import, More Options */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setProductToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="bg-[#4c3780] hover:bg-[#3c2a68] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/10 flex items-center gap-2"
          >
            <Plus size={15} strokeWidth={2.5} /> Cadastrar produto
          </button>

          <button
            type="button"
            onClick={() => {
              setIsImportExportOpen(true);
            }}
            className="border border-[#4c3780]/30 hover:border-[#4c3780] text-[#4c3780] hover:bg-[#4c3780]/5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Upload size={14} /> Importar produtos
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              Mais opções <ChevronDown size={14} />
            </button>

            {showMoreMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportExportOpen(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download size={14} /> Exportar Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode(viewMode === 'list' ? 'mosaic' : 'list');
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  {viewMode === 'list' ? <Grid size={14} /> : <List size={14} />}
                  Mudar p/ {viewMode === 'list' ? 'Mosaico' : 'Lista'}
                </button>
                <div className="h-[1px] bg-slate-100 my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja resetar o catálogo para o padrão original?')) {
                      localStorage.removeItem(getStorageKey('products'));
                      setProducts(getProducts(userEmail));
                    }
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                >
                  Resetar Padrão
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Filters & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          
          {/* Active Status Selector */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-[#4c3780] appearance-none"
            >
              <option value="active">Exibir produtos ativos</option>
              <option value="all">Exibir todos os produtos</option>
              <option value="inactive">Exibir fora de estoque</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-[#4c3780] appearance-none"
            >
              <option value="Todas">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquise por código ou nome"
              className="pl-9 pr-4 py-2 w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 transition-all"
            />
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white text-[#4c3780] shadow-xs font-bold" : "text-slate-400 hover:text-slate-600"
              )}
              title="Visualização em Lista"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mosaic')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'mosaic' ? "bg-white text-[#4c3780] shadow-xs font-bold" : "text-slate-400 hover:text-slate-600"
              )}
              title="Visualização em Mosaico"
            >
              <Grid size={15} />
            </button>
          </div>

        </div>
      </div>

      {/* Stock Sub-Filter Cards Row */}
      {topSubTab === 'estoque' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStockSubFilter('all')}
            className={cn(
              "p-4 rounded-xl border text-left transition-all duration-200 shadow-xs flex items-center justify-between group",
              stockSubFilter === 'all'
                ? "bg-[#4c3780] border-[#4c3780] text-white"
                : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
            )}
          >
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", stockSubFilter === 'all' ? "text-purple-100" : "text-slate-400")}>Todos Produtos</p>
              <h4 className="text-lg font-black mt-1">{products.length}</h4>
            </div>
            <Package size={20} className={stockSubFilter === 'all' ? "text-purple-200" : "text-slate-400"} />
          </button>

          <button
            type="button"
            onClick={() => setStockSubFilter('ok')}
            className={cn(
              "p-4 rounded-xl border text-left transition-all duration-200 shadow-xs flex items-center justify-between group",
              stockSubFilter === 'ok'
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-white border-slate-100 text-slate-700 hover:border-emerald-100 hover:bg-emerald-50/20"
            )}
          >
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", stockSubFilter === 'ok' ? "text-emerald-100" : "text-emerald-600")}>Estoque OK</p>
              <h4 className="text-lg font-black mt-1">
                {products.filter(p => p.stock > 5 || p.status === 'in_stock').length}
              </h4>
            </div>
            <CheckCircle size={20} className={stockSubFilter === 'ok' ? "text-emerald-200" : "text-emerald-500"} />
          </button>

          <button
            type="button"
            onClick={() => setStockSubFilter('low')}
            className={cn(
              "p-4 rounded-xl border text-left transition-all duration-200 shadow-xs flex items-center justify-between group",
              stockSubFilter === 'low'
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-white border-slate-100 text-slate-700 hover:border-amber-100 hover:bg-amber-50/20"
            )}
          >
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", stockSubFilter === 'low' ? "text-amber-100" : "text-amber-600")}>Estoque Baixo</p>
              <h4 className="text-lg font-black mt-1">
                {products.filter(p => (p.stock !== undefined && p.stock > 0 && p.stock <= 5) || p.status === 'low_stock').length}
              </h4>
            </div>
            <AlertCircle size={20} className={stockSubFilter === 'low' ? "text-amber-100" : "text-amber-500"} />
          </button>

          <button
            type="button"
            onClick={() => setStockSubFilter('out')}
            className={cn(
              "p-4 rounded-xl border text-left transition-all duration-200 shadow-xs flex items-center justify-between group",
              stockSubFilter === 'out'
                ? "bg-rose-600 border-rose-600 text-white"
                : "bg-white border-slate-100 text-slate-700 hover:border-rose-100 hover:bg-rose-50/20"
            )}
          >
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", stockSubFilter === 'out' ? "text-rose-100" : "text-rose-600")}>Esgotados</p>
              <h4 className="text-lg font-black mt-1">
                {products.filter(p => p.stock === 0 || p.status === 'out_of_stock').length}
              </h4>
            </div>
            <XCircle size={20} className={stockSubFilter === 'out' ? "text-rose-200" : "text-rose-500"} />
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PRODUCTS DISPLAY STAGE */}
      {/* ──────────────────────────────────────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Package size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Não encontramos produtos para os termos pesquisados ou categoria selecionada. Tente limpar os filtros ou crie um novo produto.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Todas');
              setStatusFilter('all');
              setStockSubFilter('all');
            }}
            className="mt-4 bg-[#4c3780]/10 hover:bg-[#4c3780]/20 text-[#4c3780] font-bold px-4 py-2 rounded-xl text-xs transition-all"
          >
            Limpar Filtros
          </button>
        </div>
      ) : topSubTab === 'estoque' ? (
        /* STOCK VERIFICATION SPREADSHEET VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-extrabold text-[#4c3780] uppercase tracking-wider">Planilha de Verificação de Estoque</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ajuste os valores diretamente nos botões para verificar o estoque que está OK ou em falta.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100/50 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Estoque OK: &gt; 5 itens
              </span>
              <span className="text-[10px] px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-100/50 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Estoque Baixo: 1 a 5 itens
              </span>
              <span className="text-[10px] px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100/50 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Esgotado: 0 itens
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-32">Status do Estoque</th>
                  <th className="py-3 px-4 w-16">Foto</th>
                  <th className="py-3 px-4 w-24">Código</th>
                  <th className="py-3 px-4">Nome do Produto</th>
                  <th className="py-3 px-4 w-32">Categoria</th>
                  <th className="py-3 px-4 w-20">Unidade</th>
                  <th className="py-3 px-4 w-44 text-center">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map(product => {
                  const currentStock = product.stock !== undefined ? product.stock : 0;
                  const isStockOk = currentStock > 5;
                  const isLowStock = currentStock > 0 && currentStock <= 5;
                  const isOutOfStock = currentStock === 0;

                  return (
                    <tr 
                      key={product.id} 
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors group",
                        isOutOfStock && "bg-rose-50/10"
                      )}
                    >
                      {/* STATUS BADGE */}
                      <td className="py-3.5 px-4">
                        {isStockOk && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Estoque OK ✅
                          </span>
                        )}
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Estoque Baixo ⚠️
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Esgotado ❌
                          </span>
                        )}
                      </td>

                      {/* PHOTO */}
                      <td className="py-3.5 px-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="h-full w-full object-contain mix-blend-multiply"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-500">
                        {product.sku}
                      </td>

                      {/* NAME */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#4c3780] hover:underline text-left leading-snug">
                          {product.name}
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3.5 px-4">
                        <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">
                          {product.category || 'Sem categoria'}
                        </span>
                      </td>

                      {/* UNIT */}
                      <td className="py-3.5 px-4 text-slate-500 font-bold">
                        {product.unit || 'Un'}
                      </td>

                      {/* INTERACTIVE CONTROLS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(product.id, currentStock - 1)}
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 active:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all font-bold shadow-2xs"
                            title="Remover 1 do estoque"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center border border-slate-200 rounded-lg py-1 text-xs font-black text-slate-700 focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateStock(product.id, currentStock + 1)}
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 active:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all font-bold shadow-2xs"
                            title="Adicionar 1 ao estoque"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400">
            <span>
              Verificados <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> produtos cadastrados
            </span>
            <span>
              Estoque Total: <strong>{products.reduce((acc, p) => acc + (p.stock || 0), 0)}</strong> unidades
            </span>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        
        /* LIST / TABLE VIEW (Matches second image format) */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">👁</th>
                  <th className="py-3 px-4 w-16">Fotos</th>
                  <th className="py-3 px-4 w-24 text-center">Catálogo</th>
                  <th className="py-3 px-4 w-24">Código</th>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Variações</th>
                  <th className="py-3 px-4 w-16">IPI</th>
                  <th className="py-3 px-4 w-20">Unidade</th>
                  <th className="py-3 px-4 w-20">Comissão</th>
                  <th className="py-3 px-4 text-right">Preço Mínimo</th>
                  <th className="py-3 px-4 text-right">Preço de Tabela</th>
                  <th className="py-3 px-4 w-20 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map(product => {
                  const hasVariations = product.variations && product.variations.length > 0;
                  const variationsStr = hasVariations
                    ? product.variations!.map(v => `${v.name}: ${v.values.join(', ')}`).join(' | ')
                    : '---';

                  return (
                    <tr 
                      key={product.id} 
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors group",
                        product.status === 'out_of_stock' && "opacity-60 bg-slate-50/20",
                        product.isActive === false && "opacity-60 bg-slate-100/30"
                      )}
                    >
                      {/* Active Status icon */}
                      <td className="py-3.5 px-4 text-center">
                        <span 
                          className={cn(
                            "inline-block w-2.5 h-2.5 rounded-full",
                            product.status === 'in_stock' ? "bg-emerald-500" :
                            product.status === 'low_stock' ? "bg-amber-400" : "bg-red-400"
                          )}
                          title={
                            product.status === 'in_stock' ? 'Em estoque' :
                            product.status === 'low_stock' ? 'Baixo estoque' : 'Fora de estoque'
                          }
                        />
                      </td>

                      {/* Product Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1 relative">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="h-full w-full object-contain mix-blend-multiply"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </td>

                      {/* Catalog active toggle switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product.id)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4c3780]/20",
                            product.isActive !== false ? "bg-emerald-500" : "bg-slate-300"
                          )}
                          title={product.isActive !== false ? "Ativo no Catálogo (clique para ocultar)" : "Inativo no Catálogo (clique para exibir)"}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                              product.isActive !== false ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      </td>

                      {/* SKU code */}
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-500">
                        {product.sku}
                      </td>

                      {/* Product Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setProductToEdit(product);
                              setIsFormModalOpen(true);
                            }}
                            className="font-bold text-[#4c3780] hover:underline text-left leading-snug group-hover:text-[#3c2a68]"
                          >
                            {product.name}
                          </button>
                          <div className="flex gap-2 items-center">
                            <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">
                              {product.category || 'Sem categoria'}
                            </span>
                            {product.isPromo && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-full font-extrabold border border-rose-100">
                                PROMO
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Variations */}
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={variationsStr}>
                        {hasVariations ? (
                          <div className="flex flex-wrap gap-1">
                            {product.variations!.slice(0, 2).map((v, i) => (
                              <span key={i} className="text-[9px] bg-purple-50 text-[#4c3780] px-1.5 py-0.5 rounded border border-purple-100 font-semibold">
                                {v.name}: {v.values.join('/')}
                              </span>
                            ))}
                            {product.variations!.length > 2 && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold">
                                +{product.variations!.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </td>

                      {/* IPI */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {product.ipi || '---'}
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        {product.unit || 'Un'}
                      </td>

                      {/* Commission */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {product.comissao || '---'}
                      </td>

                      {/* Minimum Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                        R$ {(product.minPrice || product.price * 0.9).toFixed(2).replace('.', ',')}
                      </td>

                      {/* Table Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#4c3780]">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setProductToEdit(product);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#4c3780] rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePromo(product.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              product.isPromo 
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100" 
                                : "text-slate-400 hover:text-rose-500 hover:bg-slate-100"
                            )}
                            title={product.isPromo ? "Remover Promoção" : "Marcar Promoção"}
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400">
            <span>Exibindo <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> produtos cadastrados</span>
            <span>Estoque Total: <strong>{products.reduce((acc, p) => acc + (p.stock || 0), 0)}</strong> unidades</span>
          </div>
        </div>

      ) : (
        
        /* MOSAIC / GRID VIEW (Matches original catalog view with style updates) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const hasVariations = product.variations && product.variations.length > 0;
            return (
              <div 
                key={product.id} 
                className={cn(
                  "bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all duration-300 group",
                  product.status === 'out_of_stock' && "opacity-75",
                  product.isActive === false && "border-dashed border-slate-300 opacity-65 bg-slate-50/50"
                )}
              >
                {/* Image Showcase Box */}
                <div className="relative h-44 bg-slate-50 flex items-center justify-center p-4">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className={cn(
                      "object-contain h-full w-full mix-blend-multiply transition-all duration-300 group-hover:scale-105",
                      product.status === 'out_of_stock' && "grayscale",
                      product.isActive === false && "grayscale"
                    )}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Stock Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    {product.status === 'in_stock' && (
                      <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                        {product.stock} em estoque
                      </span>
                    )}
                    {product.status === 'low_stock' && (
                      <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                        Baixo Estoque ({product.stock})
                      </span>
                    )}
                    {product.status === 'out_of_stock' && (
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                        Sem Estoque
                      </span>
                    )}
                  </div>

                  {/* Promo Banner */}
                  {product.isPromo && (
                    <div className="absolute top-3 left-3 bg-rose-600 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Sparkles size={10} /> Promo
                    </div>
                  )}

                  {product.isActive === false && (
                    <div className="absolute bottom-3 left-3 bg-slate-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <EyeOff size={10} /> Oculto
                    </div>
                  )}
                </div>

                {/* Details Container */}
                <div className="p-4 flex flex-col flex-grow space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                      <span>SKU: {product.sku}</span>
                      <span className="uppercase text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-extrabold">
                        {product.category || 'Sem categoria'}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setProductToEdit(product);
                        setIsFormModalOpen(true);
                      }}
                      className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 hover:text-[#4c3780] hover:underline text-left block w-full"
                    >
                      {product.name}
                    </button>
                  </div>

                  {/* Variations tag inside card */}
                  {hasVariations && (
                    <div className="flex gap-1 flex-wrap">
                      {product.variations!.slice(0, 2).map((v, i) => (
                        <span key={i} className="text-[8.5px] bg-purple-50 text-[#4c3780] px-1.5 py-0.5 rounded font-bold border border-purple-100">
                          {v.name}: {v.values.join('/')}
                        </span>
                      ))}
                      {product.variations!.length > 2 && (
                        <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-extrabold">
                          +{product.variations!.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price display footer inside card */}
                  <div className="mt-auto pt-3 border-t border-slate-50 flex items-end justify-between">
                    <div>
                      {product.isPromo && product.originalPrice && (
                        <p className="text-[10px] text-slate-400 line-through mb-0.5">
                          R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                        </p>
                      )}
                      {!product.isPromo && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Preço Atacado</p>}
                      <p className="text-sm font-black text-[#4c3780]">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button 
                        type="button"
                        onClick={() => handleToggleActive(product.id)}
                        className={cn(
                          "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors",
                          product.isActive !== false
                            ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            : "border-slate-200 text-slate-400 hover:bg-slate-100"
                        )}
                        title={product.isActive !== false ? "Ativo no Catálogo (clique para ocultar)" : "Oculto no Catálogo (clique para exibir)"}
                      >
                        {product.isActive !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setProductToEdit(product);
                          setIsFormModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:border-[#4c3780]/30 text-slate-600 hover:text-[#4c3780] hover:bg-purple-50 flex items-center justify-center transition-colors"
                        title="Editar"
                      >
                        <Edit size={13} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* DIALOGS / MODALS GATEWAY */}
      {/* ──────────────────────────────────────────────────────── */}

      {/* Form Modal (New Product / Edit Product) */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
        onAddCategory={handleAddCategory}
      />

      {/* Import/Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        products={products}
        onImport={handleBulkImport}
      />

      {/* Coupon Modal (New Coupon / Edit Coupon) */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Ticket size={18} className="text-[#4c3780]" />
                  {couponToEdit ? 'Editar Promoção' : 'Nova Promoção / Cupom'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Configure as regras e descontos para oferecer aos clientes.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCouponModalOpen(false);
                  setCouponToEdit(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-140px)]">
              {/* Promotion Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">* Nome da Promoção / Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cupom de Boas-vindas ou 10% de Fidelidade"
                  value={couponName}
                  onChange={(e) => setCouponName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>

              {/* Promotion Type */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">* Tipo de Promoção</label>
                <select
                  value={couponType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setCouponType(val);
                    if (val === 'cupom' && !couponCode) {
                      setCouponCode('CUPOM' + Math.floor(100 + Math.random() * 900));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                >
                  <option value="cupom">🎫 Cupom Manual (Cliente digita no carrinho)</option>
                  <option value="valor_pedido">💰 Desconto por Valor do Pedido (Automático no carrinho)</option>
                  <option value="fidelidade">🤝 Fidelidade (Cliente seleciona no carrinho)</option>
                  <option value="aniversario">🎂 Aniversário (Cliente seleciona no carrinho)</option>
                </select>
              </div>

              {/* Code field (Only if type is 'cupom') */}
              {couponType === 'cupom' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">* Código do Cupom (Sem espaços)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: BEMVINDO10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-mono font-bold uppercase"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <input
                      type="checkbox"
                      id="couponIsFirstOrderOnly"
                      checked={couponIsFirstOrderOnly}
                      onChange={(e) => setCouponIsFirstOrderOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-[#4c3780] focus:ring-[#4c3780]"
                    />
                    <label htmlFor="couponIsFirstOrderOnly" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
                      Apenas para o primeiro pedido do cliente
                    </label>
                  </div>
                </div>
              )}

              {/* Min Orders Required field (Only if type is 'fidelidade') */}
              {couponType === 'fidelidade' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block">* Número de Pedidos Mínimo para Habilitar</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={couponMinOrdersRequired || ''}
                    onChange={(e) => setCouponMinOrdersRequired(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 5 (cliente precisa de 5 pedidos feitos)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-bold"
                  />
                </div>
              )}

              {/* Discount Type Buttons */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">* Tipo de Desconto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCouponDiscountType('percentage')}
                    className={cn(
                      "py-2 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer",
                      couponDiscountType === 'percentage'
                        ? "bg-purple-50 border-[#4c3780] text-[#4c3780]"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    Porcentagem (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponDiscountType('fixed')}
                    className={cn(
                      "py-2 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer",
                      couponDiscountType === 'fixed'
                        ? "bg-purple-50 border-[#4c3780] text-[#4c3780]"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    Valor Fixo (R$)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">
                  * {couponDiscountType === 'percentage' ? 'Porcentagem do Desconto (%)' : 'Valor Fixo do Desconto (R$)'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={couponDiscountType === 'percentage' ? '100' : undefined}
                  step={couponDiscountType === 'percentage' ? '1' : '0.01'}
                  value={couponDiscountValue || ''}
                  onChange={(e) => setCouponDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={couponDiscountType === 'percentage' ? 'Ex: 10' : 'Ex: 15,00'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-bold"
                />
              </div>

              {/* Min Order Value (Only for 'valor_pedido') */}
              {couponType === 'valor_pedido' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block">* Valor Mínimo de Pedido (R$)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={couponMinOrderValue || ''}
                    onChange={(e) => setCouponMinOrderValue(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 150,00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-bold"
                  />
                </div>
              )}

              {/* Expiration Date - For all coupons */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">Disponível até (Data de Expiração - Opcional)</label>
                <input
                  type="date"
                  value={couponExpiryDate}
                  onChange={(e) => setCouponExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-slate-700">Promoção Habilitada</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Se desativado, o desconto não será oferecido no carrinho.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCouponIsActive(!couponIsActive)}
                  className={cn(
                    "w-12 h-7 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center cursor-pointer",
                    couponIsActive ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                  )}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCouponModalOpen(false);
                  setCouponToEdit(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!couponName.trim()) return alert('Insira o nome do cupom!');
                  if (couponType === 'cupom' && !couponCode.trim()) return alert('Insira o código do cupom!');
                  if (couponDiscountValue <= 0) return alert('Insira um valor de desconto válido!');
                  
                  handleSaveCoupon({
                    id: couponToEdit?.id,
                    name: couponName.trim(),
                    type: couponType,
                    code: couponType === 'cupom' ? couponCode.trim().toUpperCase() : '',
                    discountType: couponDiscountType,
                    discountValue: couponDiscountValue,
                    minOrderValue: couponType === 'valor_pedido' ? couponMinOrderValue : undefined,
                    isActive: couponIsActive,
                    isFirstOrderOnly: couponType === 'cupom' ? couponIsFirstOrderOnly : undefined,
                    minOrdersRequired: couponType === 'fidelidade' ? couponMinOrdersRequired : undefined,
                    expiryDate: couponExpiryDate || undefined
                  });
                }}
                className="flex-1 px-4 py-2.5 bg-[#4c3780] hover:bg-[#3c2a68] text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Salvar Regra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Excluir Produto</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
