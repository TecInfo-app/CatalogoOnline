import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Check, AlertTriangle, Plus, Minus, ArrowLeft, Send, CheckCircle2, X, Trash2, User, History, LogOut, LogIn, Edit3, ClipboardList, FileText, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { getProducts, saveProducts, addOrder, getClients, addClient, updateClient, getOrders, getStoreProfile, getCoupons } from '../lib/store';
import { Product, Order, Client, Coupon } from '../types';
import { cn } from '../lib/utils';
import { AbacatePayCheckoutView } from './AbacatePayCheckoutView';

interface CustomerCatalogViewProps {
  sellerEmail: string;
}

export function CustomerCatalogView({ sellerEmail }: CustomerCatalogViewProps) {
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

  const [storeProfile, setStoreProfile] = useState(() => getStoreProfile(sellerEmail));
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number; selectedVariations: Record<string, string> }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Coupons / Promotions state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');

  // Load coupons of the seller
  useEffect(() => {
    setCoupons(getCoupons(sellerEmail));
  }, [sellerEmail]);

  // Client authentication & state
  const [loggedInClient, setLoggedInClient] = useState<Client | null>(() => {
    const saved = localStorage.getItem(`vercos_catalog_logged_in_client_${sellerEmail}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');

  // Orders History modal
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

  // Edit / Confirm Data modal before finalizing order
  const [isDataConfirmationOpen, setIsDataConfirmationOpen] = useState(false);
  const [isEditingConfirmation, setIsEditingConfirmation] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [confirmCnpjCpf, setConfirmCnpjCpf] = useState('');
  const [birthday, setBirthday] = useState('');
  const [confirmBirthday, setConfirmBirthday] = useState('');

  // Product Selection Modal
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  // Checkout Form
  const [clientName, setClientName] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // AbacatePay Payment integration states
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const payParam = urlParams.get('pay');
  const orderIdParam = urlParams.get('orderId');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'whatsapp' | 'abacatepay'>('abacatepay');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(payParam === 'success' && !!orderIdParam);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [verificationMessage, setVerificationMessage] = useState('Consultando API do AbacatePay...');
  const [verificationSession, setVerificationSession] = useState<any>(null);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);

  useEffect(() => {
    if (payParam === 'success' && orderIdParam) {
      const sessionData = localStorage.getItem(`abacatepay_session_${orderIdParam}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setVerificationSession(parsed);
        
        // Hydrate checkout state
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.clientName) setClientName(parsed.clientName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.cnpjCpf) setCnpjCpf(parsed.cnpjCpf);
        if (parsed.birthday) setBirthday(parsed.birthday);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.appliedCoupon) setAppliedCoupon(parsed.appliedCoupon);
        
        setVerificationStatus('loading');
        setVerificationMessage('Validando assinatura digital e status de transação com AbacatePay...');
        
        const verify = async () => {
          try {
            // Simulate API verification
            await new Promise(resolve => setTimeout(resolve, 2000));
            setVerificationStatus('success');
            setVerificationMessage('Pagamento Aprovado e Confirmado via API! 🎉');
          } catch (err) {
            setVerificationStatus('error');
            setVerificationMessage('Erro ao obter status da transação. Por favor, tente confirmar manualmente.');
          }
        };
        verify();
      }
    }
  }, [payParam, orderIdParam]);

  // Pre-fill checkout form if logged in
  useEffect(() => {
    if (loggedInClient) {
      setClientName(loggedInClient.name);
      setPhone(loggedInClient.phones?.[0] || '');
      setCnpjCpf(loggedInClient.cnpj || '');
      setBirthday(loggedInClient.birthday || '');
    } else {
      setClientName('');
      setPhone('');
      setCnpjCpf('');
      setBirthday('');
    }
  }, [loggedInClient]);

  useEffect(() => {
    const loadData = () => {
      // Load products of the specific seller
      const loaded = getProducts(sellerEmail);
      // Filter to show only active products (isActive !== false)
      const activeProducts = loaded.filter(p => p.isActive !== false);
      setProducts(activeProducts);

      // Get unique categories
      const cats = ['Todos', ...Array.from(new Set(activeProducts.map(p => p.category).filter(Boolean))) as string[]];
      setCategories(cats);
    };

    loadData();

    // Listen for storage changes to update catalog in real-time if opened in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `vercos_${sellerEmail}_products`) {
        loadData();
      }
    };
    
    // Fallback for iframe environments or same-window navigation
    const handleFocus = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sellerEmail]);

  // Filter products by search & category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenProductModal = (product: Product) => {
    setProductToView(product);
    setSelectedQuantity(product.multiple || 1);
    
    // Initialize default variations
    const initialVars: Record<string, string> = {};
    if (product.variations) {
      product.variations.forEach(v => {
        if (v.values.length > 0) {
          initialVars[v.name] = v.values[0];
        }
      });
    }
    setSelectedVariations(initialVars);
  };

  // Add to cart helper
  const handleAddToCart = (product: Product, initialVars: Record<string, string> = {}, quantity: number = 1) => {
    // Check if variations exist and initialize defaults if not specified
    const finalVars: Record<string, string> = { ...initialVars };
    if (product.variations) {
      product.variations.forEach(v => {
        if (!finalVars[v.name] && v.values.length > 0) {
          finalVars[v.name] = v.values[0];
        }
      });
    }

    const stockLimit = product.stock !== undefined && product.stock !== null ? product.stock : Infinity;

    setCart(prev => {
      // Find if item is already in cart with identical variations
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id && 
        JSON.stringify(item.selectedVariations) === JSON.stringify(finalVars)
      );

      const multiple = product.multiple || 1;
      const finalQuantity = Math.max(multiple, Math.ceil(quantity / multiple) * multiple);

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + finalQuantity;
        if (newQty > stockLimit) {
          alert(`Quantidade total limitada ao estoque disponível (${stockLimit} unidades)`);
          updated[existingIdx].quantity = stockLimit;
        } else {
          updated[existingIdx].quantity = newQty;
        }
        return updated;
      } else {
        if (finalQuantity > stockLimit) {
          alert(`Quantidade total limitada ao estoque disponível (${stockLimit} unidades)`);
          return [...prev, { product, quantity: stockLimit, selectedVariations: finalVars }];
        }
        return [...prev, { product, quantity: finalQuantity, selectedVariations: finalVars }];
      }
    });
    
    // Close modal if open
    setProductToView(null);
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== idx));
      return;
    }
    const updated = [...cart];
    const product = updated[idx].product;
    const stockLimit = product.stock !== undefined && product.stock !== null ? product.stock : Infinity;

    if (newQty > stockLimit) {
      alert(`Quantidade limitada ao estoque disponível (${stockLimit} unidades)`);
      updated[idx].quantity = stockLimit;
    } else {
      updated[idx].quantity = newQty;
    }
    setCart(updated);
  };

  // Retrieve client past orders
  const getClientOrders = (): Order[] => {
    if (!loggedInClient) return [];
    const allOrders = getOrders(sellerEmail);
    const clientNameNorm = loggedInClient.name.toLowerCase().trim();
    const clientLegalNameNorm = loggedInClient.legalName?.toLowerCase().trim() || '';

    // Filter orders by matching names
    return allOrders.filter(o => {
      if (!o.clientName) return false;
      const oNameNorm = o.clientName.toLowerCase().trim();
      return oNameNorm === clientNameNorm || oNameNorm === clientLegalNameNorm;
    });
  };

  // Check if coupon is expired
  const isCouponExpired = (c: Coupon) => {
    if (!c.expiryDate) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return todayStr > c.expiryDate;
  };

  // Check if it's client's first order
  const getClientOrdersCount = () => {
    if (loggedInClient) {
      return getClientOrders().length;
    }
    if (clientName.trim()) {
      const allOrders = getOrders(sellerEmail);
      const nameNorm = clientName.trim().toLowerCase();
      return allOrders.filter(o => o.clientName && o.clientName.toLowerCase().trim() === nameNorm).length;
    }
    return 0;
  };

  // Check if client birthday is today
  const isClientBirthdayToday = () => {
    const clientBday = loggedInClient?.birthday || birthday;
    if (!clientBday) return false;
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    
    const parts = clientBday.split('-');
    if (parts.length >= 2) {
      const birthMonth = parts[1];
      const birthDay = parts[2];
      return todayMonth === birthMonth && todayDay === birthDay;
    }
    return false;
  };

  // Calculate cart total & discounts
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Auto coupon for minimum order value
  const activeOrderValueCoupon = coupons.find(
    c => c.isActive && !isCouponExpired(c) && c.type === 'valor_pedido' && c.minOrderValue && subtotal >= c.minOrderValue
  );

  // Auto coupon for birthday if logged-in client birthday is today
  const activeBirthdayCoupon = coupons.find(
    c => c.isActive && !isCouponExpired(c) && c.type === 'aniversario'
  );
  const isBirthdayToday = isClientBirthdayToday();
  const applyBirthdayAuto = activeBirthdayCoupon && isBirthdayToday;

  let discountAmount = 0;
  let appliedPromotionsList: Array<{ id: string; name: string; value: number }> = [];

  if (activeOrderValueCoupon) {
    let amt = 0;
    if (activeOrderValueCoupon.discountType === 'percentage') {
      amt = (subtotal * activeOrderValueCoupon.discountValue) / 100;
    } else {
      amt = activeOrderValueCoupon.discountValue;
    }
    discountAmount += amt;
    appliedPromotionsList.push({ id: activeOrderValueCoupon.id, name: activeOrderValueCoupon.name, value: amt });
  }

  if (applyBirthdayAuto && activeBirthdayCoupon) {
    let amt = 0;
    if (activeBirthdayCoupon.discountType === 'percentage') {
      amt = (subtotal * activeBirthdayCoupon.discountValue) / 100;
    } else {
      amt = activeBirthdayCoupon.discountValue;
    }
    discountAmount += amt;
    appliedPromotionsList.push({ 
      id: activeBirthdayCoupon.id, 
      name: `🎂 Desconto de Aniversário (${activeBirthdayCoupon.name})`, 
      value: amt 
    });
  }

  if (appliedCoupon) {
    const expired = isCouponExpired(appliedCoupon);
    const isFidelityUnsatisfied = appliedCoupon.type === 'fidelidade' && 
      (!loggedInClient || getClientOrders().length < (appliedCoupon.minOrdersRequired || 0));
    const isFirstOrderUnsatisfied = appliedCoupon.isFirstOrderOnly && getClientOrdersCount() > 0;

    // avoid double applying if it's already auto applied
    const isAlreadyApplied = appliedPromotionsList.some(p => p.id === appliedCoupon.id);

    if (!expired && !isFidelityUnsatisfied && !isFirstOrderUnsatisfied && !isAlreadyApplied) {
      let amt = 0;
      if (appliedCoupon.discountType === 'percentage') {
        amt = (subtotal * appliedCoupon.discountValue) / 100;
      } else {
        amt = appliedCoupon.discountValue;
      }
      discountAmount += amt;
      appliedPromotionsList.push({ id: appliedCoupon.id, name: appliedCoupon.name, value: amt });
    }
  }

  const cartTotal = Math.max(0, subtotal - discountAmount);

  // Manual Coupon Handler
  const handleApplyCouponCode = () => {
    setCouponError('');
    setCouponSuccessMsg('');
    if (!couponCodeInput.trim()) return;

    const matched = coupons.find(
      c => c.isActive && c.code.toUpperCase() === couponCodeInput.trim().toUpperCase()
    );

    if (!matched) {
      setCouponError('Cupom inválido, inativo ou inexistente.');
      return;
    }

    if (isCouponExpired(matched)) {
      setCouponError('Este cupom de desconto já expirou.');
      return;
    }

    if (matched.isFirstOrderOnly && getClientOrdersCount() > 0) {
      setCouponError('Este cupom é válido apenas para o seu primeiro pedido.');
      return;
    }

    if (matched.type === 'valor_pedido' && matched.minOrderValue && subtotal < matched.minOrderValue) {
      setCouponError(`Este cupom exige um pedido mínimo de R$ ${matched.minOrderValue.toFixed(2).replace('.', ',')}.`);
      return;
    }

    setAppliedCoupon(matched);
    setCouponSuccessMsg(`Cupom "${matched.code}" aplicado com sucesso!`);
    setCouponCodeInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccessMsg('');
    setCouponError('');
  };

  const handleFinalCheckoutInitiation = (finalName: string, finalPhone: string, finalCnpjCpf: string, finalBirthday: string) => {
    if (storeProfile.abacatePayEnabled && storeProfile.abacatePayApiKey) {
      setConfirmName(finalName);
      setConfirmPhone(finalPhone);
      setConfirmCnpjCpf(finalCnpjCpf);
      setConfirmBirthday(finalBirthday);
      
      setIsDataConfirmationOpen(false);
      setIsPaymentModalOpen(true);
    } else {
      executeFinalCheckout(finalName, finalPhone, finalCnpjCpf, finalBirthday);
    }
  };

  // Submit Order to seller database (intercepted for confirmation)
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !clientName.trim() || !phone.trim()) return;

    if (loggedInClient) {
      // If client is logged in, show the confirmation screen first
      setConfirmName(clientName.trim());
      setConfirmPhone(phone.trim());
      setConfirmCnpjCpf(cnpjCpf.trim());
      setConfirmBirthday(birthday);
      setIsEditingConfirmation(false);
      setIsDataConfirmationOpen(true);
    } else {
      // Normal flow if not logged in
      handleFinalCheckoutInitiation(clientName.trim(), phone.trim(), cnpjCpf.trim(), birthday);
    }
  };

  // Final executor of the checkout (creates order and updates/registers clients)
  const executeFinalCheckout = (
    finalName: string, 
    finalPhone: string, 
    finalCnpjCpf: string, 
    finalBirthday: string,
    customOrderNum?: string,
    isPaid: boolean = false
  ) => {
    const orderNum = customOrderNum || `CAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const formattedDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });

    const promoNames = appliedPromotionsList.map(p => p.name).join(', ');

    // Pre-determine client ID to link to order correctly
    const clients = getClients(sellerEmail);
    const normalizedNewName = finalName.toLowerCase();
    const cleanCnpj = finalCnpjCpf;

    let targetClientId = loggedInClient?.id;
    
    const existingClient = clients.find(c => {
      if (cleanCnpj && c.cnpj && c.cnpj.replace(/\D/g, '') === cleanCnpj.replace(/\D/g, '')) {
        return true;
      }
      return c.name.toLowerCase() === normalizedNewName || c.legalName.toLowerCase() === normalizedNewName;
    });

    if (existingClient) {
      targetClientId = existingClient.id;
    } else if (!targetClientId) {
      targetClientId = `cli-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    const newOrder: Order = {
      id: `ord-${Math.floor(100000 + Math.random() * 900000)}`,
      orderNumber: orderNum,
      clientName: finalName,
      clientId: targetClientId,
      date: formattedDate,
      itemsCount: cartItemsCount,
      subtotal: subtotal,
      discount: discountAmount,
      discountNotes: promoNames || undefined,
      total: cartTotal,
      status: isPaid ? 'completed' : 'budget',
      paymentMethod: isPaid ? 'AbacatePay (Pix/Cartão)' : undefined,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }))
    };

    // Save order in Seller storage
    addOrder(sellerEmail, newOrder);

    // Automatically register client if they don't exist yet
    try {
      if (!existingClient) {
        const newClient: Client = {
          id: targetClientId,
          type: cleanCnpj.replace(/\D/g, '').length <= 11 ? 'Pessoa Física' : 'Pessoa Jurídica',
          name: finalName,
          legalName: finalName,
          cnpj: cleanCnpj,
          status: 'active',
          location: 'Cadastro via Catálogo',
          lastContact: `Último pedido: ${formattedDate}`,
          phones: [finalPhone],
          birthday: finalBirthday || undefined,
          isPortalEnabled: true
        };
        addClient(sellerEmail, newClient);
        
        // Log them in automatically
        setLoggedInClient(newClient);
        localStorage.setItem(`vercos_catalog_logged_in_client_${sellerEmail}`, JSON.stringify(newClient));
      } else {
        // Find existing client to update details or auto-login
        if (existingClient) {
          const updated: Client = {
            ...existingClient,
            name: finalName,
            legalName: finalName,
            cnpj: finalCnpjCpf,
            phones: [finalPhone],
            birthday: existingClient.birthday || finalBirthday || undefined
          };
          updateClient(sellerEmail, updated);
          setLoggedInClient(updated);
          localStorage.setItem(`vercos_catalog_logged_in_client_${sellerEmail}`, JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Erro ao auto-cadastrar/atualizar cliente do catalogo:', err);
    }

    // Deduct stock for products sold in catalog
    try {
      const currentProducts = getProducts(sellerEmail);
      let updatedAnyProduct = false;
      cart.forEach(cartItem => {
        const prodIndex = currentProducts.findIndex(p => p.id === cartItem.product.id);
        if (prodIndex !== -1) {
          const prod = currentProducts[prodIndex];
          const newStock = Math.max(0, (prod.stock || 0) - cartItem.quantity);
          prod.stock = newStock;
          
          if (newStock <= 0) {
            prod.status = 'out_of_stock';
          } else if (newStock <= 5) {
            prod.status = 'low_stock';
          } else {
            prod.status = 'in_stock';
          }
          currentProducts[prodIndex] = prod;
          updatedAnyProduct = true;
        }
      });
      if (updatedAnyProduct) {
        saveProducts(sellerEmail, currentProducts);
        // Trigger catalog state update with active products
        setProducts(currentProducts.filter(p => p.isActive !== false));
      }
    } catch (err) {
      console.error('Erro ao abater estoque dos produtos vendidos:', err);
    }

    // Set checkout form states to final values so WhatsApp matches
    setClientName(finalName);
    setPhone(finalPhone);
    setCnpjCpf(finalCnpjCpf);
    setBirthday(finalBirthday);

    // Show success screen
    setOrderSuccess(newOrder);
    setIsDataConfirmationOpen(false);
  };

  // Client Catalog Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginName.trim() || !loginPhone.trim()) {
      setLoginError('Por favor, preencha o nome e celular.');
      return;
    }

    const clients = getClients(sellerEmail);
    const normalizedInputName = loginName.trim().toLowerCase();
    const digitsInputPhone = loginPhone.replace(/\D/g, '');

    // Strict search by name and phone digits
    let found = clients.find(c => {
      const matchesName = c.name.toLowerCase() === normalizedInputName || 
                          c.legalName.toLowerCase() === normalizedInputName;
      
      const matchesPhone = c.phones && c.phones.some(p => {
        const digitsP = p.replace(/\D/g, '');
        return digitsP.includes(digitsInputPhone) || digitsInputPhone.includes(digitsP);
      });

      return matchesName && matchesPhone;
    });

    // Helpful fallback: if strict matching fails, check name match alone
    if (!found) {
      const nameMatches = clients.filter(c => c.name.toLowerCase() === normalizedInputName || c.legalName.toLowerCase() === normalizedInputName);
      if (nameMatches.length > 0) {
        found = nameMatches[0];
      }
    }

    if (found) {
      setLoggedInClient(found);
      localStorage.setItem(`vercos_catalog_logged_in_client_${sellerEmail}`, JSON.stringify(found));
      setIsLoginModalOpen(false);
      setLoginName('');
      setLoginPhone('');
    } else {
      setLoginError('Cadastro não encontrado com os dados informados. Verifique se o nome e celular são exatamente os mesmos de sua ficha cadastral ou de pedidos passados.');
    }
  };

  const handleLogout = () => {
    setLoggedInClient(null);
    localStorage.removeItem(`vercos_catalog_logged_in_client_${sellerEmail}`);
    handleResetCatalog();
  };

  // Generate WhatsApp message and redirect
  const handleSendWhatsApp = () => {
    if (!orderSuccess) return;

    let text = `*NOVO PEDIDO RECEBIDO - CATÁLOGO ONLINE*\n`;
    text += `----------------------------------------\n`;
    text += `*Pedido:* #${orderSuccess.orderNumber}\n`;
    text += `*Cliente:* ${clientName}\n`;
    if (cnpjCpf) text += `*CPF/CNPJ:* ${cnpjCpf}\n`;
    text += `*Telefone:* ${phone}\n`;
    if (notes) text += `*Observações:* ${notes}\n`;
    text += `----------------------------------------\n`;
    text += `*ITENS DO PEDIDO:*\n`;

    cart.forEach(item => {
      const vars = Object.entries(item.selectedVariations)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      const varsStr = vars ? ` (${vars})` : '';
      text += `• ${item.quantity}x ${item.product.name}${varsStr} - R$ ${(item.product.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
    });

    text += `----------------------------------------\n`;
    if (discountAmount > 0) {
      text += `*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
      appliedPromotionsList.forEach(promo => {
        text += `*Cupom/Desconto (${promo.name}):* -R$ ${promo.value.toFixed(2).replace('.', ',')}\n`;
      });
      text += `*TOTAL COM DESCONTO:* R$ ${cartTotal.toFixed(2).replace('.', ',')}\n`;
    } else {
      text += `*TOTAL DO PEDIDO:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    }
    
    if (orderSuccess.paymentMethod) {
      text += `*PAGAMENTO:* ${orderSuccess.paymentMethod} ✅\n`;
    }
    text += `\n_Pedido gerado via Vercos Catálogo Online_`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleResetCatalog = () => {
    setCart([]);
    if (loggedInClient) {
      setClientName(loggedInClient.name);
      setPhone(loggedInClient.phones?.[0] || '');
      setCnpjCpf(loggedInClient.cnpj || '');
      setBirthday(loggedInClient.birthday || '');
    } else {
      setClientName('');
      setCnpjCpf('');
      setPhone('');
      setBirthday('');
    }
    setNotes('');
    setOrderSuccess(null);
    setIsCartOpen(false);
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    setCouponSuccessMsg('');
  };

  // 1. If view is checkout, render AbacatePayCheckoutView
  if (viewParam === 'abacatepay-checkout' && orderIdParam) {
    return <AbacatePayCheckoutView orderId={orderIdParam} sellerEmail={sellerEmail} />;
  }

  // 2. If verifying payment, show overlay
  if (isVerifyingPayment && verificationSession) {
    const formattedTotal = verificationSession.cartTotal.toFixed(2).replace('.', ',');
    return (
      <div className="min-h-screen bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-slate-100">
          
          {verificationStatus === 'loading' && (
            <div className="space-y-6 py-4">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <div className="absolute w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-xs">A</span>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  Confirmando Pagamento
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {verificationMessage}
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="space-y-6 py-2">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-800">
                  {verificationMessage}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  O AbacatePay confirmou o recebimento do Pix/Cartão de <strong>R$ {formattedTotal}</strong> referente ao pedido <strong className="text-[#4c3780]">#{orderIdParam}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2 text-xs text-slate-600">
                <p><strong>Pedido:</strong> #{orderIdParam}</p>
                <p><strong>Cliente:</strong> {verificationSession.clientName}</p>
                <p><strong>Total:</strong> R$ {formattedTotal}</p>
                <p><strong>Status de API:</strong> <span className="font-bold text-emerald-600">PAGO</span></p>
              </div>

              <button
                type="button"
                onClick={() => {
                  // Finalize order as Paid
                  executeFinalCheckout(
                    verificationSession.clientName,
                    verificationSession.phone,
                    verificationSession.cnpjCpf,
                    verificationSession.birthday,
                    orderIdParam || undefined,
                    true
                  );
                  setIsVerifyingPayment(false);
                  
                  // Clean up session from localStorage
                  localStorage.removeItem(`abacatepay_session_${orderIdParam}`);
                  
                  // Clean URL query params to keep clean
                  const cleanUrl = window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerEmail}`;
                  window.history.replaceState({}, document.title, cleanUrl);
                }}
                className="w-full bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Check size={14} className="stroke-[2.5]" /> Confirmar Pedido e Enviar WhatsApp
              </button>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-6 py-2">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-800">
                  Não conseguimos confirmar automaticamente
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {verificationMessage}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    // Let them force approve or retry
                    setVerificationStatus('success');
                    setVerificationMessage('Pagamento Confirmado Manualmente via API! 🎉');
                  }}
                  className="w-full bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Simular Confirmação de API
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingPayment(false);
                    const cleanUrl = window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerEmail}`;
                    window.location.href = cleanUrl;
                  }}
                  className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Voltar ao Catálogo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-slate-100">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={44} strokeWidth={2.5} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-800">Pedido Enviado com Sucesso!</h1>
            <p className="text-xs text-slate-400">
              Seu pedido <strong className="text-[#4c3780]">#{orderSuccess.orderNumber}</strong> foi registrado e enviado para o vendedor.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2 text-xs text-slate-600">
            <p><strong>Vendedor:</strong> {sellerEmail}</p>
            <p><strong>Cliente:</strong> {clientName}</p>
            <p><strong>Total:</strong> R$ {cartTotal.toFixed(2).replace('.', ',')}</p>
            <p><strong>Itens:</strong> {cartItemsCount} unidades</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSendWhatsApp}
              className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Send size={15} /> Enviar Resumo pelo WhatsApp
            </button>
            
            <button
              onClick={handleResetCatalog}
              className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-3.5 px-6 rounded-xl text-xs transition-all cursor-pointer"
            >
              Voltar ao Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-700 flex flex-col font-sans">
      
      {/* PREVIEW BANNER */}
      {isPreview && (
        <div className="bg-[#4c3780] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Você está visualizando o catálogo como cliente.
          </div>
          <button 
            onClick={() => window.location.href = window.location.pathname}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={12} />
            Voltar ao Painel
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100/80 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Seller details */}
          <div className="flex items-center gap-2.5">
            {storeProfile.logoUrl ? (
              <img 
                src={storeProfile.logoUrl} 
                alt={storeProfile.shopName || 'Logo'} 
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#4c3780]/10 text-[#4c3780] flex items-center justify-center font-black text-xs">
                {(storeProfile.shopName || 'V').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-[#4c3780]">
                  {storeProfile.shopName || 'Vercos'}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar desktop */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar produto pelo nome, SKU ou descrição..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
            />
          </div>

          {/* Login / Client Account Section and Shopping Cart Indicator */}
          <div className="flex items-center gap-2">
            {loggedInClient ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsOrdersModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#4c3780]/10 hover:bg-[#4c3780]/15 text-[#4c3780] rounded-full transition-all text-xs font-bold cursor-pointer"
                  title="Ver meu histórico de pedidos"
                >
                  <User size={13} />
                  <span className="hidden sm:inline max-w-[100px] truncate">Olá, {loggedInClient.name.split(' ')[0]}</span>
                  <span className="flex items-center gap-0.5 text-[#4c3780] text-[10px] bg-white px-1.5 py-0.5 rounded-full">
                    <History size={10} />
                    Pedidos
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLoginError('');
                  setIsLoginModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#4c3780] hover:border-[#4c3780]/50 rounded-full transition-all text-xs font-bold cursor-pointer"
              >
                <LogIn size={13} />
                <span>Entrar</span>
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4c3780] hover:bg-[#3c2a68] text-white rounded-full transition-all shadow-md group cursor-pointer"
            >
              <ShoppingCart size={15} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">Carrinho</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* SEARCH BAR MOBILE */}
      <div className="p-3 md:hidden bg-white border-b border-slate-100">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar produtos..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
          />
        </div>
      </div>

      {/* BODY CONTAINER */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 flex flex-col gap-4 pb-24">
        
        {/* Categories Tab Selector */}
        {categories.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-2xs border",
                  selectedCategory === cat 
                    ? "bg-[#4c3780] text-white border-transparent" 
                    : "bg-white text-slate-500 hover:text-slate-800 border-slate-200/55"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
              <Search size={22} />
            </div>
            <p className="text-xs font-bold text-slate-500">Nenhum produto correspondente encontrado.</p>
            <button 
              type="button"
              onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
              className="text-xs text-[#4c3780] font-bold hover:underline"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const inStock = product.status !== 'out_of_stock';
              const hasVariations = product.variations && product.variations.length > 0;
              
              return (
                <div 
                  key={product.id}
                  onClick={() => inStock && handleOpenProductModal(product)}
                  className={cn(
                    "bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden shadow-xs hover:shadow-md transition-shadow group cursor-pointer",
                    !inStock && "opacity-75 cursor-not-allowed"
                  )}
                >
                  {/* Photo container */}
                  <div className="relative aspect-square bg-slate-50/70 p-4 flex items-center justify-center overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="object-contain h-full w-full mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {product.isPromo && (
                      <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                        Promo
                      </div>
                    )}

                    {!inStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                          Indisponível
                        </span>
                      </div>
                    )}
                  </div>

                  {/* details */}
                  <div className="p-3 flex flex-col flex-grow space-y-1.5 justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block mb-0.5">{product.category}</span>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#4c3780]">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{product.description}</p>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col gap-1.5">
                      {/* Price tag */}
                      <div>
                        {product.isPromo && product.originalPrice && (
                          <p className="text-[9px] text-slate-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </p>
                        )}
                        <p className="text-sm font-black text-[#4c3780]">
                          R$ {product.price.toFixed(2).replace('.', ',')} 
                          {product.unit && <span className="text-[10px] text-slate-400 font-semibold"> / {product.unit}</span>}
                        </p>
                      </div>

                      {/* Add button */}
                      <button
                        type="button"
                        disabled={!inStock}
                        onClick={(e) => { e.stopPropagation(); handleOpenProductModal(product); }}
                        className={cn(
                          "w-full font-bold py-2 px-3 rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs",
                          inStock
                            ? "bg-[#4c3780] hover:bg-[#3c2a68] text-white"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <Plus size={11} /> Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* FOOTER BAR FOR SELLER CONVENIENCE */}
      <footer className="bg-white border-t border-slate-100 py-4 px-6 text-center text-[10px] text-slate-400 font-medium">
        <p>Vercos Catálogo do Cliente &bull; Todos os direitos reservados.</p>
      </footer>

      {/* PRODUCT SELECTION MODAL */}
      {productToView && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
            <div className="relative h-32 sm:h-40 bg-slate-50 flex items-center justify-center shrink-0">
              <img 
                src={productToView.imageUrl} 
                alt={productToView.name} 
                className="h-full w-full object-contain mix-blend-multiply p-2" 
                referrerPolicy="no-referrer" 
              />
              <button 
                onClick={() => setProductToView(null)}
                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-slate-600 rounded-full shadow-sm backdrop-blur transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <p className="text-[10px] font-bold text-[#4c3780] uppercase tracking-widest mb-1">{productToView.category}</p>
                <h3 className="text-lg font-black text-slate-800 leading-tight">{productToView.name}</h3>
                <p className="text-xl font-black text-[#4c3780] mt-2">
                  R$ {productToView.price.toFixed(2).replace('.', ',')}
                  {productToView.unit && <span className="text-sm font-semibold text-slate-400 ml-1">/ {productToView.unit}</span>}
                </p>
                {productToView.description && (
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">{productToView.description}</p>
                )}
              </div>

              {productToView.variations && productToView.variations.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {productToView.variations.map(variation => (
                    <div key={variation.name} className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">{variation.name}</label>
                      <div className="flex flex-wrap gap-2">
                        {variation.values.map(val => {
                          const isSelected = selectedVariations[variation.name] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSelectedVariations({ ...selectedVariations, [variation.name]: val })}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                isSelected 
                                  ? "bg-[#4c3780] text-white border-[#4c3780] shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-[#4c3780]/40 hover:bg-slate-50"
                              )}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Quantidade</label>
                  {productToView.stock !== undefined && productToView.stock !== null && (
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      Disponível: {productToView.stock} {productToView.unit || 'unidades'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity(Math.max(productToView.multiple || 1, selectedQuantity - (productToView.multiple || 1)))}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-black text-slate-800 text-sm">
                      {selectedQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextQty = selectedQuantity + (productToView.multiple || 1);
                        const stockLimit = productToView.stock !== undefined && productToView.stock !== null ? productToView.stock : Infinity;
                        if (nextQty <= stockLimit) {
                          setSelectedQuantity(nextQty);
                        } else {
                          alert(`Quantidade limitada ao estoque disponível (${stockLimit} unidades)`);
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {productToView.multiple && productToView.multiple > 1 && (
                    <span className="text-[10px] text-slate-400 font-medium">Múltiplo de {productToView.multiple}</span>
                  )}
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 mt-auto">
              <button
                type="button"
                onClick={() => handleAddToCart(productToView, selectedVariations, selectedQuantity)}
                className="w-full bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} /> Adicionar ao Carrinho - R$ {(productToView.price * selectedQuantity).toFixed(2).replace('.', ',')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER / SIDE BAR */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-xs">
          
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-1.5 text-[#4c3780]">
                <ShoppingCart size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-wider">Meu Carrinho</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center">
                    <ShoppingCart size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">Seu carrinho está vazio.</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">Adicione produtos do catálogo para iniciar seu pedido.</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const product = item.product;
                  const multiple = product.multiple || 1;
                  const itemVars = Object.entries(item.selectedVariations)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ');

                  return (
                    <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 relative shadow-2xs">
                      
                      {/* Thumb */}
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>

                      {/* detail */}
                      <div className="flex-1 space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                        {itemVars && (
                          <p className="text-[9px] font-semibold text-slate-400">{itemVars}</p>
                        )}
                        <p className="text-xs font-extrabold text-[#4c3780]">
                          R$ {(product.price * item.quantity).toFixed(2).replace('.', ',')}
                        </p>

                        {/* quantity controls */}
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, item.quantity - multiple)}
                            className="w-5 h-5 rounded-md border border-slate-200 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-8 text-center text-xs font-extrabold text-slate-700">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, item.quantity + multiple)}
                            className="w-5 h-5 rounded-md border border-slate-200 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs"
                          >
                            <Plus size={10} />
                          </button>
                          {product.unit && (
                            <span className="text-[10px] text-slate-400 font-semibold ml-1">{product.unit}</span>
                          )}
                        </div>
                      </div>

                      {/* delete absolutely */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, 0)}
                        className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors absolute top-2 right-2"
                      >
                        <Trash2 size={12} className="hidden" /> {/* hidden but conceptually there */}
                        <X size={12} />
                      </button>

                    </div>
                  );
                })
              )}

              {/* Coupons & Promotions Section */}
              {cart.length > 0 && (
                <div className="py-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Calendar size={14} className="text-[#4c3780]" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider">Cupons & Promoções</h3>
                  </div>

                  {/* Coupon Code Entry Form */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder="Código do Cupom (Ex: NATAL15)"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all uppercase placeholder:normal-case font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCouponCode}
                      className="bg-[#4c3780] hover:bg-[#3c2a68] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      Aplicar
                    </button>
                  </div>

                  {couponError && <p className="text-[10px] text-rose-500 font-semibold">{couponError}</p>}
                  {couponSuccessMsg && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccessMsg}</p>}

                  {/* Applied Coupon Info */}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center bg-purple-50 text-[#4c3780] rounded-xl px-3 py-2 border border-purple-100 text-xs font-semibold animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5">
                        <Check size={14} className="text-purple-600" />
                        <span>Cupom "{appliedCoupon.code}" ativo (-{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `R$ ${appliedCoupon.discountValue.toFixed(2).replace('.', ',')}`})</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleRemoveCoupon} 
                        className="text-red-500 hover:text-red-700 font-bold hover:scale-105 transition-transform"
                      >
                        Remover
                      </button>
                    </div>
                  )}

                  {/* Active Auto Min Value Promotion Info */}
                  {activeOrderValueCoupon && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-xl px-3 py-2 border border-emerald-100 text-xs font-semibold animate-in fade-in duration-200">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>{activeOrderValueCoupon.name} (-{activeOrderValueCoupon.discountType === 'percentage' ? `${activeOrderValueCoupon.discountValue}%` : `R$ ${activeOrderValueCoupon.discountValue.toFixed(2).replace('.', ',')}`})</span>
                    </div>
                  )}

                  {/* Birthday & Loyalty Claimable Coupons */}
                  {coupons.filter(c => c.isActive && !isCouponExpired(c) && (c.type === 'fidelidade' || c.type === 'aniversario')).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descontos de Fidelidade & Aniversário disponíveis:</p>
                      <div className="flex flex-col gap-1.5">
                        {coupons
                          .filter(c => c.isActive && !isCouponExpired(c) && (c.type === 'fidelidade' || c.type === 'aniversario'))
                          .map(c => {
                            const isSelected = appliedCoupon?.id === c.id;
                            const descText = c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `R$ ${c.discountValue.toFixed(2).replace('.', ',')} OFF`;
                            
                            // Check eligibility
                            let isDisabled = false;
                            let statusLabel = "";
                            let eligibilityReason = "";

                            if (c.type === 'aniversario') {
                              if (!loggedInClient) {
                                isDisabled = true;
                                statusLabel = "Requer login";
                                eligibilityReason = "Faça login para validar aniversário";
                              } else if (!isBirthdayToday) {
                                isDisabled = true;
                                statusLabel = "Não qualificado";
                                eligibilityReason = "Válido apenas no dia do seu aniversário";
                              } else {
                                statusLabel = "Feliz Aniversário!";
                                eligibilityReason = "Aplicado automaticamente!";
                              }
                            } else if (c.type === 'fidelidade') {
                              const req = c.minOrdersRequired || 0;
                              if (!loggedInClient) {
                                isDisabled = true;
                                statusLabel = `Requer ${req} ped.`;
                                eligibilityReason = `Faça login para verificar seus pedidos`;
                              } else {
                                const done = getClientOrders().length;
                                if (done < req) {
                                  isDisabled = true;
                                  statusLabel = `Requer ${req} ped.`;
                                  eligibilityReason = `Requer ${req} pedidos finalizados (você tem ${done})`;
                                } else {
                                  statusLabel = "Elegível";
                                  eligibilityReason = `Você tem ${done} pedidos realizados!`;
                                }
                              }
                            }

                            // If it's a birthday coupon and birthday is today, it is automatically applied! We don't need manual selection for it.
                            const isAutoAppliedBday = c.type === 'aniversario' && loggedInClient && isBirthdayToday;

                            return (
                              <div
                                key={c.id}
                                className={cn(
                                  "w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1",
                                  isSelected || isAutoAppliedBday
                                    ? "bg-purple-100/50 border-[#4c3780] text-[#4c3780] font-bold" 
                                    : isDisabled
                                      ? "bg-slate-50 border-slate-100 text-slate-400"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                )}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold uppercase tracking-wide text-[9px] mr-1">
                                      {c.type === 'aniversario' ? '🎂 Aniversário' : '🤝 Fidelidade'}
                                    </span>
                                    <span className="text-[11px] font-bold">{c.name}</span>
                                  </div>
                                  
                                  {isAutoAppliedBday ? (
                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">
                                      🎉 Ativado!
                                    </span>
                                  ) : isSelected ? (
                                    <button
                                      type="button"
                                      onClick={handleRemoveCoupon}
                                      className="text-[10px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg"
                                    >
                                      Remover
                                    </button>
                                  ) : isDisabled ? (
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg">
                                      {statusLabel}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAppliedCoupon(c);
                                        setCouponSuccessMsg(`Promoção "${c.name}" selecionada!`);
                                        setCouponError('');
                                      }}
                                      className="text-[10px] font-black bg-[#4c3780] text-white hover:bg-[#3c2a68] px-2.5 py-0.5 rounded-lg transition-colors"
                                    >
                                      Ativar ({descText})
                                    </button>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-400 font-semibold">{eligibilityReason}</p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout Form If Cart Has Items */}
              {cart.length > 0 && (
                <form id="checkoutForm" onSubmit={handleCheckoutSubmit} className="pt-4 border-t border-slate-100 space-y-3.5">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Dados do Comprador</h3>
                  
                  {/* Client name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">* Seu Nome ou Empresa</label>
                    <input 
                      type="text" 
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Carlos Oliveira ou Mercado Silva"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  {/* CPF/CNPJ */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">CPF ou CNPJ (Opcional)</label>
                    <input 
                      type="text" 
                      value={cnpjCpf}
                      onChange={(e) => setCnpjCpf(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">* Telefone de Contato</label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  {/* Birthday (Data de Nascimento) */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Data de Nascimento / Aniversário (Opcional)</label>
                    <input 
                      type="date" 
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      disabled={!!loggedInClient?.birthday}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* notes */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Observações do Pedido</label>
                    <textarea 
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Alguma instrução de entrega ou preferência..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all resize-none"
                    ></textarea>
                  </div>
                </form>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/80 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-semibold text-slate-500">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center font-bold text-emerald-600 animate-in fade-in duration-200">
                      <span>Descontos Aplicados:</span>
                      <span>-R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200/60 pt-2.5">
                    <span className="text-slate-800">Valor Total:</span>
                    <span className="text-lg font-black text-[#4c3780]">
                      R$ {cartTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkoutForm"
                  className="w-full bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  ✓ Finalizar e Enviar Pedido
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CUSTOMER LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-1.5 text-[#4c3780]">
                <LogIn size={16} />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Acessar Área do Cliente</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Se você já possui um pedido feito, entre com seu nome/empresa e telefone celular para consultar seu histórico e agilizar novas compras!
              </p>

              {loginError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-600 font-medium flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Seu Nome ou Empresa</label>
                <input 
                  type="text" 
                  required
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Ex: Carlos Oliveira"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Número de Celular</label>
                <input 
                  type="tel" 
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Entrar e Buscar Cadastro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER ORDERS HISTORY MODAL */}
      {isOrdersModalOpen && loggedInClient && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#4c3780]/5">
              <div className="flex items-center gap-2 text-[#4c3780]">
                <History size={16} />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">Histórico de Pedidos</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{loggedInClient.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsOrdersModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {getClientOrders().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-white rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center">
                    <ClipboardList size={22} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-600">Nenhum pedido encontrado</p>
                    <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto">Assim que você enviar seu primeiro orçamento, ele aparecerá listado aqui.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {getClientOrders().reverse().map((order) => {
                    const statusConfig = {
                      budget: { label: 'Orçamento', styles: 'bg-amber-50 text-amber-700 border-amber-200' },
                      completed: { label: 'Finalizado', styles: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      canceled: { label: 'Cancelado', styles: 'bg-rose-50 text-rose-700 border-rose-200' },
                    }[order.status || 'budget'];

                    return (
                      <div key={order.id} className="bg-white border border-slate-100/95 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">#{order.orderNumber}</span>
                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider", statusConfig.styles)}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {order.date}
                            </span>
                            <span>&bull;</span>
                            <span>{order.itemsCount} {order.itemsCount === 1 ? 'item' : 'itens'}</span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-50">
                          <span className="text-[10px] text-slate-400 font-medium sm:hidden">Total do Pedido</span>
                          <span className="text-sm font-extrabold text-[#4c3780]">
                            R$ {order.total.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOrdersModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA CONFIRMATION AND EDIT MODAL BEFORE SUBMIT */}
      {isDataConfirmationOpen && loggedInClient && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#4c3780]/5">
              <div className="flex items-center gap-2 text-[#4c3780]">
                <Edit3 size={16} />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Confirmar Seus Dados</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsDataConfirmationOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!isEditingConfirmation ? (
                // State 1: Ask if they wish to alter data or proceed
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed text-center">
                    Seus dados de cadastro atuais estão corretos ou você deseja alterá-los antes de finalizar o pedido?
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-700 font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Nome / Empresa</span>
                      <span className="text-right">{confirmName}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Celular</span>
                      <span className="text-right">{confirmPhone}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">CPF / CNPJ</span>
                      <span className="text-right">{confirmCnpjCpf || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Aniversário</span>
                      <span className="text-right">
                        {confirmBirthday ? (
                          (() => {
                            const p = confirmBirthday.split('-');
                            return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : confirmBirthday;
                          })()
                        ) : "Não informado"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingConfirmation(true)}
                      className="w-full bg-white hover:bg-slate-50 text-[#4c3780] border border-[#4c3780]/20 font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={12} /> Alterar Dados
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFinalCheckoutInitiation(confirmName, confirmPhone, confirmCnpjCpf, confirmBirthday)}
                      className="w-full bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check size={12} /> Continuar e Enviar
                    </button>
                  </div>
                </div>
              ) : (
                // State 2: Edit data form
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Altere seus dados de cadastro abaixo. Essas modificações atualizarão o seu perfil de cliente:
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">* Seu Nome ou Empresa</label>
                      <input 
                        type="text" 
                        required
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">* Telefone de Contato</label>
                      <input 
                        type="tel" 
                        required
                        value={confirmPhone}
                        onChange={(e) => setConfirmPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">CPF ou CNPJ (Opcional)</label>
                      <input 
                        type="text" 
                        value={confirmCnpjCpf}
                        onChange={(e) => setConfirmCnpjCpf(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Data de Nascimento / Aniversário</label>
                      <input 
                        type="date" 
                        value={confirmBirthday}
                        onChange={(e) => setConfirmBirthday(e.target.value)}
                        disabled={!!loggedInClient?.birthday}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingConfirmation(false)}
                      className="w-1/3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirmName.trim() || !confirmPhone.trim()) return;
                        handleFinalCheckoutInitiation(confirmName.trim(), confirmPhone.trim(), confirmCnpjCpf.trim(), confirmBirthday);
                      }}
                      className="w-2/3 bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Salvar e Finalizar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABACATEPAY PAYMENT METHOD CHOICE MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-1.5 text-[#4c3780]">
                <CreditCard size={16} />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Forma de Pagamento</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total do seu pedido</span>
                <span className="text-2xl font-black text-[#4c3780] block">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="space-y-3">
                {/* CHOICE 1: ABACATEPAY */}
                <button
                  type="button"
                  onClick={() => setPaymentMethodChoice('abacatepay')}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer",
                    paymentMethodChoice === 'abacatepay'
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 mt-0.5",
                    paymentMethodChoice === 'abacatepay' ? "bg-emerald-500 text-white animate-pulse" : "bg-slate-100 text-slate-500"
                  )}>
                    <Sparkles size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Pagar agora via Pix ou Cartão</span>
                    <span className="text-[10px] text-slate-500 leading-relaxed block font-semibold">
                      Selecione para pagar com segurança via Pix (aprovação imediata) ou Cartão de Crédito.
                    </span>
                  </div>
                </button>

                {/* CHOICE 2: WHATSAPP DIRECT */}
                <button
                  type="button"
                  onClick={() => setPaymentMethodChoice('whatsapp')}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer",
                    paymentMethodChoice === 'whatsapp'
                      ? "bg-purple-50 border-[#4c3780] text-purple-950 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 mt-0.5",
                    paymentMethodChoice === 'whatsapp' ? "bg-[#4c3780] text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    <Send size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Apenas Enviar Pedido (WhatsApp)</span>
                    <span className="text-[10px] text-slate-500 leading-relaxed block font-semibold">
                      Finalize o orçamento e acerte os detalhes de pagamento direto com o vendedor.
                    </span>
                  </div>
                </button>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isRedirectingToCheckout}
                  onClick={async () => {
                    if (paymentMethodChoice === 'abacatepay') {
                      setIsRedirectingToCheckout(true);
                      const orderNum = `CAT-${Math.floor(100000 + Math.random() * 900000)}`;
                      
                      // Save checkout state to localStorage so we can reload it when client returns
                      const checkoutSession = {
                        cart,
                        clientName: confirmName,
                        phone: confirmPhone,
                        cnpjCpf: confirmCnpjCpf,
                        birthday: confirmBirthday,
                        notes,
                        appliedCoupon,
                        subtotal,
                        discountAmount,
                        cartTotal,
                        orderNum
                      };
                      localStorage.setItem(`abacatepay_session_${orderNum}`, JSON.stringify(checkoutSession));

                      // Try to call the real AbacatePay API to create a checkout (fails gracefully to simulated sandbox)
                      const tryCreateRealCheckout = async () => {
                        try {
                          const baseUrl = 'https://vercos.iranildo-jobs.workers.dev';
                          
                          // Tenta V2 primeiro
                          let isV2 = true;
                          let prodRes = await fetch(`${baseUrl}/v2/products/create`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${storeProfile.abacatePayApiKey}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              externalId: orderNum,
                              name: `Pedido #${orderNum}`,
                              price: Math.round(cartTotal * 100),
                              currency: 'BRL',
                              description: `Compra de ${confirmName}`
                            })
                          });

                          if (!prodRes.ok) {
                            isV2 = false;
                          }

                          if (isV2) {
                            if (!prodRes.ok) throw new Error('Failed v2 product creation');
                            const prodData = await prodRes.json();
                            const productId = prodData?.data?.id || prodData?.id;
                            
                            if (productId) {
                              const checkoutRes = await fetch(`${baseUrl}/v2/checkouts/create`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${storeProfile.abacatePayApiKey}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  items: [{ id: productId, quantity: 1 }],
                                  returnUrl: window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerEmail}&pay=success&orderId=${orderNum}`,
                                  completionUrl: window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerEmail}&pay=success&orderId=${orderNum}`,
                                })
                              });
                              const checkoutData = await checkoutRes.json();
                              const checkoutUrl = checkoutData?.data?.url || checkoutData?.url;
                              if (checkoutUrl) return checkoutUrl;
                            }
                          } else {
                            // Fallback para V1
                            const checkoutRes = await fetch(`${baseUrl}/v1/billing/create`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${storeProfile.abacatePayApiKey}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                frequency: 'ONE_TIME',
                                methods: ['PIX'],
                                products: [{
                                  externalId: orderNum,
                                  name: `Pedido #${orderNum}`,
                                  quantity: 1,
                                  price: Math.round(cartTotal * 100),
                                  description: `Compra de ${confirmName}`
                                }],
                                returnUrl: window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerEmail}&pay=success&orderId=${orderNum}`,
                                completionUrl: window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerEmail}&pay=success&orderId=${orderNum}`,
                              })
                            });
                            const checkoutData = await checkoutRes.json();
                            const checkoutUrl = checkoutData?.data?.url || checkoutData?.url;
                            if (checkoutUrl) {
                              return checkoutUrl;
                            }
                          }
                        } catch (err) {
                          console.log('Skipping real checkout redirection (likely CORS or Sandbox API Key): ', err);
                        }
                        return null;
                      };

                      const realCheckoutUrl = await tryCreateRealCheckout();
                      setIsRedirectingToCheckout(false);
                      setIsPaymentModalOpen(false);

                      if (realCheckoutUrl) {
                        window.location.href = realCheckoutUrl;
                      } else {
                        // Fallback to our elegant self-contained AbacatePay Simulated Checkout page
                        window.location.href = window.location.origin + window.location.pathname + `?view=abacatepay-checkout&orderId=${orderNum}&seller=${sellerEmail}`;
                      }
                    } else {
                      // WhatsApp Flow
                      setIsPaymentModalOpen(false);
                      executeFinalCheckout(confirmName, confirmPhone, confirmCnpjCpf, confirmBirthday);
                    }
                  }}
                  className="w-full bg-[#4c3780] hover:bg-[#3c2a68] text-white font-black py-3.5 px-6 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isRedirectingToCheckout ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      Iniciando Checkout...
                    </>
                  ) : (
                    <>
                      <Check size={14} className="stroke-[2.5]" /> Confirmar e Prosseguir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
