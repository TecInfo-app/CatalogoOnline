import { useState, useMemo, useEffect } from 'react';
import { Order, Product, Client } from '../../types';
import { Building2, Package, Info, Search, Plus, List, Edit2, Send, Check, UserSquare2, X, Printer, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getClients, getProducts, getStoreProfile } from '../../lib/store';

interface OrderFormProps {
  userEmail: string;
  orderToEdit?: Order | null;
  onSave: (order: Partial<Order>) => void;
  onCancel: () => void;
  onNavigate: (tab: string) => void;
}

export function OrderForm({ userEmail, orderToEdit, onSave, onCancel, onNavigate }: OrderFormProps) {
  const storeProfile = useMemo(() => getStoreProfile(userEmail), [userEmail]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientList, setShowClientList] = useState(false);
  const [showProductList, setShowProductList] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [orderItems, setOrderItems] = useState<{
    product: Product;
    quantity: number;
    price: number;
    priceTable?: string;
    discount1?: number;
    discount2?: number;
    addition1?: number;
    addition2?: number;
    additionalInfo?: string;
  }[]>([]);

  // Product configuration modal states
  const [productConfiguring, setProductConfiguring] = useState<Product | null>(null);
  const [configuringQuantity, setConfiguringQuantity] = useState(1);
  const [configuringPriceTable, setConfiguringPriceTable] = useState('Preço de Tabela');
  const [configuringBasePrice, setConfiguringBasePrice] = useState(0);
  const [configuringDiscount1, setConfiguringDiscount1] = useState(0);
  const [configuringDiscount2, setConfiguringDiscount2] = useState(0);
  const [configuringAddition1, setConfiguringAddition1] = useState(0);
  const [configuringAddition2, setConfiguringAddition2] = useState(0);
  const [configuringAdditionalInfo, setConfiguringAdditionalInfo] = useState('');

  // Details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderType, setOrderType] = useState('Venda');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [installments, setInstallments] = useState(1);
  
  useEffect(() => {
    const loadedClients = getClients(userEmail);
    const loadedProducts = getProducts(userEmail);
    setClients(loadedClients);
    setProducts(loadedProducts);

    if (orderToEdit) {
      if (orderToEdit.clientId) {
        const client = loadedClients.find(c => c.id === orderToEdit.clientId);
        if (client) setSelectedClient(client);
      } else {
        const client = loadedClients.find(c => c.name === orderToEdit.clientName);
        if (client) setSelectedClient(client);
      }
      
      setOrderNumber(orderToEdit.orderNumber);
      setOrderType(orderToEdit.orderType || 'Venda');
      setPaymentMethod(orderToEdit.paymentMethod || '');
      setDueDate(orderToEdit.dueDate || '');
      setInstallments(orderToEdit.installments || 1);
      
      if (orderToEdit.items) {
        const itemsToSet = orderToEdit.items.map(i => {
           const p = loadedProducts.find(p => p.id === i.productId);
           return {
             product: p || { id: i.productId, name: i.name, price: i.price, sku: '', stock: 0, status: 'in_stock', imageUrl: '' },
             quantity: i.quantity,
             price: i.price
           };
        });
        setOrderItems(itemsToSet as any);
      }
    } else {
      setOrderNumber(Math.floor(Math.random() * 10000).toString());
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setDueDate(nextMonth.toISOString().split('T')[0]);
      setInstallments(1);

      const preselectedClientStr = sessionStorage.getItem('preselected_order_client');
      if (preselectedClientStr) {
        try {
          const preselected = JSON.parse(preselectedClientStr);
          const matched = loadedClients.find(c => c.id === preselected.id);
          if (matched) {
            setSelectedClient(matched);
          }
          sessionStorage.removeItem('preselected_order_client');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [userEmail, orderToEdit]);

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;
    const lower = clientSearchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.legalName.toLowerCase().includes(lower) || 
      c.cnpj.includes(clientSearchTerm)
    );
  }, [clients, clientSearchTerm]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.description?.toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  const openProductConfigModal = (product: Product) => {
    const existing = orderItems.find(item => item.product.id === product.id);
    if (existing) {
      setProductConfiguring(product);
      setConfiguringQuantity(existing.quantity);
      setConfiguringPriceTable(existing.priceTable || 'Preço de Tabela');
      setConfiguringBasePrice(product.price);
      setConfiguringDiscount1(existing.discount1 || 0);
      setConfiguringDiscount2(existing.discount2 || 0);
      setConfiguringAddition1(existing.addition1 || 0);
      setConfiguringAddition2(existing.addition2 || 0);
      setConfiguringAdditionalInfo(existing.additionalInfo || '');
    } else {
      setProductConfiguring(product);
      setConfiguringQuantity(1);
      setConfiguringPriceTable('Preço de Tabela');
      setConfiguringBasePrice(product.price);
      setConfiguringDiscount1(0);
      setConfiguringDiscount2(0);
      setConfiguringAddition1(0);
      setConfiguringAddition2(0);
      setConfiguringAdditionalInfo('');
    }
  };

  const handleAddProduct = (product: Product) => {
    openProductConfigModal(product);
    setShowProductList(false);
    setSearchTerm('');
  };

  const removeProduct = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return;
    setOrderItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const getPriceTables = (price: number) => [
    { name: 'Preço de Tabela', value: price, label: `R$ ${price.toFixed(2).replace('.', ',')} - Preço de Tabela` },
    { name: 'Preço Distribuidor (5%)', value: price * 0.95, label: `R$ ${(price * 0.95).toFixed(2).replace('.', ',')} - Preço Distribuidor (5% desc)` },
    { name: 'Preço Atacado (10%)', value: price * 0.90, label: `R$ ${(price * 0.90).toFixed(2).replace('.', ',')} - Preço Atacado (10% desc)` },
    { name: 'Preço Especial (15%)', value: price * 0.85, label: `R$ ${(price * 0.85).toFixed(2).replace('.', ',')} - Preço Especial (15% desc)` },
  ];

  const selectedTableObj = productConfiguring ? (getPriceTables(configuringBasePrice).find(t => t.name === configuringPriceTable) || { value: configuringBasePrice }) : { value: 0 };
  const currentBasePrice = selectedTableObj.value;

  // sequential calculation of discounts and additions (cascading)
  let netPrice = currentBasePrice;
  if (configuringDiscount1 > 0) {
    netPrice = netPrice * (1 - configuringDiscount1 / 100);
  }
  if (configuringDiscount2 > 0) {
    netPrice = netPrice * (1 - configuringDiscount2 / 100);
  }
  if (configuringAddition1 > 0) {
    netPrice = netPrice * (1 + configuringAddition1 / 100);
  }
  if (configuringAddition2 > 0) {
    netPrice = netPrice * (1 + configuringAddition2 / 100);
  }

  const configuringSubtotal = netPrice * configuringQuantity;

  const handleConfirmAddProduct = () => {
    if (!productConfiguring) return;
    
    setOrderItems(prev => {
      const exists = prev.find(item => item.product.id === productConfiguring.id);
      const newItem = {
        product: productConfiguring,
        quantity: configuringQuantity,
        price: netPrice,
        priceTable: configuringPriceTable,
        discount1: configuringDiscount1,
        discount2: configuringDiscount2,
        addition1: configuringAddition1,
        addition2: configuringAddition2,
        additionalInfo: configuringAdditionalInfo
      };

      if (exists) {
        return prev.map(item => item.product.id === productConfiguring.id ? newItem : item);
      }
      return [...prev, newItem];
    });

    setProductConfiguring(null);
  };

  const totalValue = orderItems.reduce((acc, item) => acc + ((item.price ?? item.product.price) * item.quantity), 0);
  const [isGeneratingAsaas, setIsGeneratingAsaas] = useState(false);
  const [asaasStatusMsg, setAsaasStatusMsg] = useState('');

  const handleGenerateOrder = async () => {
    if (!selectedClient) {
      alert("Selecione um cliente para gerar o pedido.");
      return;
    }
    if (orderItems.length === 0) {
      alert("Adicione pelo menos um produto ao pedido.");
      return;
    }

    let asaasData = {
      dueDate: undefined as string | undefined,
      installments: undefined as number | undefined,
      asaasPaymentId: undefined as string | undefined,
      asaasUrl: undefined as string | undefined,
      asaasStatus: undefined as 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'SIMULATED' | undefined
    };

    if (paymentMethod === 'Boleto') {
      setIsGeneratingAsaas(true);
      setAsaasStatusMsg(storeProfile.asaasEnabled ? "Conectando ao Asaas..." : "Iniciando simulação do Asaas...");

      try {
        const cleanCpfCnpj = selectedClient.cnpj ? selectedClient.cnpj.replace(/\D/g, '') : '';
        
        if (storeProfile.asaasEnabled && storeProfile.asaasApiKey) {
          const workerUrl = 'https://vercos.iranildo-jobs.workers.dev';
          const pathPrefix = storeProfile.asaasEnvironment === 'production' 
            ? '/asaas-production'
            : '/asaas-sandbox';

          const baseUrl = `${workerUrl}${pathPrefix}`;

          setAsaasStatusMsg("Verificando cadastro de cliente no Asaas...");
          let customerId = '';

          // 1. Search customer by CPF/CNPJ
          if (cleanCpfCnpj) {
            try {
              const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpfCnpj}`, {
                method: 'GET',
                headers: {
                  'access_token': storeProfile.asaasApiKey,
                  'Content-Type': 'application/json'
                }
              });
              if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.data && searchData.data.length > 0) {
                  customerId = searchData.data[0].id;
                }
              }
            } catch (e) {
              console.warn("Error searching customer", e);
            }
          }

          // 2. Create customer if not found
          if (!customerId) {
            setAsaasStatusMsg("Cadastrando novo cliente no Asaas...");
            const safeEmail = selectedClient.email || `${selectedClient.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")}@exemplo.com`;
            const customerPayload = {
              name: selectedClient.name,
              cpfCnpj: cleanCpfCnpj || undefined,
              email: safeEmail,
              phone: selectedClient.phones?.[0] || undefined
            };

            const createCustRes = await fetch(`${baseUrl}/customers`, {
              method: 'POST',
              headers: {
                'access_token': storeProfile.asaasApiKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(customerPayload)
            });

            if (createCustRes.ok) {
              const custData = await createCustRes.json();
              customerId = custData.id;
            } else {
              throw new Error('Falha ao criar cliente no Asaas. Por favor, verifique se o CPF/CNPJ está correto.');
            }
          }

          // 3. Create payment (installment or single)
          setAsaasStatusMsg(installments > 1 ? `Emitindo cobrança parcelada (${installments}x) no Asaas...` : 'Emitindo cobrança de parcela única no Asaas...');
          const paymentPayload: any = {
            customer: customerId,
            billingType: 'BOLETO',
            dueDate: dueDate,
            description: `Pedido #${orderNumber || 'Auto'}`,
            externalReference: orderNumber
          };

          if (installments > 1) {
            paymentPayload.installmentCount = installments;
            paymentPayload.totalValue = totalValue;
          } else {
            paymentPayload.value = totalValue;
          }

          const createPayRes = await fetch(`${baseUrl}/payments`, {
            method: 'POST',
            headers: {
              'access_token': storeProfile.asaasApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentPayload)
          });

          if (!createPayRes.ok) {
            const errorData = await createPayRes.json().catch(() => ({}));
            const errorMsg = errorData.errors?.[0]?.description || 'Erro ao gerar cobrança no Asaas';
            throw new Error(errorMsg);
          }

          const payData = await createPayRes.json();
          asaasData = {
            dueDate: dueDate,
            installments: installments,
            asaasPaymentId: payData.installment || payData.id || '',
            asaasUrl: payData.invoiceUrl || payData.bankSlipUrl || `https://sandbox.asaas.com/simulado/fatura?id=${payData.id}`,
            asaasStatus: 'PENDING'
          };
          
          setAsaasStatusMsg("Cobrança gerada com sucesso!");
        } else {
          // Simulated Asaas response
          await new Promise(resolve => setTimeout(resolve, 1500));
          asaasData = {
            dueDate: dueDate,
            installments: installments,
            asaasPaymentId: `sim_${Math.random().toString(36).substr(2, 9)}`,
            asaasUrl: `https://sandbox.asaas.com/simulado/fatura?id=${Math.floor(Math.random()*1000000)}&value=${totalValue}&installments=${installments}`,
            asaasStatus: 'SIMULATED'
          };
          setAsaasStatusMsg("Simulação concluída!");
        }
      } catch (err: any) {
        console.error("Asaas Payment Generation failed", err);
        alert(`Não foi possível gerar a cobrança no Asaas de forma real devido a restrições de rede/CORS ou dados de cliente inválidos.\n\nDetalhe do erro: ${err.message || 'Sem conexão com Asaas'}\n\nO pedido será salvo normalmente com faturamento simulado para visualização.`);
        
        asaasData = {
          dueDate: dueDate,
          installments: installments,
          asaasPaymentId: `sim_${Math.random().toString(36).substr(2, 9)}`,
          asaasUrl: `https://sandbox.asaas.com/simulado/fatura?id=${Math.floor(Math.random()*1000000)}&value=${totalValue}&installments=${installments}`,
          asaasStatus: 'SIMULATED'
        };
      } finally {
        setIsGeneratingAsaas(false);
      }
    }

    onSave({
      id: orderToEdit ? orderToEdit.id : Date.now().toString(),
      orderNumber: orderNumber,
      date: orderToEdit ? orderToEdit.date : new Date().toLocaleDateString('pt-BR'),
      clientName: selectedClient.name,
      clientId: selectedClient.id,
      status: paymentMethod ? 'completed' : (orderToEdit ? orderToEdit.status : 'budget'),
      itemsCount: orderItems.reduce((acc, item) => acc + item.quantity, 0),
      total: totalValue,
      paymentMethod,
      orderType,
      items: orderItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      })),
      ...asaasData
    });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 relative">
      {isGeneratingAsaas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Integração Asaas</h3>
            <p className="text-sm text-slate-600 font-semibold">{asaasStatusMsg}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aguarde, processando transação...</p>
          </div>
        </div>
      )}
      
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <button onClick={onCancel} className="text-[#851b42] text-sm hover:underline font-bold">
          &larr; Voltar
        </button>
        <h2 className="text-xl font-bold text-slate-800">{orderToEdit ? 'Editar Pedido' : 'Novo Pedido'}</h2>
      </div>

      <div className="flex flex-col gap-6 max-w-5xl pb-24">
        
        {/* CLIENTE */}
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserSquare2 size={20} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">CLIENTE</h3>
            </div>
            {selectedClient && (
               <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                 Cliente selecionado: {selectedClient.name}
               </div>
            )}
          </div>
          
          <div className="pl-7">
            <div className="relative mb-4">
               {selectedClient ? (
                 <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50 rounded px-3 py-2 text-sm">
                   <div className="flex flex-col">
                     <span className="font-bold text-slate-800">{selectedClient.name}</span>
                     <span className="text-slate-500 text-xs">{selectedClient.cnpj} &bull; {selectedClient.location}</span>
                   </div>
                   <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-red-500 p-1">
                     <X size={16} />
                   </button>
                 </div>
               ) : (
                 <input 
                   type="text" 
                   placeholder="Digite o nome ou CNPJ/CPF do cliente e selecione" 
                   value={clientSearchTerm}
                   onChange={(e) => setClientSearchTerm(e.target.value)}
                   onFocus={() => setShowClientList(true)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]"
                 />
               )}
               {showClientList && !selectedClient && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-20 max-h-60 overflow-y-auto">
                   {filteredClients.length > 0 ? filteredClients.map(client => (
                     <div 
                       key={client.id} 
                       onClick={() => { setSelectedClient(client); setShowClientList(false); setClientSearchTerm(''); }}
                       className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex flex-col"
                     >
                       <span className="font-bold text-sm text-slate-800">{client.name}</span>
                       <span className="text-xs text-slate-500">{client.cnpj}</span>
                     </div>
                   )) : (
                     <div className="p-3 text-sm text-slate-500 text-center">Nenhum cliente encontrado.</div>
                   )}
                 </div>
               )}
            </div>
            
            {!selectedClient && (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onNavigate('clients')}
                  className="border border-slate-300 text-[#851b42] px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  Novo cliente
                </button>
                <button 
                  onClick={() => setShowClientList(!showClientList)}
                  className="text-[#851b42] text-sm hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <List size={14} /> Listar todos clientes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* REPRESENTADA */}
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={20} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
              REPRESENTADA <Info size={14} className="text-slate-400" />
            </h3>
          </div>
          <div className="pl-7">
            <div className="text-sm font-medium text-[#851b42]">
              {storeProfile.shopName || storeProfile.name || 'Minha Loja'}
            </div>
            {storeProfile.phone && (
              <div className="text-sm text-slate-500 mt-1 flex items-center gap-2 border-l-2 border-blue-400 pl-2 ml-1">
                {storeProfile.phone}
              </div>
            )}
          </div>
        </div>

        {/* PRODUTOS */}
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package size={20} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">PRODUTOS</h3>
          </div>
          
          <div className="pl-7">
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Digite o código ou o nome do produto para adicionar ao pedido" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowProductList(true)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]"
              />
              {showProductList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-20 max-h-60 overflow-y-auto">
                   {filteredProducts.length > 0 ? filteredProducts.map(product => (
                     <div 
                       key={product.id} 
                       onClick={() => handleAddProduct(product)}
                       className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                     >
                       <div className="flex flex-col">
                         <span className="font-bold text-sm text-slate-800">{product.name}</span>
                         <span className="text-xs text-slate-500">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                       </div>
                       <Plus size={16} className="text-[#851b42]" />
                     </div>
                   )) : (
                     <div className="p-3 text-sm text-slate-500 text-center">Nenhum produto encontrado.</div>
                   )}
                 </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => onNavigate('products')}
                className="border border-slate-300 text-[#851b42] px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                Novo produto
              </button>
              <button 
                onClick={() => setShowProductList(!showProductList)}
                className="text-[#851b42] text-sm hover:underline flex items-center gap-1 cursor-pointer"
              >
                <List size={14} /> Listar todos produtos
              </button>
            </div>

            {orderItems.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Produto</th>
                      <th className="p-3 w-32 text-center">Qtd</th>
                      <th className="p-3 w-32 text-right">Preço Líquido</th>
                      <th className="p-3 w-32 text-right">Subtotal</th>
                      <th className="p-3 w-24 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map(item => (
                      <tr key={item.product.id} className="border-b border-slate-100 last:border-0">
                        <td className="p-3 font-medium text-slate-800">
                          <div>{item.product.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                            {item.priceTable && item.priceTable !== 'Preço de Tabela' && (
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold font-sans">
                                {item.priceTable}
                              </span>
                            )}
                            {(item.discount1 || 0) > 0 && (
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold font-sans">
                                -{item.discount1}% desc
                              </span>
                            )}
                            {(item.discount2 || 0) > 0 && (
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold font-sans">
                                -{item.discount2}% desc (2)
                              </span>
                            )}
                            {(item.addition1 || 0) > 0 && (
                              <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-semibold font-sans">
                                +{item.addition1}% acrésc
                              </span>
                            )}
                            {(item.addition2 || 0) > 0 && (
                              <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-semibold font-sans">
                                +{item.addition2}% acrésc (2)
                              </span>
                            )}
                            {item.additionalInfo && (
                              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold font-sans italic max-w-xs truncate" title={item.additionalInfo}>
                                Obs: "{item.additionalInfo}"
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                            className="w-16 border border-slate-300 rounded px-2 py-1 text-center"
                          />
                        </td>
                        <td className="p-3 text-right">R$ {(item.price ?? item.product.price).toFixed(2).replace('.', ',')}</td>
                        <td className="p-3 text-right font-bold">R$ {((item.price ?? item.product.price) * item.quantity).toFixed(2).replace('.', ',')}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              type="button"
                              onClick={() => openProductConfigModal(item.product)}
                              className="text-[#851b42] hover:text-[#5e132e] p-1 rounded hover:bg-slate-100 transition-colors"
                              title="Editar especificações"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => removeProduct(item.product.id)} 
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Remover produto"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="p-3 text-right text-slate-600 uppercase tracking-wider">Total do Pedido</td>
                      <td className="p-3 text-right text-lg text-[#851b42]">R$ {totalValue.toFixed(2).replace('.', ',')}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

          </div>
        </div>

        {/* DETALHES DO PEDIDO */}
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Info size={20} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">DETALHES DO PEDIDO</h3>
          </div>
          
          {isEditingDetails ? (
            <div className="pl-7 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">* Número do pedido</label>
                  <input type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#851b42]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data de emissão</label>
                  <input type="text" value={new Date().toLocaleDateString('pt-BR')} disabled className="w-full border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">* Tipo de pedido</label>
                  <select value={orderType} onChange={e => setOrderType(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#851b42]">
                    <option value="Venda">Venda</option>
                    <option value="Compra">Compra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">* Vendedor</label>
                  <input type="text" value="iranildo" disabled className="w-full border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">Pagamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">* Condição de pagamento</label>
                      <select 
                        value={paymentMethod} 
                        onChange={e => setPaymentMethod(e.target.value)} 
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#851b42]"
                      >
                        <option value="">Selecione...</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Boleto">Boleto (Asaas)</option>
                      </select>
                    </div>

                    {paymentMethod === 'Boleto' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                            Configuração do Boleto
                          </span>
                          {!storeProfile.asaasEnabled && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                              Modo Simulação
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              * Vencimento (1ª)
                            </label>
                            <input 
                              type="date" 
                              required
                              value={dueDate} 
                              onChange={e => setDueDate(e.target.value)} 
                              className="w-full border border-slate-300 rounded bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              * Parcelas
                            </label>
                            <select 
                              value={installments} 
                              onChange={e => setInstallments(parseInt(e.target.value) || 1)} 
                              className="w-full border border-slate-300 rounded bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                            >
                              {Array.from({ length: 12 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}x</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Demonstrativo de Parcelas
                          </span>
                          <div className="space-y-1 max-h-36 overflow-y-auto">
                            {Array.from({ length: installments }).map((_, i) => {
                              const valuePerInstallment = totalValue / installments;
                              const currentDueDate = new Date(dueDate + 'T12:00:00');
                              currentDueDate.setMonth(currentDueDate.getMonth() + i);
                              
                              return (
                                <div key={i} className="flex justify-between items-center text-xs font-semibold py-1 border-b border-dashed border-slate-100 last:border-0 text-slate-700">
                                  <span>Parcela {i + 1}/{installments}</span>
                                  <span className="text-slate-400 font-normal">Vencimento: {currentDueDate.toLocaleDateString('pt-BR')}</span>
                                  <span className="text-blue-600 font-bold">R$ {valuePerInstallment.toFixed(2).replace('.', ',')}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-between items-center text-xs font-black text-slate-800 border-t border-slate-200 pt-2.5 mt-2">
                            <span>TOTAL DO PARCELAMENTO</span>
                            <span className="text-sm text-blue-600 font-extrabold">R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {paymentMethod === 'Boleto' && (
                    <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-4 text-xs text-blue-800 space-y-2.5">
                      <h5 className="font-bold uppercase tracking-wider text-[10px] text-blue-900">
                        {storeProfile.asaasEnabled ? "💡 INTEGRAÇÃO ASAAS ATIVA" : "ℹ️ INFORMAÇÃO DA INTEGRAÇÃO"}
                      </h5>
                      <p className="leading-relaxed text-slate-600 font-medium">
                        {storeProfile.asaasEnabled 
                          ? `Ao confirmar este pedido, o sistema enviará os dados de ${selectedClient?.name || 'Cliente'} para o Asaas e gerará um parcelamento de ${installments}x de forma automatizada.`
                          : "A API do Asaas não está configurada no painel de Configurações, então o sistema irá gerar uma fatura em modo de simulação inteligente para visualização e testes dos fluxos."
                        }
                      </p>
                      <p className="leading-relaxed text-slate-500 font-medium">
                        O cliente receberá o link da fatura contendo o código de barras do Boleto e o Pix de forma integrada para realizar o pagamento.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setIsEditingDetails(false)} className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 font-bold">
                  Concluir edição
                </button>
              </div>
            </div>
          ) : (
            <div className="pl-7 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
              <div className="space-y-4">
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">* Nº do pedido</span>
                  <span className="text-slate-800 font-medium">{orderNumber || 'Auto'}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">Data da emissão</span>
                  <span className="text-slate-800 font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">* Tipo de pedido</span>
                  <span className="text-slate-800 font-medium">{orderType}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">Vendedor</span>
                  <span className="text-slate-800 font-medium">iranildo</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">Contato no cliente</span>
                  <span className={cn("font-medium", selectedClient?.phones?.[0] ? "text-slate-800" : "text-slate-400")}>
                    {selectedClient?.phones?.[0] || '---'}
                  </span>
                </div>
                <div className="grid grid-cols-2 mt-4 pt-4 border-t border-slate-100">
                  <span className="text-slate-400">Informações Adicionais</span>
                  <span className="text-slate-400">---</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">* Cond. de pagamento</span>
                  <span className={cn("font-medium", paymentMethod ? "text-slate-800" : "text-slate-400")}>
                    {paymentMethod === 'Boleto' ? `Boleto (${installments}x)` : (paymentMethod || '---')}
                  </span>
                </div>
                {paymentMethod === 'Boleto' && (
                  <>
                    <div className="grid grid-cols-2">
                      <span className="text-slate-400">1º Vencimento</span>
                      <span className="text-slate-800 font-medium">
                        {dueDate ? new Date(dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-slate-400">Valor da parcela</span>
                      <span className="text-blue-600 font-bold">
                        R$ {(totalValue / installments).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">Valor do frete</span>
                  <span className="text-slate-400">---</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">Transportadora</span>
                  <span className="text-slate-400">---</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">Rastreamento</span>
                  <span className="text-slate-400">---</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-400">End. de entrega</span>
                  <span className={cn("font-medium", selectedClient?.location && selectedClient.location !== 'Não informada' ? "text-slate-800" : "text-slate-400")}>
                    {selectedClient?.location && selectedClient.location !== 'Não informada' ? selectedClient.location : 'Endereço principal do cliente'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {!isEditingDetails && (
            <div className="pl-7 mt-6">
              <button 
                onClick={() => setIsEditingDetails(true)}
                className="border border-slate-300 text-[#851b42] px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={12} /> Alterar detalhes do pedido
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 md:left-56 bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap gap-3 z-30 justify-between sm:justify-start items-center">
        <button 
          onClick={handleGenerateOrder}
          className="bg-[#851b42] hover:bg-[#5e132e] text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <Check size={16} /> {orderToEdit ? 'Salvar alterações' : 'Gerar pedido'}
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Printer size={16} className="text-slate-400" /> Imprimir
        </button>
        <button 
          onClick={() => {
            let phone = selectedClient?.phones?.[0] ? selectedClient.phones[0].replace(/\D/g, '') : '';
            if (phone && !phone.startsWith('55')) {
              phone = '55' + phone;
            }
            const itemList = orderItems.map(i => `${i.quantity}x ${i.product.name} (R$ ${i.product.price.toFixed(2).replace('.', ',')})`).join('\n');
            const totalStr = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;
            const message = `Olá ${selectedClient?.name || ''},\n\nSegue o resumo do seu pedido #${orderNumber || 'Auto'}:\n\n${itemList}\n\n*Total: ${totalStr}*\nTipo: ${orderType}\nPagamento: ${paymentMethod || 'Não informado'}\n\nObrigado!`;
            
            const text = encodeURIComponent(message);
            const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
            window.open(url, '_blank');
          }}
          className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Send size={16} /> Enviar por whatsapp
        </button>
      </div>

      {/* AREA DE IMPRESSÃO EXCLUSIVA */}
      <div id="printable-order-receipt" className="hidden print:block bg-white p-6 text-black font-sans text-xs">
        {/* CABEÇALHO DA LOJA */}
        <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
          <h2 className="text-lg font-black uppercase tracking-wide">{storeProfile.shopName || storeProfile.name || 'Minha Loja'}</h2>
          {storeProfile.phone && <p className="text-xs text-slate-600 mt-1">Contato: {storeProfile.phone}</p>}
          {storeProfile.email && <p className="text-xs text-slate-500">{storeProfile.email}</p>}
          <div className="mt-3 inline-block bg-slate-100 px-3 py-1 rounded font-bold uppercase tracking-wider text-[10px]">
            COMPROVANTE DE PEDIDO
          </div>
        </div>

        {/* INFORMAÇÕES DO PEDIDO */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs border-b border-slate-100 pb-3">
          <div>
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Identificação</p>
            <p className="font-bold text-sm text-slate-800 mt-0.5">Pedido #{orderNumber || 'Auto'}</p>
            <p className="text-slate-600 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="text-slate-600">Tipo: <span className="font-semibold">{orderType}</span></p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Vendedor</p>
            <p className="font-semibold text-slate-700 mt-0.5">{storeProfile.name || 'Vendedor'}</p>
            <p className="text-slate-600 mt-1">Pagamento: <span className="font-bold text-[#851b42]">{paymentMethod || 'Não informado'}</span></p>
          </div>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="bg-slate-50 p-3 rounded-lg mb-4 text-xs border border-slate-100">
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider mb-1.5">Dados do Cliente</p>
          <div className="space-y-1">
            <p className="text-slate-800"><strong className="text-slate-600">Nome:</strong> {selectedClient?.name || 'Não informado'}</p>
            {selectedClient?.cnpj && <p className="text-slate-800"><strong className="text-slate-600">CPF/CNPJ:</strong> {selectedClient.cnpj}</p>}
            {selectedClient?.phones?.[0] && <p className="text-slate-800"><strong className="text-slate-600">Telefone:</strong> {selectedClient.phones[0]}</p>}
            <p className="text-slate-800"><strong className="text-slate-600">Endereço de Entrega:</strong> {selectedClient?.location && selectedClient.location !== 'Não informada' ? selectedClient.location : 'Endereço principal do cliente'}</p>
          </div>
        </div>

        {/* ITENS DO PEDIDO */}
        <div className="mb-4">
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider mb-2">Produtos / Itens</p>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2">Item/Descrição</th>
                <th className="py-2 text-center w-16">Qtd</th>
                <th className="py-2 text-right w-24">Unitário</th>
                <th className="py-2 text-right w-24">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={item.product.id || idx} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-800">
                    {item.product.name}
                    {item.product.sku && <span className="block text-[10px] text-slate-400 font-normal">REF: {item.product.sku}</span>}
                    {item.priceTable && item.priceTable !== 'Preço de Tabela' && (
                      <span className="block text-[9px] text-slate-500 font-normal">{item.priceTable}</span>
                    )}
                  </td>
                  <td className="py-2 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-2 text-right text-slate-700">R$ {(item.price ?? item.product.price).toFixed(2).replace('.', ',')}</td>
                  <td className="py-2 text-right font-bold text-slate-800">R$ {((item.price ?? item.product.price) * item.quantity).toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESUMO DE VALORES */}
        <div className="border-t border-dashed border-slate-300 pt-3 flex flex-col items-end text-xs space-y-1">
          <div className="flex justify-between w-48 text-slate-600">
            <span>Subtotal:</span>
            <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between w-48 text-slate-600">
            <span>Frete:</span>
            <span>R$ 0,00</span>
          </div>
          <div className="flex justify-between w-48 text-slate-600">
            <span>Descontos:</span>
            <span>R$ 0,00</span>
          </div>
          <div className="flex justify-between w-48 text-base font-black text-slate-800 border-t border-slate-100 pt-1.5 mt-1">
            <span>TOTAL:</span>
            <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {/* RODAPÉ DO COMPROVANTE */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-6 mt-8">
          <p>Obrigado pela preferência!</p>
          <p className="mt-1">Sistema de Gestão Vitrine Pay</p>
        </div>
      </div>

      {/* MODAL DE CONFIGURAÇÃO DO PRODUTO */}
      {productConfiguring && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black text-[#851b42] uppercase tracking-wider bg-[#851b42]/5 px-2 py-0.5 rounded">
                  CONFIGURAR PRODUTO
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  {productConfiguring.name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setProductConfiguring(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Product description and Comprado label */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                <div className="text-slate-600 leading-relaxed max-w-[280px]">
                  {productConfiguring.description || (
                    <>
                      Produto de excelente qualidade selecionado para integrar o pedido do cliente. 
                      Fabricado com materiais de alta resistência, ideal para o dia a dia.
                    </>
                  )}
                </div>
                <div className="shrink-0 text-right font-sans">
                  <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">COMPRADO</span>
                  <span className="font-extrabold text-slate-700 text-sm">---</span>
                </div>
              </div>

              {/* Tabelas de Preço */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide font-sans">Tabelas de Preço</label>
                <select
                  value={configuringPriceTable}
                  onChange={(e) => setConfiguringPriceTable(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-semibold focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42] outline-none cursor-pointer"
                >
                  {getPriceTables(configuringBasePrice).map((t, idx) => (
                    <option key={idx} value={t.name}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Quantidade e Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide font-sans">Quantidade</label>
                  <div className="flex border border-slate-300 rounded-lg overflow-hidden w-full bg-white focus-within:border-[#851b42] focus-within:ring-1 focus-within:ring-[#851b42]">
                    <input
                      type="number"
                      min="1"
                      value={configuringQuantity}
                      onChange={(e) => setConfiguringQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm text-slate-700 outline-none text-center font-bold"
                    />
                    <span className="bg-slate-50 border-l border-slate-200 text-slate-500 text-xs font-bold px-3 flex items-center shrink-0">
                      {productConfiguring.unit || 'Unidade'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-150 p-2.5 rounded-lg flex flex-col justify-center text-[11px] font-semibold text-slate-400 space-y-1 h-[42px]">
                  <span className="flex items-center gap-1">
                    Peso bruto: <strong className="text-slate-600">{productConfiguring.weight || '2,350 kg'}</strong>
                    <Info size={11} className="text-slate-300 inline" />
                  </span>
                  <span>
                    Volume: <strong className="text-slate-600">{productConfiguring.dimensions || '0,321 m³'}</strong>
                  </span>
                </div>
              </div>

              {/* Descontos e acréscimos do vendedor */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="font-bold text-xs text-slate-500 uppercase tracking-wider font-sans">
                  Descontos e acréscimos do vendedor
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Discount 1 */}
                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1 font-sans">
                      <ArrowDown size={11} className="stroke-[2.5]" /> Desconto
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-rose-500">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0,00"
                        value={configuringDiscount1 === 0 ? '' : configuringDiscount1}
                        onChange={(e) => setConfiguringDiscount1(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-bold text-slate-700 outline-none text-right"
                      />
                      <span className="bg-slate-50 border-l border-slate-200 text-slate-400 text-[10px] px-1.5 py-1.5 font-bold">%</span>
                    </div>
                  </div>

                  {/* Discount 2 */}
                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1 font-sans">
                      <ArrowDown size={11} className="stroke-[2.5]" /> Desconto
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-rose-500">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0,00"
                        value={configuringDiscount2 === 0 ? '' : configuringDiscount2}
                        onChange={(e) => setConfiguringDiscount2(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-bold text-slate-700 outline-none text-right"
                      />
                      <span className="bg-slate-50 border-l border-slate-200 text-slate-400 text-[10px] px-1.5 py-1.5 font-bold">%</span>
                    </div>
                  </div>

                  {/* Addition 1 */}
                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 font-sans">
                      <ArrowUp size={11} className="stroke-[2.5]" /> Acréscimo
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-emerald-600">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={configuringAddition1 === 0 ? '' : configuringAddition1}
                        onChange={(e) => setConfiguringAddition1(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-bold text-slate-700 outline-none text-right"
                      />
                      <span className="bg-slate-50 border-l border-slate-200 text-slate-400 text-[10px] px-1.5 py-1.5 font-bold">%</span>
                    </div>
                  </div>

                  {/* Addition 2 */}
                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 font-sans">
                      <ArrowUp size={11} className="stroke-[2.5]" /> Acréscimo
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-emerald-600">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={configuringAddition2 === 0 ? '' : configuringAddition2}
                        onChange={(e) => setConfiguringAddition2(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-bold text-slate-700 outline-none text-right"
                      />
                      <span className="bg-slate-50 border-l border-slate-200 text-slate-400 text-[10px] px-1.5 py-1.5 font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preço Líquido e Subtotal */}
              <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                {/* Preço Líquido */}
                <div className="flex flex-col">
                  <label className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1 font-sans">Preço Líquido</label>
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <span className="text-slate-400 text-xs font-bold px-2.5">R$</span>
                    <input 
                      type="text" 
                      readOnly
                      value={netPrice.toFixed(2).replace('.', ',')}
                      className="w-full px-2 py-1.5 text-xs text-slate-700 outline-none font-extrabold text-right cursor-not-allowed bg-slate-50"
                    />
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex flex-col justify-end">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1 font-sans">Subtotal</span>
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                      $
                    </div>
                    <span className="text-slate-800 font-extrabold text-base sm:text-lg">
                      R$ {configuringSubtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Infos. adicionais */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide font-sans">Infos. adicionais:</label>
                <textarea
                  rows={2}
                  value={configuringAdditionalInfo}
                  onChange={(e) => setConfiguringAdditionalInfo(e.target.value)}
                  placeholder="Instruções específicas para faturamento, produção ou frete..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-700 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42] font-medium"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setProductConfiguring(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddProduct}
                className="px-5 py-2.5 bg-[#851b42] hover:bg-[#5e132e] text-white rounded-lg text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
