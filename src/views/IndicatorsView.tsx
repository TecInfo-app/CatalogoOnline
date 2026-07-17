import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Info, MoreVertical, BarChart2, PlusCircle, Printer, Calendar, FileText, ShoppingBag, Users, TrendingUp, DollarSign } from 'lucide-react';
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

    setTotalVendidoMes(mes);
    setTotalVendidoHoje(hoje);
    setTotalPrevisao(previsaoTotal);
    setTotalClients(clients.length);
    setPositivados(clientsPosIds.size);
    setCatalogClientsCount(catalogClientsIds.size);
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
              { title: 'Carteira de Clientes', period: 'MÊS ATUAL', total: totalClients, subtitle: 'Clientes', btn: 'Detalhar carteira', items: [{c: 'bg-secondary', t: `${totalClients} ativos`}, {c: 'bg-amber-400', t: '0 inativos recentes'}, {c: 'bg-error', t: '0 inativos antigos'}, {c: 'bg-outline', t: '0 prospects'}] },
              { title: 'Positivação', period: 'MÊS ATUAL', total: positivados, subtitle: 'Clientes positivados', emptyText: positivados === 0 ? 'Nenhum cliente foi positivado neste mês' : '', btn: 'Detalhar positivação', items: [{c: 'bg-primary', t: `${positivados} novos`}, {c: 'bg-secondary', t: '0 ativos'}, {c: 'bg-amber-400', t: '0 inativos recentes'}, {c: 'bg-error', t: '0 inativos antigos'}] },
              { title: 'Catálogo Online B2B', period: 'PERÍODO SELECIONADO', total: catalogClientsCount, subtitle: 'Clientes', emptyText: catalogClientsCount === 0 ? 'Nenhum pedido no catálogo neste período' : '', btn: 'Detalhar clientes B2B', items: [{c: 'bg-primary', t: `${catalogClientsCount} clientes com pedidos`}, {c: 'bg-outline', t: '0 sem pedidos'}] }
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
                
                <div className={`grid gap-2 text-body-sm text-on-surface-variant mt-auto ${card.items.length === 3 ? 'flex flex-col pl-8' : 'grid-cols-2'}`}>
                  {card.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.c}`}></span> {item.t}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-outline-variant/30 text-center">
                  <button className="text-primary text-label-md hover:underline inline-flex items-center gap-1">
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
    </div>
  );
}
