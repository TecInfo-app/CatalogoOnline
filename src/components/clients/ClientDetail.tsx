import React, { useState, useEffect } from 'react';
import { Client, Order } from '../../types';
import { 
  Edit2, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  FileText, 
  ToggleLeft, 
  ToggleRight, 
  MessageSquare, 
  ShoppingCart, 
  Calendar, 
  X, 
  AlertTriangle, 
  Check, 
  Clock, 
  Trash2, 
  MapPin, 
  Award,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getOrders, getClients, getSellers } from '../../lib/store';

interface ClientDetailProps {
  client: Client & { isBlocked?: boolean; blockedReason?: string; blockedAt?: string };
  userEmail: string;
  onBack: () => void;
  onUpdate: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onNavigate?: (tab: string) => void;
}

// Helpers for date formatting and calculations
function formatDateToBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getDaysSinceDate(brDateStr: string): number {
  if (!brDateStr) return 0;
  const parts = brDateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const past = new Date(year, month, day);
    const today = new Date();
    // set to midnight for clean comparison
    past.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - past.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  }
  return 0;
}

export function ClientDetail({ client, userEmail, onBack, onUpdate, onEdit, onNavigate }: ClientDetailProps) {
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [rankText, setRankText] = useState('Nenhum pedido realizado');
  
  // Modals & Drawers States
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFullRegistration, setShowFullRegistration] = useState(false);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  // Block Modal Form States
  const [blockReason, setBlockReason] = useState('Inadimplência');
  const [customReasons, setCustomReasons] = useState<string[]>([]);
  const [showCustomReasonInput, setShowCustomReasonInput] = useState(false);
  const [newCustomReason, setNewCustomReason] = useState('');

  // Task Drawer Form States
  const sellers = React.useMemo(() => getSellers(userEmail), [userEmail]);

  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [taskTime, setTaskTime] = useState('');
  const [taskContactMedium, setTaskContactMedium] = useState('Ligação');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskSalesperson, setTaskSalesperson] = useState('');

  // Activity Drawer Form States
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activityTime, setActivityTime] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [activityContactMedium, setActivityContactMedium] = useState('Ligação');
  const [activityResult, setActivityResult] = useState('Venda realizada');
  const [activityDetails, setActivityDetails] = useState('');

  // Toast State for Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load client-specific tasks and orders
  useEffect(() => {
    const loadData = () => {
      // 1. Load tasks
      const storedTasksStr = localStorage.getItem(`vitrine_pay_${userEmail}_agenda_items`);
      if (storedTasksStr) {
        try {
          const allTasks = JSON.parse(storedTasksStr);
          setLocalTasks(allTasks.filter((t: any) => t.clientId === client.id));
        } catch (e) {
          console.error('Error parsing tasks:', e);
        }
      }

      // 2. Load orders
      const allOrders = getOrders(userEmail);
      const filteredOrders = allOrders.filter(
        (o) => o.clientId === client.id || o.clientName.toLowerCase() === client.name.toLowerCase()
      );
      setClientOrders(filteredOrders);

      // 3. Calculate client ranking
      const allClients = getClients(userEmail);
      const clientSpends = allClients.map(c => {
        const cOrders = allOrders.filter(
          (o) => (o.clientId === c.id || o.clientName.toLowerCase() === c.name.toLowerCase()) && o.status === 'completed'
        );
        const total = cOrders.reduce((sum, o) => sum + o.total, 0);
        return { id: c.id, total };
      });

      // Sort by total spending descending
      clientSpends.sort((a, b) => b.total - a.total);
      const rankIndex = clientSpends.findIndex(x => x.id === client.id);
      
      const completedOrders = filteredOrders.filter(o => o.status === 'completed');
      if (completedOrders.length > 0 && rankIndex !== -1) {
        setRankText(`${rankIndex + 1}º Cliente que mais compra`);
      } else {
        setRankText('Sem compras finalizadas');
      }
    };

    loadData();

    // Listen to store updates
    window.addEventListener('vitrine_pay_data_synced', loadData);
    return () => {
      window.removeEventListener('vitrine_pay_data_synced', loadData);
    };
  }, [userEmail, client.id, client.name]);

  // Calculate dynamic stats
  const completedOrders = clientOrders.filter((o) => o.status === 'completed');
  const totalPurchases = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = completedOrders.length;
  const averageTicket = orderCount > 0 ? totalPurchases / orderCount : 0;

  // Find latest order date for "Days since last purchase"
  let latestOrderDateStr = '';
  let latestOrderTime = 0;
  completedOrders.forEach(o => {
    const parts = o.date.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      if (d.getTime() > latestOrderTime) {
        latestOrderTime = d.getTime();
        latestOrderDateStr = o.date;
      }
    }
  });
  const daysSinceLastPurchase = latestOrderDateStr ? getDaysSinceDate(latestOrderDateStr) : -1;

  // Header Handlers
  const handleTogglePortal = () => {
    onUpdate({
      ...client,
      isPortalEnabled: !client.isPortalEnabled
    });
    showToast(client.isPortalEnabled ? "Portal do Cliente suspenso." : "Portal do Cliente liberado com sucesso!");
  };

  const handleToggleBlock = () => {
    if (client.isBlocked) {
      onUpdate({
        ...client,
        isBlocked: false,
        blockedReason: undefined,
        blockedAt: undefined
      } as any);
      showToast("Cliente desbloqueado com sucesso!");
    } else {
      setShowBlockModal(true);
    }
  };

  const handleConfirmBlock = () => {
    onUpdate({
      ...client,
      isBlocked: true,
      blockedReason: blockReason,
      blockedAt: new Date().toLocaleDateString('pt-BR')
    } as any);
    setShowBlockModal(false);
    showToast("Cliente bloqueado com sucesso.");
  };

  const handleAddCustomReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomReason.trim() && !customReasons.includes(newCustomReason.trim())) {
      setCustomReasons([...customReasons, newCustomReason.trim()]);
      setBlockReason(newCustomReason.trim());
      setNewCustomReason('');
      setShowCustomReasonInput(false);
    }
  };

  // Order creation logic (bridged to Orders tab)
  const handleCreateOrderClick = () => {
    if (client.isBlocked) {
      alert(`Este cliente está bloqueado pelo motivo "${client.blockedReason}" e não pode realizar pedidos.`);
      return;
    }
    // Set sessionStorage so the newly opened order form is prefilled
    sessionStorage.setItem('preselected_order_client', JSON.stringify(client));
    if (onNavigate) {
      onNavigate('orders');
    } else {
      alert("Navegação não configurada. Use o menu de Pedidos para criar um novo pedido para este cliente.");
    }
  };

  // Task Drawer Logic
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask = {
      id: `task-${Date.now()}`,
      type: 'task' as const,
      date: formatDateToBR(taskDate),
      time: taskTime || '--:--',
      contactMedium: taskContactMedium,
      clientId: client.id,
      clientName: client.name,
      details: taskDetails,
      salesperson: taskSalesperson,
      status: 'pending' as const
    };

    const storedTasksStr = localStorage.getItem(`vitrine_pay_${userEmail}_agenda_items`);
    const allTasks = storedTasksStr ? JSON.parse(storedTasksStr) : [];
    const updated = [newTask, ...allTasks];
    localStorage.setItem(`vitrine_pay_${userEmail}_agenda_items`, JSON.stringify(updated));
    
    setLocalTasks(updated.filter((t: any) => t.clientId === client.id));
    setTaskDetails('');
    setTaskTime('');
    setShowTaskDrawer(false);
    showToast("Tarefa agendada com sucesso!");
    window.dispatchEvent(new Event('vitrine_pay_data_synced'));
  };

  // Activity Drawer Logic
  const handleRegisterActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity = {
      id: `activity-${Date.now()}`,
      type: 'activity' as const,
      date: formatDateToBR(activityDate),
      time: activityTime || '00:00',
      contactMedium: activityContactMedium,
      clientId: client.id,
      clientName: client.name,
      details: activityDetails,
      salesperson: taskSalesperson || (sellers.length > 0 ? sellers[0].name : ''),
      status: 'done' as const,
      result: activityResult
    };

    const storedTasksStr = localStorage.getItem(`vitrine_pay_${userEmail}_agenda_items`);
    const allTasks = storedTasksStr ? JSON.parse(storedTasksStr) : [];
    const updated = [newActivity, ...allTasks];
    localStorage.setItem(`vitrine_pay_${userEmail}_agenda_items`, JSON.stringify(updated));
    
    setLocalTasks(updated.filter((t: any) => t.clientId === client.id));
    setActivityDetails('');
    setShowActivityDrawer(false);
    showToast("Atividade registrada com sucesso!");
    window.dispatchEvent(new Event('vitrine_pay_data_synced'));
  };

  const handleToggleTaskStatus = (id: string) => {
    const storedTasksStr = localStorage.getItem(`vitrine_pay_${userEmail}_agenda_items`);
    if (storedTasksStr) {
      try {
        const allTasks = JSON.parse(storedTasksStr);
        const updated = allTasks.map((t: any) => {
          if (t.id === id) {
            return {
              ...t,
              status: t.status === 'done' ? ('pending' as const) : ('done' as const)
            };
          }
          return t;
        });
        localStorage.setItem(`vitrine_pay_${userEmail}_agenda_items`, JSON.stringify(updated));
        setLocalTasks(updated.filter((t: any) => t.clientId === client.id));
        showToast("Status da tarefa atualizado.");
        window.dispatchEvent(new Event('vitrine_pay_data_synced'));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    const storedTasksStr = localStorage.getItem(`vitrine_pay_${userEmail}_agenda_items`);
    if (storedTasksStr) {
      try {
        const allTasks = JSON.parse(storedTasksStr);
        const updated = allTasks.filter((t: any) => t.id !== id);
        localStorage.setItem(`vitrine_pay_${userEmail}_agenda_items`, JSON.stringify(updated));
        setLocalTasks(updated.filter((t: any) => t.clientId === client.id));
        showToast("Registro excluído.");
        window.dispatchEvent(new Event('vitrine_pay_data_synced'));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const pendingTasks = localTasks.filter(t => t.type === 'task' && t.status === 'pending');
  const clientActivities = localTasks.filter(t => t.type === 'activity' || (t.type === 'task' && t.status === 'done'));

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 relative">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        
        {/* BLOCKED CORNER BADGE */}
        {client.isBlocked && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-6 py-1 rotate-45 translate-x-4 translate-y-3 shadow-sm">
            Bloqueado
          </div>
        )}

        <button onClick={onBack} className="text-[#851b42] text-xs hover:underline font-bold self-start flex items-center gap-1">
          &larr; Voltar para a lista
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl text-slate-800 font-extrabold tracking-tight">{client.name}</h1>
              {client.isBlocked && (
                <span className="bg-red-50 text-red-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-red-200 tracking-wide flex items-center gap-1">
                  <AlertCircle size={10} strokeWidth={3} /> Cliente Bloqueado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {client.legalName} &bull; {client.cnpj} {client.type ? `&bull; ${client.type}` : ''}
            </p>
          </div>
          
          <div className="flex gap-2.5 flex-wrap">
            <button 
              onClick={() => onEdit?.(client)}
              className="bg-[#851b42] hover:bg-[#5e132e] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Edit2 size={13} /> Alterar cadastro
            </button>
            <button 
              onClick={handleToggleBlock}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border shadow-xs",
                client.isBlocked 
                  ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700" 
                  : "bg-white hover:bg-red-50 border-red-200 text-red-600"
              )}
            >
              <AlertTriangle size={13} /> {client.isBlocked ? 'Desbloquear' : 'Bloquear'}
            </button>
          </div>
        </div>

        {client.isBlocked && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 mt-1 items-start text-xs text-red-800">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <span className="font-extrabold block">CLIENTE BLOQUEADO NO SISTEMA</span>
              <p className="text-red-700 mt-1">
                <strong>Motivo do bloqueio:</strong> "{client.blockedReason || 'Não informado'}". 
                Registrado em {client.blockedAt || 'data não informada'}. Não será possível emitir novos pedidos para este cliente.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 border-t border-slate-100 pt-4 mt-2">
          {client.phones && client.phones[0] && (
            <div className="flex items-center gap-2 font-medium">
              <Phone size={14} className="text-slate-400" /> 
              <span>{client.phones[0]}</span> 
              <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100">whatsapp</span>
            </div>
          )}
          {client.emails && client.emails[0] && (
            <div className="flex items-center gap-2 font-medium">
              <Mail size={14} className="text-[#851b42]" /> 
              <span className="text-[#851b42] hover:underline cursor-pointer">{client.emails[0]}</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowFullRegistration(true)}
          className="mt-3 text-[#851b42] hover:text-[#5e132e] text-xs font-extrabold flex items-center gap-1.5 hover:underline cursor-pointer transition-all border border-slate-100 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl self-start"
        >
          <ChevronDown size={14} /> Ver cadastro completo
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-12">
        
        {/* Left Column (Activities, Tasks, Notes) */}
        <div className="flex-1 lg:flex-2 flex flex-col gap-6">
          
          {/* TAREFAS CARD */}
          <Section 
            title="TAREFAS" 
            action={{ label: 'Criar tarefa', onClick: () => setShowTaskDrawer(true) }}
          >
            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <div key={task.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-xs">{task.contactMedium}</span>
                        <span className="text-[9px] font-bold bg-[#851b42]/10 text-[#851b42] px-2 py-0.5 rounded">
                          {task.date}
                        </span>
                        {task.time && task.time !== '--:--' && (
                          <span className="text-[9px] font-bold text-slate-400">
                            às {task.time}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic">"{task.details}"</p>
                      <span className="text-[10px] text-slate-400 block font-semibold">Responsável: {task.salesperson}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleToggleTaskStatus(task.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Marcar como realizada"
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-10 flex flex-col items-center justify-center gap-1.5">
                <Calendar size={24} className="text-slate-300 stroke-1" />
                <span>Crie uma tarefa na agenda para lembrar de contatar este cliente.</span>
              </div>
            )}
          </Section>

          {/* OPORTUNIDADES CARD */}
          <Section title="OPORTUNIDADES ABERTAS" action={{ label: 'Criar oportunidade', onClick: () => {}, outline: true }}>
            <div className="text-center text-slate-400 text-xs py-10 flex flex-col items-center justify-center gap-1.5">
              <Briefcase size={24} className="text-slate-300 stroke-1" />
              <span>Acompanhe as oportunidades criadas para seu cliente.</span>
            </div>
          </Section>

          {/* PEDIDOS E ATIVIDADES CARD */}
          <Section 
            title="PEDIDOS E ATIVIDADES" 
            actions={[
              { label: 'Criar pedido', onClick: handleCreateOrderClick, primary: true },
              { label: 'Registrar atividade', onClick: () => setShowActivityDrawer(true), outline: true }
            ]}
          >
            {clientOrders.length === 0 && clientActivities.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-10 flex flex-col items-center justify-center gap-1.5">
                <ShoppingCart size={24} className="text-slate-300 stroke-1" />
                <span>Veja os pedidos criados e registre as atividades realizadas neste cliente.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pending budgets or completed orders */}
                {clientOrders.map(order => (
                  <div key={order.id} className="p-3.5 border border-slate-100 rounded-xl bg-white flex justify-between items-center gap-4 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-xs">Pedido #{order.orderNumber}</span>
                        <span className="text-[9px] font-bold text-slate-400">{order.date}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          order.status === 'completed' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : order.status === 'budget'
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                        )}>
                          {order.status === 'completed' ? 'Faturado' : order.status === 'budget' ? 'Orçamento' : 'Cancelado'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'itens'} &bull; Total: <strong>R$ {order.total.toFixed(2).replace('.', ',')}</strong>
                      </p>
                    </div>
                    {order.paymentMethod && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                        {order.paymentMethod}
                      </span>
                    )}
                  </div>
                ))}

                {/* Stored activities / completed tasks */}
                {clientActivities.map(act => (
                  <div key={act.id} className="p-3.5 border border-emerald-100 rounded-xl bg-emerald-50/10 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-emerald-800 text-xs">
                          {act.type === 'task' ? 'Tarefa Concluída' : 'Atividade'}
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {act.date}
                        </span>
                        {act.result && (
                          <span className="text-[9px] font-extrabold bg-emerald-700 text-white px-2 py-0.5 rounded">
                            {act.result}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold uppercase">({act.contactMedium})</span>
                      </div>
                      {act.details && <p className="text-xs text-slate-600 italic">"{act.details}"</p>}
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(act.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir atividade"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* NOTAS FISCAIS CARD */}
          <Section title="NOTAS FISCAIS">
            <div className="text-center text-slate-400 text-xs py-10">
              Não há notas fiscais disponíveis no Mercos para este cliente.
            </div>
          </Section>

          {/* PRODUTOS MAIS COMPRADOS CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="font-bold text-xs text-slate-600 uppercase tracking-wide pb-4 border-b border-slate-100 flex items-center gap-2 mb-4">
              <ShoppingCart size={14} /> PRODUTOS MAIS COMPRADOS
            </div>
            
            {completedOrders.length > 0 ? (
              <div className="space-y-3.5">
                {/* Dynamically extract items from orders to list most bought products */}
                {(() => {
                  const productMap = new Map<string, { name: string; qty: number; price: number }>();
                  completedOrders.forEach(o => {
                    if (o.items) {
                      o.items.forEach(i => {
                        const existing = productMap.get(i.productId) || { name: i.name, qty: 0, price: i.price };
                        existing.qty += i.quantity;
                        productMap.set(i.productId, existing);
                      });
                    }
                  });
                  const sortedProducts = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty);
                  return sortedProducts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold py-2.5 border-b border-dashed border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800">{p.name}</span>
                      </div>
                      <div className="text-right text-slate-500 flex gap-4">
                        <span>{p.qty} un.</span>
                        <span className="font-bold text-[#851b42]">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-10">
                Sem registros de produtos faturados para este cliente.
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Summary, Portal, Limit, Títulos) */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* RESUMO CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-[#851b42]" /> RESUMO FINANCEIRO
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <Calendar size={13} /> Histórico Geral
                </div>
                
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs font-semibold">Ranking do cliente:</span>
                    <span className="text-xs font-extrabold text-slate-800">{rankText}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs font-semibold">Total faturado:</span>
                    <span className="text-xs font-extrabold text-[#851b42]">R$ {totalPurchases.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs font-semibold">Pedidos faturados:</span>
                    <span className="text-xs font-extrabold text-slate-800">{orderCount} {orderCount === 1 ? 'pedido' : 'pedidos'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs font-semibold">Ticket médio:</span>
                    <span className="text-xs font-extrabold text-slate-800">R$ {averageTicket.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500 text-xs font-semibold">Dias sem comprar:</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {daysSinceLastPurchase === -1 ? 'Sem compras registradas' : `${daysSinceLastPurchase} dias`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <AlertCircle size={11} /> Apenas faturados (Vendas concluídas)
              </div>
            </div>
          </div>

          {/* PORTAL DO CLIENTE CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">
              PORTAL DO CLIENTE
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className={cn(
                  "text-xs font-extrabold uppercase tracking-wider flex items-center gap-1",
                  client.isPortalEnabled ? "text-emerald-600" : "text-slate-400"
                )}>
                  {client.isPortalEnabled ? 'Portal liberado' : 'Acesso suspenso'}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Permite ao cliente visualizar o catálogo</p>
              </div>
              <button 
                onClick={handleTogglePortal} 
                className={cn(
                  "transition-colors outline-none cursor-pointer p-1 rounded-full", 
                  client.isPortalEnabled ? "text-[#851b42]" : "text-slate-300 hover:text-slate-400"
                )}
              >
                {client.isPortalEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
          </div>

          {/* LIMITE DE CRÉDITO CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">
              LIMITE DE CRÉDITO
            </div>
            <div className="p-5">
              <div className="font-extrabold text-xs text-slate-700 uppercase tracking-wide mb-4">Limite de Faturamento</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Disponível</div>
                  <div className="text-sm text-slate-800 font-extrabold mt-0.5">R$ {totalPurchases > 1000 ? 'Sem limite' : 'R$ 5.000,00'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total</div>
                  <div className="text-sm text-slate-800 font-extrabold mt-0.5">R$ {totalPurchases > 1000 ? 'Sem limite' : 'R$ 5.000,00'}</div>
                </div>
                <button className="text-slate-400 hover:text-[#851b42] hover:bg-slate-50 border border-slate-200 p-2 rounded-xl transition-colors">
                  <Edit2 size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* TÍTULOS CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden relative">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
              <span className="font-bold text-xs text-slate-600 uppercase tracking-wider">TÍTULOS EM ABERTO</span>
              <button className="border border-slate-200 text-[#851b42] bg-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Lançar título
              </button>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-6">
                <button className="bg-[#851b42] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                  A receber
                </button>
                <button className="bg-white border border-slate-200 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
                  Recebidos
                </button>
              </div>
              <div className="text-center text-slate-400 text-xs py-8">
                Este cliente não possui títulos vencidos ou a vencer cadastrados no sistema.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================= */}
      {/* 🚫 MODAL: BLOQUEAR CLIENTE (2ND IMAGE) */}
      {/* ======================================= */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="text-red-500" size={18} /> Bloquear cliente
              </h3>
              <button 
                onClick={() => { setShowBlockModal(false); setShowCustomReasonInput(false); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning Block */}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-800 flex gap-2.5 items-start">
              <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={16} strokeWidth={2.5} />
              <p className="leading-relaxed">
                Tem certeza que deseja bloquear este cliente? Não será possível emitir pedidos para este cliente e ele aparecerá no sistema como <strong>'Bloqueado'</strong>. O histórico do cliente ainda será mantido.
              </p>
            </div>

            {/* Reason Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Motivo do bloqueio</label>
              
              {!showCustomReasonInput ? (
                <div className="space-y-3">
                  <div className="relative">
                    <select 
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-700 font-semibold focus:border-red-500 outline-none appearance-none transition-all cursor-pointer"
                    >
                      <option value="Inadimplência">Inadimplência</option>
                      <option value="Dados cadastrais inconsistentes">Dados cadastrais inconsistentes</option>
                      <option value="Fraude ou suspeita de fraude">Fraude ou suspeita de fraude</option>
                      <option value="Decisão comercial">Decisão comercial</option>
                      {customReasons.map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowCustomReasonInput(true)}
                    className="text-xs font-bold text-[#851b42] hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Criar motivo de bloqueio
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddCustomReason} className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Histórico de atraso recorrente"
                      value={newCustomReason}
                      onChange={(e) => setNewCustomReason(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/25"
                    />
                    <button 
                      type="submit"
                      className="bg-[#851b42] text-white px-3.5 py-2 rounded-xl text-xs font-bold"
                    >
                      Adicionar
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowCustomReasonInput(false)}
                    className="text-xs font-bold text-slate-400 hover:underline"
                  >
                    Cancelar customização
                  </button>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => { setShowBlockModal(false); setShowCustomReasonInput(false); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmBlock}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
              >
                <AlertTriangle size={12} /> Bloquear cliente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =============================================== */}
      {/* 📄 MODAL: CADASTRO COMPLETO DO CLIENTE */}
      {/* =============================================== */}
      {showFullRegistration && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wider">
                  Ficha Cadastral Completa
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Dados arquivados no sistema</p>
              </div>
              <button 
                onClick={() => setShowFullRegistration(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Information Grid */}
            <div className="space-y-6 text-xs text-slate-700">
              
              {/* Geral Section */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  • IDENTIFICAÇÃO E FISCAL
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-semibold block">Nome Fantasia / Comercial:</span>
                    <span className="font-bold text-slate-800 text-sm">{client.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Razão Social / Nome Legal:</span>
                    <span className="font-bold text-slate-800">{client.legalName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">CNPJ / CPF:</span>
                    <span className="font-bold text-slate-800">{client.cnpj}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Tipo de Contribuinte:</span>
                    <span className="font-bold text-slate-800">{client.type || 'Pessoa Jurídica'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Status da Conta:</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mt-1",
                      client.isBlocked 
                        ? "bg-red-50 text-red-700 border-red-100" 
                        : client.status === 'active' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      {client.isBlocked ? 'Bloqueado' : client.status === 'active' ? 'Ativo' : client.status === 'inactive' ? 'Inativo' : 'Prospect'}
                    </span>
                  </div>
                  {client.birthday && (
                    <div>
                      <span className="text-slate-400 font-semibold block">Data de Nascimento / Fundação:</span>
                      <span className="font-bold text-slate-800">{formatDateToBR(client.birthday)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contatos Section */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  • CONTATOS E MEIOS DE COMUNICAÇÃO
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-semibold block">Telefones:</span>
                    {client.phones && client.phones.length > 0 ? (
                      <div className="space-y-1 mt-1">
                        {client.phones.map((p, i) => (
                          <div key={i} className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Phone size={11} className="text-slate-400" /> {p}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Nenhum cadastrado</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">E-mails:</span>
                    {client.emails && client.emails.length > 0 ? (
                      <div className="space-y-1 mt-1">
                        {client.emails.map((m, i) => (
                          <div key={i} className="font-bold text-[#851b42] flex items-center gap-1.5">
                            <Mail size={11} className="text-[#851b42]/70" /> {m}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Nenhum cadastrado</span>
                    )}
                  </div>
                </div>

                {client.contacts && client.contacts.length > 0 && (
                  <div className="mt-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Pessoas de Contato</span>
                    {client.contacts.map((contact, i) => (
                      <div key={i} className="border-b border-slate-200/55 last:border-0 pb-2.5 last:pb-0 text-xs">
                        <div className="font-extrabold text-slate-800">{contact.name} <span className="font-normal text-slate-400">({contact.role})</span></div>
                        {contact.phones && contact.phones[0] && <div className="text-slate-500 font-medium mt-0.5">Tel: {contact.phones.join(', ')}</div>}
                        {contact.emails && contact.emails[0] && <div className="text-slate-500 font-medium">E-mail: {contact.emails.join(', ')}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Endereço Section */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  • LOCALIZAÇÃO E ENDEREÇO DE FATURAMENTO
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex gap-2 items-start text-xs font-semibold text-slate-700">
                    <MapPin className="text-[#851b42] mt-0.5 flex-shrink-0" size={15} />
                    <div className="space-y-1">
                      {client.address && client.address.endereco ? (
                        <>
                          <p className="font-extrabold text-slate-800">
                            {client.address.endereco}, {client.address.numero || 'S/N'}
                          </p>
                          {client.address.complemento && <p className="text-slate-500">Comp: {client.address.complemento}</p>}
                          <p className="text-slate-600">
                            Bairro: {client.address.bairro || 'Não informado'}
                          </p>
                          <p className="text-slate-600">
                            Cidade: {client.address.cidade || 'Não informada'} - {client.address.estado || '---'}
                          </p>
                          {client.address.cep && <p className="text-slate-400 font-mono text-[11px]">CEP: {client.address.cep}</p>}
                        </>
                      ) : (
                        <p className="text-slate-500 italic">
                          {client.location || 'Sem endereço detalhado cadastrado no sistema.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setShowFullRegistration(false)}
                className="px-5 py-2.5 bg-[#851b42] text-white rounded-xl text-xs font-bold hover:bg-[#5e132e] transition-colors shadow-xs"
              >
                Fechar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================== */}
      {/* 📅 DRAWER: CRIAR TAREFA (SLIDE-OUT PANEL) */}
      {/* =========================================== */}
      {showTaskDrawer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={() => setShowTaskDrawer(false)} />
          
          {/* Drawer Box */}
          <div className="bg-white max-w-md w-full h-full p-6 shadow-2xl relative z-10 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6 overflow-y-auto pr-1">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wider">Criar tarefa</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Agendar contato com o cliente</p>
                </div>
                <button 
                  onClick={() => setShowTaskDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Block */}
              <form onSubmit={handleCreateTaskSubmit} id="create-task-drawer-form" className="space-y-5 text-xs text-slate-700">
                
                {/* Date and Time Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Data</label>
                    <input 
                      type="date"
                      required
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Hora</label>
                    <input 
                      type="time"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold cursor-pointer"
                    />
                  </div>
                </div>

                {/* Medium of Contact */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Meio de contato</label>
                  <div className="relative">
                    <select 
                      value={taskContactMedium}
                      onChange={(e) => setTaskContactMedium(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold appearance-none cursor-pointer"
                    >
                      <option value="Ligação">Ligação</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Reunião presencial">Reunião presencial</option>
                      <option value="Visita">Visita</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                {/* Details / Notes */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Detalhes</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Descreva o objetivo do contato (Ex: confirmar recebimento de mercadoria, propor nova oferta, etc.)"
                    value={taskDetails}
                    onChange={(e) => setTaskDetails(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-medium leading-relaxed resize-none"
                  />
                </div>

                {/* Seller Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Vendedor responsável</label>
                  <div className="relative">
                    <select 
                      value={taskSalesperson}
                      onChange={(e) => setTaskSalesperson(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Selecione o vendedor...</option>
                      {sellers.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setShowTaskDrawer(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="create-task-drawer-form"
                className="flex-1 px-4 py-3 bg-[#851b42] hover:bg-[#5e132e] text-white rounded-xl font-bold transition-colors shadow-sm"
              >
                Salvar tarefa
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 📝 DRAWER: REGISTRAR ATIVIDADE (SLIDE-OUT PANEL) */}
      {/* ======================================================= */}
      {showActivityDrawer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={() => setShowActivityDrawer(false)} />
          
          {/* Drawer Box */}
          <div className="bg-white max-w-md w-full h-full p-6 shadow-2xl relative z-10 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6 overflow-y-auto pr-1">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wider">Registrar Atividade</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Lançar contato já efetuado</p>
                </div>
                <button 
                  onClick={() => setShowActivityDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Block */}
              <form onSubmit={handleRegisterActivitySubmit} id="register-activity-drawer-form" className="space-y-5 text-xs text-slate-700">
                
                {/* Date and Time Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Data</label>
                    <input 
                      type="date"
                      required
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Hora</label>
                    <input 
                      type="time"
                      required
                      value={activityTime}
                      onChange={(e) => setActivityTime(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold cursor-pointer"
                    />
                  </div>
                </div>

                {/* Medium of Contact */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Meio de contato</label>
                  <div className="relative">
                    <select 
                      value={activityContactMedium}
                      onChange={(e) => setActivityContactMedium(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold appearance-none cursor-pointer"
                    >
                      <option value="Ligação">Ligação</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Reunião presencial">Reunião presencial</option>
                      <option value="Visita">Visita</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                {/* Activity Result */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Resultado / Desfecho</label>
                  <div className="relative">
                    <select 
                      value={activityResult}
                      onChange={(e) => setActivityResult(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-semibold appearance-none cursor-pointer"
                    >
                      <option value="Venda realizada">Venda realizada</option>
                      <option value="Agendou reunião">Agendou reunião</option>
                      <option value="Enviou orçamento">Enviou orçamento</option>
                      <option value="Apenas contato de rotina">Apenas contato de rotina</option>
                      <option value="Cliente não atendeu / sem contato">Cliente não atendeu / sem contato</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                {/* Details / Notes */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">* Descrição do contato</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Ex: Liguei para tirar dúvidas sobre produtos. Demonstrou interesse no catálogo de calçados de couro."
                    value={activityDetails}
                    onChange={(e) => setActivityDetails(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 font-medium leading-relaxed resize-none"
                  />
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setShowActivityDrawer(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="register-activity-drawer-form"
                className="flex-1 px-4 py-3 bg-[#851b42] hover:bg-[#5e132e] text-white rounded-xl font-bold transition-colors shadow-sm"
              >
                Registrar Atividade
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void; outline?: boolean };
  actions?: Array<{ label: string; onClick: () => void; primary?: boolean; outline?: boolean }>;
}

function Section({ title, children, action, actions }: SectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <span className="font-extrabold text-xs text-slate-600 uppercase tracking-wider">{title}</span>
        <div className="flex gap-2 flex-wrap">
          {action && (
            <button className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
              action.outline 
                ? "bg-white border border-slate-300 text-[#851b42] hover:bg-slate-50" 
                : "bg-[#851b42] text-white hover:bg-[#5e132e]"
            )} onClick={action.onClick}>
              {action.label}
            </button>
          )}
          {actions && actions.map((a, i) => (
            <button key={i} className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
              !a.primary 
                ? "bg-white border border-slate-300 text-[#851b42] hover:bg-slate-50" 
                : "bg-[#851b42] text-white hover:bg-[#5e132e]"
            )} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}
