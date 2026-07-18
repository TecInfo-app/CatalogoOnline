import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Info, MoreVertical, BarChart2, PlusCircle, Printer, Calendar, FileText, ShoppingBag, Users, TrendingUp, DollarSign, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { getOrders, getClients, getProducts } from '../lib/store';

const parseOrderDate = (dateStr: string, currentYear = new Date().getFullYear()): Date | null => {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(`${y}-${m}-${d}T12:00:00`);
  } else {
    const dayMatch = dateStr.match(/^(\d{1,2})/);
    const ptMonths = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const monthIndex = ptMonths.findIndex(m => dateStr.toLowerCase().includes(m));
    
    if (dayMatch && monthIndex !== -1) {
      const d = parseInt(dayMatch[1], 10);
      const m = monthIndex;
      let y = currentYear;
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) y = parseInt(yearMatch[0], 10);
      return new Date(y, m, d, 12, 0, 0);
    }
  }
  return null;
};

export function IndicatorsView({ userEmail }: { userEmail: string }) {
  const [activeTab, setActiveTab] = useState<'panel' | 'reports'>('panel');
  const [selectedReport, setSelectedReport] = useState<'summary' | 'clients' | 'products' | 'detailed'>('summary');

  const [totalVendidoMes, setTotalVendidoMes] = useState(0);
  const [totalVendidoHoje, setTotalVendidoHoje] = useState(0);
  const [totalPrevisao, setTotalPrevisao] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [positivados, setPositivados] = useState(0);
  const [catalogClientsCount, setCatalogClientsCount] = useState(0);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  const [chartData, setChartData] = useState<{name: string, current: number | null, goal: number | null, previsao: number | null, vendidoDia: number | null, previsaoDia: number | null}[]>([]);

  const [activeModal, setActiveModal] = useState<'carteira' | 'positivacao' | 'b2b' | null>(null);

  // Carteira Detailed Data
  const [carteiraAtivosList, setCarteiraAtivosList] = useState<{id: string, name: string, phone: string, lastOrder: string, totalOrders: number}[]>([]);
  const [carteiraInativosRecentesList, setCarteiraInativosRecentesList] = useState<{id: string, name: string, phone: string, lastOrder: string, totalOrders: number}[]>([]);
  const [carteiraInativosAntigosList, setCarteiraInativosAntigosList] = useState<{id: string, name: string, phone: string, lastOrder: string, totalOrders: number}[]>([]);
  const [carteiraProspectsList, setCarteiraProspectsList] = useState<{id: string, name: string, phone: string, date: string}[]>([]);

  // Positivação Detailed Data
  const [positivadosNovosList, setPositivadosNovosList] = useState<{id: string, name: string, phone: string, orderDate: string, amount: number}[]>([]);
  const [positivadosAtivosList, setPositivadosAtivosList] = useState<{id: string, name: string, phone: string, orderDate: string, amount: number, previousOrderDate: string}[]>([]);
  const [positivadosInativosRecentesList, setPositivadosInativosRecentesList] = useState<{id: string, name: string, phone: string, orderDate: string, amount: number, previousOrderDate: string}[]>([]);
  const [positivadosInativosAntigosList, setPositivadosInativosAntigosList] = useState<{id: string, name: string, phone: string, orderDate: string, amount: number, previousOrderDate: string}[]>([]);

  // B2B Catalog Detailed Data
  const [b2bComPedidosList, setB2bComPedidosList] = useState<{id: string, name: string, phone: string, ordersCount: number, totalSpent: number, lastOrderDate: string}[]>([]);
  const [b2bSemPedidosList, setB2bSemPedidosList] = useState<{id: string, name: string, phone: string, location: string}[]>([]);

  const reportData = useMemo(() => {
    const orders = getOrders(userEmail);
    const clients = getClients(userEmail);
    const products = getProducts(userEmail);
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    const currentYear = today.getFullYear();
    
    // Filter orders in range
    const periodOrders = orders.filter(order => {
      const oDate = parseOrderDate(order.date, currentYear);
      return oDate && oDate >= start && oDate <= end;
    });
    
    const completedOrders = periodOrders.filter(o => o.status === 'completed');
    const budgetOrders = periodOrders.filter(o => o.status === 'budget');
    
    const totalCompleted = completedOrders.reduce((acc, o) => acc + o.total, 0);
    const totalBudget = budgetOrders.reduce((acc, o) => acc + o.total, 0);
    const averageTicket = completedOrders.length > 0 ? totalCompleted / completedOrders.length : 0;
    
    // 1. Group sales by day for Summary Report
    const salesByDayMap: { [dateStr: string]: { completed: number; budget: number; count: number } } = {};
    periodOrders.forEach(order => {
      const dStr = order.date;
      if (!salesByDayMap[dStr]) {
        salesByDayMap[dStr] = { completed: 0, budget: 0, count: 0 };
      }
      salesByDayMap[dStr].count += 1;
      if (order.status === 'completed') {
        salesByDayMap[dStr].completed += order.total;
      } else if (order.status === 'budget') {
        salesByDayMap[dStr].budget += order.total;
      }
    });
    
    const salesByDayList = Object.entries(salesByDayMap).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => {
      const da = parseOrderDate(a.date, currentYear) || new Date();
      const db = parseOrderDate(b.date, currentYear) || new Date();
      return da.getTime() - db.getTime();
    });

    // 2. Group by Clients
    const clientSalesMap: { [clientName: string]: { name: string; cnpj: string; count: number; total: number } } = {};
    completedOrders.forEach(order => {
      const name = order.clientName || 'Cliente Consumidor';
      if (!clientSalesMap[name]) {
        const matchedClient = clients.find(c => c.name === name || c.legalName === name);
        clientSalesMap[name] = {
          name,
          cnpj: matchedClient?.cnpj || 'Não cadastrado',
          count: 0,
          total: 0
        };
      }
      clientSalesMap[name].count += 1;
      clientSalesMap[name].total += order.total;
    });
    const clientSalesList = Object.values(clientSalesMap).sort((a, b) => b.total - a.total);
    
    // 3. Group by Products
    const productSalesMap: { [prodId: string]: { name: string; sku: string; qty: number; total: number } } = {};
    completedOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const key = item.productId || item.name;
          if (!productSalesMap[key]) {
            const matchedProd = products.find(p => p.id === item.productId || p.name === item.name);
            productSalesMap[key] = {
              name: item.name,
              sku: matchedProd?.sku || 'N/A',
              qty: 0,
              total: 0
            };
          }
          productSalesMap[key].qty += item.quantity;
          productSalesMap[key].total += item.quantity * item.price;
        });
      } else {
        const key = 'fallback_others';
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: 'Produtos Gerais / Avulsos',
            sku: 'DIVERSOS',
            qty: 0,
            total: 0
          };
        }
        productSalesMap[key].qty += order.itemsCount || 1;
        productSalesMap[key].total += order.total;
      }
    });
    const productSalesList = Object.values(productSalesMap).sort((a, b) => b.total - a.total);

    return {
      periodOrders,
      completedOrders,
      budgetOrders,
      totalCompleted,
      totalBudget,
      averageTicket,
      salesByDayList,
      clientSalesList,
      productSalesList,
      uniqueClientsCount: clientSalesList.length,
      totalItemsCount: productSalesList.reduce((acc, p) => acc + p.qty, 0)
    };
  }, [userEmail, startDate, endDate]);

  useEffect(() => {
    const orders = getOrders(userEmail);
    const clients = getClients(userEmail);

    const todayDateStr = new Date().toLocaleDateString('pt-BR');
    const thisMonthStr = todayDateStr.substring(3); // e.g. "07/2026"
    
    // Calculate days between startDate and endDate for chart
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const maxDaysInChart = Math.min(daysInPeriod, 31); // Limit to 31 points to avoid overcrowded chart
    
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();

    let mes = 0;
    let hoje = 0;
    let previsaoTotal = 0;
    const clientsPosIds = new Set<string>();
    const catalogClientsIds = new Set<string>();

    const dailySales = new Array(maxDaysInChart).fill(0);
    const dailyBudget = new Array(maxDaysInChart).fill(0);

    orders.forEach(order => {
      const oDate = parseOrderDate(order.date, today.getFullYear());
      if (oDate) {
        if (oDate >= start && oDate <= end) {
          if (order.orderNumber && order.orderNumber.includes('CAT-') && order.clientId) {
            catalogClientsIds.add(order.clientId);
          }
          if (order.status === 'completed') {
            mes += order.total;
            if (order.clientId) clientsPosIds.add(order.clientId);
            
            // Map date to chart index
            const diffDays = Math.floor((oDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < maxDaysInChart) {
              dailySales[diffDays] += order.total;
            }
          } else if (order.status === 'budget') {
            previsaoTotal += order.total;
            const diffDays = Math.floor((oDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < maxDaysInChart) {
              dailyBudget[diffDays] += order.total;
            }
          }
        }
        
        // Keep 'hoje' as literal today regardless of filter, or maybe within filter? Let's keep it literal today.
        if (order.date === todayDateStr && order.status === 'completed') {
          hoje += order.total;
        }
      }
    });

    let runningTotal = 0;
    let runningBudget = 0;
    const newChartData = Array.from({ length: maxDaysInChart }, (_, i) => {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const isPastOrToday = d.getTime() <= today.getTime() + 24*60*60*1000;
      
      runningTotal += dailySales[i];
      runningBudget += dailyBudget[i];
      
      const formatDay = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
      
      return {
        name: formatDay,
        current: runningTotal > 0 || isPastOrToday ? runningTotal : null,
        previsao: runningBudget > 0 || isPastOrToday ? runningBudget : null,
        vendidoDia: dailySales[i],
        previsaoDia: dailyBudget[i],
        goal: null
      };
    });

    // Group orders by client
    const clientOrdersMap = new Map<string, typeof orders>();
    orders.forEach(order => {
      if (order.clientId) {
        const existing = clientOrdersMap.get(order.clientId) || [];
        existing.push(order);
        clientOrdersMap.set(order.clientId, existing);
      } else if (order.clientName) {
        const matchedClient = clients.find(c => c.name.toLowerCase() === order.clientName?.toLowerCase() || c.legalName.toLowerCase() === order.clientName?.toLowerCase());
        if (matchedClient) {
          const existing = clientOrdersMap.get(matchedClient.id) || [];
          existing.push(order);
          clientOrdersMap.set(matchedClient.id, existing);
        }
      }
    });

    const nowTime = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    const tempAtivos: typeof carteiraAtivosList = [];
    const tempInativosRecentes: typeof carteiraInativosRecentesList = [];
    const tempInativosAntigos: typeof carteiraInativosAntigosList = [];
    const tempProspects: typeof carteiraProspectsList = [];

    const tempPosNovos: typeof positivadosNovosList = [];
    const tempPosAtivos: typeof positivadosAtivosList = [];
    const tempPosInativosRecentes: typeof positivadosInativosRecentesList = [];
    const tempPosInativosAntigos: typeof positivadosInativosAntigosList = [];

    const tempB2bComPedidos: typeof b2bComPedidosList = [];
    const tempB2bSemPedidos: typeof b2bSemPedidosList = [];

    clients.forEach(client => {
      const clientOrders = clientOrdersMap.get(client.id) || [];
      const completedOrders = clientOrders.filter(o => o.status === 'completed');
      
      // Calculate latest order
      let latestOrder: typeof orders[0] | null = null;
      let latestOrderDate: Date | null = null;
      
      completedOrders.forEach(o => {
        const d = parseOrderDate(o.date, today.getFullYear());
        if (d) {
          if (!latestOrderDate || d > latestOrderDate) {
            latestOrderDate = d;
            latestOrder = o;
          }
        }
      });

      const phone = client.phones?.[0] || 'Sem telefone';

      // 1. CARTEIRA CLASSIFICATION
      if (completedOrders.length === 0) {
        tempProspects.push({
          id: client.id,
          name: client.name || client.legalName,
          phone,
          date: 'Sem pedidos'
        });
      } else if (latestOrderDate) {
        const age = nowTime - (latestOrderDate as Date).getTime();
        const info = {
          id: client.id,
          name: client.name || client.legalName,
          phone,
          lastOrder: latestOrder ? (latestOrder as any).date : 'N/A',
          totalOrders: completedOrders.length
        };
        if (age <= thirtyDaysMs) {
          tempAtivos.push(info);
        } else if (age <= ninetyDaysMs) {
          tempInativosRecentes.push(info);
        } else {
          tempInativosAntigos.push(info);
        }
      }

      // 2. POSITIVAÇÃO IN THIS PERIOD (start to end)
      const periodCompletedOrders = completedOrders.filter(o => {
        const d = parseOrderDate(o.date, today.getFullYear());
        return d && d >= start && d <= end;
      });

      if (periodCompletedOrders.length > 0) {
        let firstPeriodOrder = periodCompletedOrders[0];
        let firstPeriodOrderDate = parseOrderDate(firstPeriodOrder.date, today.getFullYear()) || new Date();
        periodCompletedOrders.forEach(o => {
          const d = parseOrderDate(o.date, today.getFullYear());
          if (d && d < firstPeriodOrderDate) {
            firstPeriodOrderDate = d;
            firstPeriodOrder = o;
          }
        });

        const ordersBefore = completedOrders.filter(o => {
          const d = parseOrderDate(o.date, today.getFullYear());
          return d && d < firstPeriodOrderDate;
        });

        const periodOrderTotal = periodCompletedOrders.reduce((acc, o) => acc + o.total, 0);

        if (ordersBefore.length === 0) {
          tempPosNovos.push({
            id: client.id,
            name: client.name || client.legalName,
            phone,
            orderDate: firstPeriodOrder.date,
            amount: periodOrderTotal
          });
        } else {
          let latestBefore: typeof orders[0] | null = null;
          let latestBeforeDate: Date | null = null;
          ordersBefore.forEach(o => {
            const d = parseOrderDate(o.date, today.getFullYear());
            if (d) {
              if (!latestBeforeDate || d > latestBeforeDate) {
                latestBeforeDate = d;
                latestBefore = o;
              }
            }
          });

          if (latestBeforeDate) {
            const ageBefore = firstPeriodOrderDate.getTime() - latestBeforeDate.getTime();
            const posInfo = {
              id: client.id,
              name: client.name || client.legalName,
              phone,
              orderDate: firstPeriodOrder.date,
              amount: periodOrderTotal,
              previousOrderDate: latestBefore ? (latestBefore as any).date : 'N/A'
            };

            if (ageBefore <= thirtyDaysMs) {
              tempPosAtivos.push(posInfo);
            } else if (ageBefore <= ninetyDaysMs) {
              tempPosInativosRecentes.push(posInfo);
            } else {
              tempPosInativosAntigos.push(posInfo);
            }
          } else {
            tempPosNovos.push({
              id: client.id,
              name: client.name || client.legalName,
              phone,
              orderDate: firstPeriodOrder.date,
              amount: periodOrderTotal
            });
          }
        }
      }

      // 3. B2B CATALOG ENGAGEMENT
      const isB2bClient = client.location === 'Cadastro via Catálogo' || clientOrders.some(o => o.orderNumber && o.orderNumber.includes('CAT-'));
      if (isB2bClient) {
        const catalogOrders = clientOrders.filter(o => o.orderNumber && o.orderNumber.includes('CAT-'));
        if (catalogOrders.length > 0) {
          const totalSpent = catalogOrders.reduce((acc, o) => acc + o.total, 0);
          tempB2bComPedidos.push({
            id: client.id,
            name: client.name || client.legalName,
            phone,
            ordersCount: catalogOrders.length,
            totalSpent,
            lastOrderDate: latestOrder ? (latestOrder as any).date : 'N/A'
          });
        } else {
          tempB2bSemPedidos.push({
            id: client.id,
            name: client.name || client.legalName,
            phone,
            location: client.location || 'Cadastro via Catálogo'
          });
        }
      }
    });

    setCarteiraAtivosList(tempAtivos);
    setCarteiraInativosRecentesList(tempInativosRecentes);
    setCarteiraInativosAntigosList(tempInativosAntigos);
    setCarteiraProspectsList(tempProspects);

    setPositivadosNovosList(tempPosNovos);
    setPositivadosAtivosList(tempPosAtivos);
    setPositivadosInativosRecentesList(tempPosInativosRecentes);
    setPositivadosInativosAntigosList(tempPosInativosAntigos);

    setB2bComPedidosList(tempB2bComPedidos);
    setB2bSemPedidosList(tempB2bSemPedidos);

    setTotalVendidoMes(mes);
    setTotalVendidoHoje(hoje);
    setTotalPrevisao(previsaoTotal);
    setTotalClients(clients.length);
    setPositivados(tempPosNovos.length + tempPosAtivos.length + tempPosInativosRecentes.length + tempPosInativosAntigos.length);
    setCatalogClientsCount(tempB2bComPedidos.length);
    setChartData(newChartData);
  }, [userEmail, startDate, endDate]);

  return (
    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6">
      {/* Printable Header - Visible ONLY when printing */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 uppercase tracking-wide">Cia do Chopp - Sistema de Vendas</h1>
            <p className="text-sm text-slate-600">
              Relatório: <span className="font-semibold text-slate-800">
                {selectedReport === 'summary' ? 'Resumo Geral de Vendas' :
                 selectedReport === 'clients' ? 'Vendas por Cliente' :
                 selectedReport === 'products' ? 'Vendas por Produto' : 'Listagem de Pedidos Detalhada'}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Período Selecionado: {startDate.split('-').reverse().join('/')} até {endDate.split('-').reverse().join('/')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{userEmail}</p>
            <p className="text-xs text-slate-500 mt-0.5">Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Hidden on Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex space-x-4 border-b border-outline-variant w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('panel')}
            className={`pb-2 font-headline-sm font-semibold transition-colors ${activeTab === 'panel' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Painel
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`pb-2 font-headline-sm font-semibold transition-colors ${activeTab === 'reports' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Relatórios
          </button>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisa rápida" 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          {activeTab === 'panel' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors whitespace-nowrap text-label-md">
              <Plus size={18} />
              Adicionar Indicador
            </button>
          )}
        </div>
      </div>

      {/* Shared Period Filter - Hidden on Print */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row gap-4 items-center print:hidden">
        <span className="text-label-md text-on-surface-variant shrink-0">FILTRAR POR PERÍODO:</span>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full">
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-1/4 bg-surface border border-outline-variant rounded-md py-2 px-3 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-1/4 bg-surface border border-outline-variant rounded-md py-2 px-3 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <select className="w-full sm:w-1/2 bg-surface border border-outline-variant rounded-md py-2 px-3 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary">
            <option>Todos os vendedores</option>
          </select>
        </div>
      </div>

      {activeTab === 'panel' ? (
        <>
          {/* Evolução de Venda */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-4 md:p-6 print:hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
                Evolução de Venda
                <Info size={16} className="text-outline cursor-help" />
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-label-md text-on-surface-variant">PERÍODO SELECIONADO</span>
                <button className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="w-full h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbc4d2" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a7582' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a7582' }} />
                  <Tooltip 
                    cursor={{ stroke: '#006c49', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        if (data.current === null && data.previsao === null) return null;
                        return (
                          <div className="bg-white border border-green-500 rounded p-2 text-sm shadow-md">
                            <div className="text-slate-700 font-medium mb-1">Dia {label}:</div>
                            <div className="text-slate-600 font-bold">Vendido no dia: <span className="font-normal text-slate-800">R$ {data.vendidoDia?.toFixed(2).replace('.', ',') || '0,00'}</span></div>
                            <div className="text-green-600 font-bold">Vendas no período: <span className="font-normal text-slate-800">R$ {data.current?.toFixed(2).replace('.', ',') || '0,00'}</span></div>
                            <div className="text-orange-500 font-bold">Previsão de vendas: <span className="font-normal text-slate-800">R$ {data.previsao?.toFixed(2).replace('.', ',') || '0,00'}</span></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="linear" dataKey="previsao" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" opacity={0.5} />
                  <Line type="linear" dataKey="goal" stroke="#33186b" strokeWidth={2} dot={false} strokeDasharray="5 5" opacity={0.5} />
                  <Line type="linear" dataKey="current" stroke="#006c49" strokeWidth={2} dot={{ r: 4, fill: '#006c49' }} activeDot={{ r: 6, fill: '#006c49' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-label-md text-on-surface-variant">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> Vendas no mês</div>
              <div className="flex items-center gap-1"><span className="w-4 h-0.5 bg-primary"></span> Objetivo</div>
              <div className="flex items-center gap-1 opacity-50"><span className="w-4 h-0.5 bg-outline border-dashed border-t border-outline"></span> Previsão de vendas</div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button className="flex items-center gap-2 text-primary font-label-md hover:bg-primary-container/10 px-4 py-2 rounded-md transition-colors">
                <BarChart2 size={18} />
                Detalhar por vendedor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-4">
              <div className="text-label-md text-on-surface-variant mb-1">VENDIDO NO PERÍODO</div>
              <div className="text-headline-lg text-on-surface">R$ {totalVendidoMes.toFixed(2).replace('.', ',')}</div>
              <div className="text-body-sm text-on-surface-variant mt-1">Hoje R$ {totalVendidoHoje.toFixed(2).replace('.', ',')}</div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-label-md text-on-surface-variant mb-1">OBJETIVO DO MÊS</div>
                  <div className="text-headline-lg text-on-surface">R$ 0,00</div>
                </div>
                <button className="text-primary text-label-md hover:underline">Definir metas</button>
              </div>
              <div className="w-full bg-surface-variant h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '0%' }}></div>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/30">
                <div className="text-label-md text-on-surface-variant mb-1">NECESSÁRIO VENDER</div>
                <div className="text-headline-sm text-on-surface">R$ por dia útil</div>
                <div className="text-body-sm text-outline">Nenhuma meta definida</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
            {[
              { 
                id: 'carteira' as const,
                title: 'Carteira de Clientes', 
                period: 'MÊS ATUAL', 
                total: totalClients, 
                subtitle: 'Clientes', 
                btn: 'Detalhar carteira', 
                items: [
                  {c: 'bg-secondary', t: `${carteiraAtivosList.length} ativos`}, 
                  {c: 'bg-amber-400', t: `${carteiraInativosRecentesList.length} inativos rec.`}, 
                  {c: 'bg-error', t: `${carteiraInativosAntigosList.length} inativos ant.`}, 
                  {c: 'bg-outline', t: `${carteiraProspectsList.length} prospects`}
                ] 
              },
              { 
                id: 'positivacao' as const,
                title: 'Positivação', 
                period: 'MÊS ATUAL', 
                total: positivados, 
                subtitle: 'Clientes positivados', 
                emptyText: positivados === 0 ? 'Nenhum cliente foi positivado neste mês' : '', 
                btn: 'Detalhar positivação', 
                items: [
                  {c: 'bg-primary', t: `${positivadosNovosList.length} novos`}, 
                  {c: 'bg-secondary', t: `${positivadosAtivosList.length} ativos`}, 
                  {c: 'bg-amber-400', t: `${positivadosInativosRecentesList.length} inativos rec.`}, 
                  {c: 'bg-error', t: `${positivadosInativosAntigosList.length} inativos ant.`}
                ] 
              },
              { 
                id: 'b2b' as const,
                title: 'Catálogo Online B2B', 
                period: 'PERÍODO SELECIONADO', 
                total: b2bComPedidosList.length + b2bSemPedidosList.length, 
                subtitle: 'Clientes B2B', 
                emptyText: (b2bComPedidosList.length + b2bSemPedidosList.length) === 0 ? 'Nenhum cliente B2B cadastrado' : '', 
                btn: 'Detalhar clientes B2B', 
                items: [
                  {c: 'bg-primary', t: `${b2bComPedidosList.length} com pedidos`}, 
                  {c: 'bg-outline', t: `${b2bSemPedidosList.length} sem pedidos`}
                ] 
              }
            ].map((card, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-label-md font-bold text-on-surface flex items-center gap-1 uppercase">
                    {card.title}
                    <Info size={14} className="text-outline" />
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-on-surface-variant">{card.period}</span>
                    <button className="text-outline hover:text-on-surface"><MoreVertical size={16} /></button>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="w-24 h-24 rounded-full border-4 border-surface-variant flex flex-col items-center justify-center relative">
                    <span className="text-headline-lg text-on-surface leading-none">{card.total}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase text-center leading-tight mt-1 max-w-[60px]">{card.subtitle}</span>
                  </div>
                  {card.emptyText && <p className="text-body-sm text-outline mt-4 text-center">{card.emptyText}</p>}
                </div>
                
                <div className="grid gap-2 text-body-sm text-on-surface-variant mt-auto grid-cols-2">
                  {card.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-1 text-[11px] font-medium">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.c}`}></span> {item.t}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-outline-variant/30 text-center">
                  <button 
                    onClick={() => setActiveModal(card.id)}
                    className="text-primary text-label-md hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <BarChart2 size={16} />
                    {card.btn}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-primary font-label-md hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 mb-8 print:hidden">
            <PlusCircle size={20} />
            Adicionar Indicador
          </button>
        </>
      ) : (
        <div className="space-y-6">
          {/* Reports Navigation Bar - Hidden on print */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 print:hidden">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'summary', label: 'Resumo Geral' },
                { id: 'clients', label: 'Vendas por Cliente' },
                { id: 'products', label: 'Vendas por Produto' },
                { id: 'detailed', label: 'Listagem de Pedidos' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id as any)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedReport === r.id ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container-low text-on-surface-variant'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors whitespace-nowrap text-label-md font-semibold shadow-sm cursor-pointer"
            >
              <Printer size={18} />
              Imprimir Relatório
            </button>
          </div>

          {/* REPORT VIEWS */}
          {selectedReport === 'summary' && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <DollarSign size={18} className="text-[#006c49]" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Faturamento (Concluído)</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">R$ {reportData.totalCompleted.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-slate-500 mt-1">{reportData.completedOrders.length} pedidos finalizados</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <TrendingUp size={18} className="text-orange-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Previsão (Orçamentos)</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">R$ {reportData.totalBudget.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-slate-500 mt-1">{reportData.budgetOrders.length} orçamentos ativos</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <ShoppingBag size={18} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Ticket Médio</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">R$ {reportData.averageTicket.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-slate-500 mt-1">Por pedido fechado</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <FileText size={18} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Total de Pedidos</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{reportData.periodOrders.length}</div>
                  <p className="text-xs text-slate-500 mt-1">No período total</p>
                </div>
              </div>

              {/* Table daily sales */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    Resumo de Vendas Diário
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Histórico diário detalhado</span>
                </div>
                {reportData.salesByDayList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Nenhum pedido registrado no período selecionado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-outline-variant/30">
                          <th className="p-4">Data</th>
                          <th className="p-4 text-center">Nº Pedidos</th>
                          <th className="p-4 text-right">Faturamento (R$)</th>
                          <th className="p-4 text-right">Orçamentos (R$)</th>
                          <th className="p-4 text-right">Total Acumulado (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {reportData.salesByDayList.map((day, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 print:bg-transparent">
                            <td className="p-4 font-semibold text-slate-900">{day.date}</td>
                            <td className="p-4 text-center text-slate-700">{day.count}</td>
                            <td className="p-4 text-right text-[#006c49] font-medium">R$ {day.completed.toFixed(2).replace('.', ',')}</td>
                            <td className="p-4 text-right text-orange-500 font-medium">R$ {day.budget.toFixed(2).replace('.', ',')}</td>
                            <td className="p-4 text-right font-bold text-slate-800">R$ {(day.completed + day.budget).toFixed(2).replace('.', ',')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedReport === 'clients' && (
            <div className="space-y-6">
              {/* Clients Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Users size={18} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Clientes Ativos com Pedido</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{reportData.uniqueClientsCount}</div>
                  <p className="text-xs text-slate-500 mt-1">Total de carteira positivada</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-[#006c49] mb-1">
                    <DollarSign size={18} className="text-[#006c49]" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Faturamento Clientes</span>
                  </div>
                  <div className="text-2xl font-bold text-[#006c49]">R$ {reportData.totalCompleted.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-slate-500 mt-1">Apenas pedidos fechados</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <TrendingUp size={18} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Maior Cliente</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 truncate">
                    {reportData.clientSalesList[0]?.name || 'Nenhum'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {reportData.clientSalesList[0] ? `R$ ${reportData.clientSalesList[0].total.toFixed(2).replace('.', ',')} investidos` : 'Sem compras'}
                  </p>
                </div>
              </div>

              {/* Clients Table */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    Ranking de Compras de Clientes
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Ordenado por volume total faturado</span>
                </div>
                {reportData.clientSalesList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Nenhum faturamento registrado para clientes no período selecionado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-outline-variant/30">
                          <th className="p-4 w-16 text-center">Pos</th>
                          <th className="p-4">Cliente</th>
                          <th className="p-4">CNPJ/CPF</th>
                          <th className="p-4 text-center">Qtd Pedidos</th>
                          <th className="p-4 text-right">Ticket Médio (R$)</th>
                          <th className="p-4 text-right">Faturamento Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {reportData.clientSalesList.map((client, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 print:bg-transparent">
                            <td className="p-4 text-center font-bold text-slate-500">{idx + 1}º</td>
                            <td className="p-4 font-semibold text-slate-900">{client.name}</td>
                            <td className="p-4 text-slate-600">{client.cnpj}</td>
                            <td className="p-4 text-center text-slate-700">{client.count}</td>
                            <td className="p-4 text-right text-slate-700">R$ {(client.total / client.count).toFixed(2).replace('.', ',')}</td>
                            <td className="p-4 text-right font-bold text-[#006c49]">R$ {client.total.toFixed(2).replace('.', ',')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedReport === 'products' && (
            <div className="space-y-6">
              {/* Products Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <ShoppingBag size={18} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Itens Faturados</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{reportData.totalItemsCount}</div>
                  <p className="text-xs text-slate-500 mt-1">Unidades vendidas totais</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-[#006c49] mb-1">
                    <DollarSign size={18} className="text-[#006c49]" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Faturamento total</span>
                  </div>
                  <div className="text-2xl font-bold text-[#006c49]">R$ {reportData.totalCompleted.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-slate-500 mt-1">Receita líquida de produtos</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <TrendingUp size={18} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Produto mais vendido</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 truncate">
                    {reportData.productSalesList[0]?.name || 'Nenhum'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {reportData.productSalesList[0] ? `${reportData.productSalesList[0].qty} unidades faturadas` : 'Sem registros'}
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-primary" />
                    Ranking de Venda por Produto
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Ordenado por receita total gerada</span>
                </div>
                {reportData.productSalesList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Nenhum produto faturado no período selecionado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-outline-variant/30">
                          <th className="p-4 w-16 text-center">Pos</th>
                          <th className="p-4">Produto</th>
                          <th className="p-4">Código / SKU</th>
                          <th className="p-4 text-center">Qtd Vendida</th>
                          <th className="p-4 text-right">Preço Médio (R$)</th>
                          <th className="p-4 text-right">Receita Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {reportData.productSalesList.map((product, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 print:bg-transparent">
                            <td className="p-4 text-center font-bold text-slate-500">{idx + 1}º</td>
                            <td className="p-4 font-semibold text-slate-900">{product.name}</td>
                            <td className="p-4 text-slate-600 font-mono text-xs">{product.sku}</td>
                            <td className="p-4 text-center text-slate-700 font-medium">{product.qty}</td>
                            <td className="p-4 text-right text-slate-700">R$ {(product.total / product.qty).toFixed(2).replace('.', ',')}</td>
                            <td className="p-4 text-right font-bold text-[#006c49]">R$ {product.total.toFixed(2).replace('.', ',')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedReport === 'detailed' && (
            <div className="space-y-6">
              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <FileText size={18} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Total de Pedidos</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{reportData.periodOrders.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Registrados na data selecionada</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-[#006c49] mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#006c49]" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Pedidos Faturados</span>
                  </div>
                  <div className="text-2xl font-bold text-[#006c49]">{reportData.completedOrders.length}</div>
                  <p className="text-xs text-slate-500 mt-1">R$ {reportData.totalCompleted.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 text-orange-500 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Orçamentos</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-500">{reportData.budgetOrders.length}</div>
                  <p className="text-xs text-slate-500 mt-1">R$ {reportData.totalBudget.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-primary" />
                    Listagem Analítica de Pedidos
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Filtro completo por período</span>
                </div>
                {reportData.periodOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Nenhum pedido registrado no período selecionado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-outline-variant/30">
                          <th className="p-4">Pedido Nº</th>
                          <th className="p-4">Data</th>
                          <th className="p-4">Cliente</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Itens</th>
                          <th className="p-4 text-right">Valor Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {reportData.periodOrders.map((order, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 print:bg-transparent">
                            <td className="p-4 font-bold text-[#4c3780]">#{order.orderNumber}</td>
                            <td className="p-4 text-slate-600">{order.date}</td>
                            <td className="p-4 font-semibold text-slate-900">{order.clientName}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                order.status === 'completed' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : order.status === 'budget' 
                                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {order.status === 'completed' ? 'Concluído' : order.status === 'budget' ? 'Orçamento' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="p-4 text-center text-slate-700">{order.itemsCount || (order.items?.length || 1)}</td>
                            <td className="p-4 text-right font-bold text-slate-900">R$ {order.total.toFixed(2).replace('.', ',')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detalhamento Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="text-primary animate-pulse" size={22} />
                  {activeModal === 'carteira' && 'Detalhamento da Carteira de Clientes'}
                  {activeModal === 'positivacao' && 'Detalhamento do Indicador de Positivação'}
                  {activeModal === 'b2b' && 'Detalhamento do Catálogo Online B2B'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dados integrados e atualizados em tempo real com o sistema
                </p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Context Explanation */}
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeModal === 'carteira' && (
                    <>
                      O indicador de situação da carteira classifica os clientes em:
                      <br /><span className="font-bold text-slate-900">● Prospects</span>: clientes cadastrados que ainda não efetuaram nenhum pedido;
                      <br /><span className="font-bold text-slate-900">● Clientes ativos</span>: clientes que compraram no último ciclo de vendas;
                      <br /><span className="font-bold text-slate-900">● Clientes inativos</span>: clientes que estão há um tempo sem comprar.
                      <br /><br />
                      Essa classificação pode ser utilizada para priorizar o atendimento dos clientes e identificar oportunidades para vender ainda mais, sobretudo na parcela de clientes inativos.
                    </>
                  )}
                  {activeModal === 'positivacao' && (
                    <>
                      Com o indicador de positivação você poderá identificar o número de clientes que fizeram pedido no mês e qual era a situação desses clientes antes de serem positivados.
                      <br /><br />
                      No gráfico também é apresentado o percentual de clientes que estavam ativos no final do mês anterior e foram positivados no mês. Esse percentual lhe ajudará a entender se o volume de clientes ativos atendidos é suficiente para manter a sua carteira de clientes saudável.
                    </>
                  )}
                  {activeModal === 'b2b' && (
                    <>
                      Acompanhe o engajamento de seus clientes com o seu Catálogo Online B2B. Veja quais clientes já realizaram pedidos diretamente pelo canal online e quais ainda não efetuaram pedidos.
                      <br /><br />
                      Isso permite direcionar estratégias de marketing ou realizar contatos ativos para incentivar o uso da plataforma de autoatendimento pelos clientes que ainda estão "sem pedidos".
                    </>
                  )}
                </p>
              </div>

              {/* Dynamic Lists Tabulation */}
              {activeModal === 'carteira' && (
                <div className="space-y-4">
                  {/* Summary grid */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                      <div className="text-xl font-black text-green-700">{carteiraAtivosList.length}</div>
                      <div className="text-[10px] font-bold text-green-600 uppercase">Ativos</div>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="text-xl font-black text-amber-700">{carteiraInativosRecentesList.length}</div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase">Inat. Recentes</div>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="text-xl font-black text-red-700">{carteiraInativosAntigosList.length}</div>
                      <div className="text-[10px] font-bold text-red-600 uppercase">Inat. Antigos</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="text-xl font-black text-slate-700">{carteiraProspectsList.length}</div>
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Prospects</div>
                    </div>
                  </div>

                  {/* Lists */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Clientes por Categoria</h4>
                    
                    {/* Active */}
                    {carteiraAtivosList.length > 0 && (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-green-50/50 px-4 py-2 text-xs font-bold text-green-800 border-b border-slate-100">
                          Clientes Ativos ({carteiraAtivosList.length}) - Compraram nos últimos 30 dias
                        </div>
                        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {carteiraAtivosList.map(c => (
                            <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{c.name}</p>
                                <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500">Última compra: <span className="font-semibold text-slate-700">{c.lastOrder}</span></p>
                                <p className="text-[9px] font-bold text-green-700">{c.totalOrders} pedido(s) no total</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inactive Recentes */}
                    {carteiraInativosRecentesList.length > 0 && (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-amber-50/50 px-4 py-2 text-xs font-bold text-amber-800 border-b border-slate-100">
                          Clientes Inativos Recentes ({carteiraInativosRecentesList.length}) - Compraram entre 30 e 90 dias atrás
                        </div>
                        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {carteiraInativosRecentesList.map(c => (
                            <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{c.name}</p>
                                <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500">Última compra: <span className="font-semibold text-slate-700">{c.lastOrder}</span></p>
                                <p className="text-[9px] font-bold text-amber-700">{c.totalOrders} pedido(s) no total</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inactive Antigos */}
                    {carteiraInativosAntigosList.length > 0 && (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-red-50/50 px-4 py-2 text-xs font-bold text-red-800 border-b border-slate-100">
                          Clientes Inativos Antigos ({carteiraInativosAntigosList.length}) - Compraram há mais de 90 dias
                        </div>
                        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {carteiraInativosAntigosList.map(c => (
                            <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{c.name}</p>
                                <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500">Última compra: <span className="font-semibold text-slate-700">{c.lastOrder}</span></p>
                                <p className="text-[9px] font-bold text-red-700">{c.totalOrders} pedido(s) no total</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prospects */}
                    {carteiraProspectsList.length > 0 && (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 border-b border-slate-100">
                          Prospects ({carteiraProspectsList.length}) - Clientes cadastrados sem pedidos efetuados
                        </div>
                        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {carteiraProspectsList.map(c => (
                            <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{c.name}</p>
                                <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">Sem histórico</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'positivacao' && (
                <div className="space-y-4">
                  {/* Percentual calculation */}
                  {(() => {
                    const totalPos = positivadosNovosList.length + positivadosAtivosList.length + positivadosInativosRecentesList.length + positivadosInativosAntigosList.length;
                    const prevActivesCount = carteiraAtivosList.length + positivadosAtivosList.length; 
                    const recoveredInactives = positivadosInativosRecentesList.length + positivadosInativosAntigosList.length;
                    const retentionRate = prevActivesCount > 0 ? (positivadosAtivosList.length / prevActivesCount) * 100 : 0;
                    
                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                            <p className="text-2xl font-black text-blue-700">{positivadosNovosList.length}</p>
                            <p className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">Novos Clientes</p>
                          </div>
                          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-center">
                            <p className="text-2xl font-black text-green-700">{positivadosAtivosList.length}</p>
                            <p className="text-[10px] font-bold text-green-600 uppercase mt-0.5">Ativos Mantidos</p>
                          </div>
                          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                            <p className="text-2xl font-black text-amber-700">{positivadosInativosRecentesList.length}</p>
                            <p className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">Inat. Recentes Reativados</p>
                          </div>
                          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                            <p className="text-2xl font-black text-red-700">{positivadosInativosAntigosList.length}</p>
                            <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5">Inat. Antigos Reativados</p>
                          </div>
                        </div>

                        {/* Health status widget */}
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa de Positivação / Retenção</p>
                            <p className="text-sm font-semibold text-slate-800 mt-1">
                              Dos clientes que estavam ativos no final do mês anterior, <span className="text-green-700 font-bold">{retentionRate > 0 ? `${retentionRate.toFixed(1)}%` : '100%'}</span> foram positivados neste mês.
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Foram reativados <span className="font-bold text-amber-700">{recoveredInactives}</span> clientes que estavam inativos.
                            </p>
                          </div>
                          <div className="text-center bg-white px-6 py-3 rounded-xl border border-slate-200 shrink-0 shadow-xs">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Positivados</p>
                            <p className="text-3xl font-black text-slate-800">{totalPos}</p>
                          </div>
                        </div>

                        {/* Client details lists */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Lista Detalhada de Positivações</h4>

                          {/* Novos */}
                          {positivadosNovosList.length > 0 && (
                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                              <div className="bg-blue-50/50 px-4 py-2 text-xs font-bold text-blue-800 border-b border-slate-100">
                                Novos Clientes ({positivadosNovosList.length}) - Primeiro pedido realizado neste período
                              </div>
                              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                {positivadosNovosList.map(c => (
                                  <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-semibold text-slate-800">{c.name}</p>
                                      <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-500">Data Pedido: <span className="font-semibold text-slate-700">{c.orderDate}</span></p>
                                      <p className="text-[10px] font-bold text-[#006c49]">R$ {c.amount.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ativos Mantidos */}
                          {positivadosAtivosList.length > 0 && (
                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                              <div className="bg-green-50/50 px-4 py-2 text-xs font-bold text-green-800 border-b border-slate-100">
                                Clientes Ativos Mantidos ({positivadosAtivosList.length}) - Mantiveram a recorrência de compras
                              </div>
                              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                {positivadosAtivosList.map(c => (
                                  <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-semibold text-slate-800">{c.name}</p>
                                      <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-500">Pedido Atual: <span className="font-semibold text-slate-700">{c.orderDate}</span> (anterior: {c.previousOrderDate})</p>
                                      <p className="text-[10px] font-bold text-[#006c49]">R$ {c.amount.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Inativos Reativados */}
                          {(positivadosInativosRecentesList.length > 0 || positivadosInativosAntigosList.length > 0) && (
                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                              <div className="bg-amber-50/50 px-4 py-2 text-xs font-bold text-amber-800 border-b border-slate-100">
                                Clientes Reativados ({positivadosInativosRecentesList.length + positivadosInativosAntigosList.length}) - Voltaram a comprar após um período de inatividade
                              </div>
                              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                {[...positivadosInativosRecentesList, ...positivadosInativosAntigosList].map(c => (
                                  <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-semibold text-slate-800">{c.name}</p>
                                      <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-500">Reativado em: <span className="font-semibold text-slate-700">{c.orderDate}</span> (compra anterior: {c.previousOrderDate})</p>
                                      <p className="text-[10px] font-bold text-[#006c49]">R$ {c.amount.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeModal === 'b2b' && (
                <div className="space-y-4">
                  {/* Summary of B2B integration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-center">
                      <p className="text-3xl font-black text-green-700">{b2bComPedidosList.length}</p>
                      <p className="text-xs font-bold text-green-600 uppercase mt-0.5">Clientes Com Pedidos</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <p className="text-3xl font-black text-slate-700">{b2bSemPedidosList.length}</p>
                      <p className="text-xs font-bold text-slate-600 uppercase mt-0.5">Clientes Sem Pedidos</p>
                    </div>
                  </div>

                  {/* List details */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Engajamento de Clientes B2B</h4>

                    {/* B2B com pedidos */}
                    {b2bComPedidosList.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-green-50/50 px-4 py-2 text-xs font-bold text-green-800 border-b border-slate-100">
                          Clientes que realizaram pedidos via Catálogo ({b2bComPedidosList.length})
                        </div>
                        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                          {b2bComPedidosList.map(c => (
                            <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{c.name}</p>
                                <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500">Qtd Pedidos Online: <span className="font-bold text-slate-800">{c.ordersCount}</span></p>
                                <p className="text-[10px] font-bold text-green-700">Total: R$ {c.totalSpent.toFixed(2).replace('.', ',')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 border border-dashed rounded-xl">Nenhum cliente realizou pedidos via Catálogo Online ainda.</p>
                    )}

                    {/* B2B sem pedidos */}
                    {b2bSemPedidosList.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-100">
                          Clientes cadastrados no Catálogo sem pedidos ({b2bSemPedidosList.length})
                        </div>
                        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                          {b2bSemPedidosList.map(c => (
                            <div key={c.id} className="p-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{c.name}</p>
                                <p className="text-[10px] text-slate-400">Tel: {c.phone}</p>
                              </div>
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 uppercase tracking-wide">Sem compras online</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 border border-dashed rounded-xl">Todos os clientes cadastrados no Catálogo realizaram pedidos!</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
