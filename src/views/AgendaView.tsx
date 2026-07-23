import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Route, 
  Filter as FilterIcon, 
  ClipboardList, 
  Lightbulb, 
  X, 
  ChevronDown, 
  Calendar, 
  User, 
  Phone, 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle,
  Plus,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { getClients } from '../lib/store';
import { Client, PlannedRoute, Seller } from '../types';

// Helper to format YYYY-MM-DD date to DD/MM/YYYY
function formatDateToBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Helper to format DD/MM/YYYY date to YYYY-MM-DD
function formatDateToUS(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Helper to parse DD/MM/YYYY date into a Date object
function parseBRDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return null;
}

// Helper to get day of week in Portuguese from YYYY-MM-DD
function getDayOfWeekBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[date.getDay()];
  }
  return '';
}

interface AgendaItem {
  id: string;
  type: 'task' | 'activity';
  date: string;
  time: string;
  contactMedium: string;
  clientId: string;
  clientName: string;
  details: string;
  salesperson: string;
  status: 'pending' | 'done'; // for tasks
  result?: string; // for activities
}

export function AgendaView({ userEmail, activeSeller }: { userEmail: string; activeSeller?: Seller | null }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showRegisterActivity, setShowRegisterActivity] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'tarefas' | 'roteiros'>('tarefas');

  // Routes state
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  const canManageRoutes = !activeSeller || activeSeller.role === 'Administrador' || activeSeller.permissions.permitirCadastrarAlterarExcluirRoteiros;

  // Route form states (Match Second Image)
  const [routeName, setRouteName] = useState('');
  const [routeSalesperson, setRouteSalesperson] = useState('iranildo');
  const [routeActive, setRouteActive] = useState(true);
  const [routeDate, setRouteDate] = useState('2026-07-15');
  const [routeRepeat, setRouteRepeat] = useState('Nunca');
  const [routeClients, setRouteClients] = useState<string[]>([]); // Array of client IDs in order
  const [showAddClientsModal, setShowAddClientsModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<PlannedRoute | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // States for Resolving (Completing) Task/Activity modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingItemId, setResolvingItemId] = useState<string | null>(null);
  const [resolveResult, setResolveResult] = useState('Venda realizada');
  const [resolveDetails, setResolveDetails] = useState('');

  // Storage key for items
  const getStorageKey = (key: string) => `vitrine_pay_${userEmail}_${key}`;

  // Local state for agenda items
  const [items, setItems] = useState<AgendaItem[]>([]);

  // Form states for Create Task
  const [taskDate, setTaskDate] = useState('2026-07-15');
  const [taskTime, setTaskTime] = useState('');
  const [taskContactMedium, setTaskContactMedium] = useState('Ligação');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskSalesperson, setTaskSalesperson] = useState('iranildo');

  // Form states for Register Activity
  const [activityDate, setActivityDate] = useState('2026-07-15');
  const [activityTime, setActivityTime] = useState('22:48');
  const [activityContactMedium, setActivityContactMedium] = useState('Ligação');
  const [activityClientId, setActivityClientId] = useState('');
  const [activityResult, setActivityResult] = useState('Resultado da atividade');
  const [activityDetails, setActivityDetails] = useState('');

  // Filter states
  const [filterPeriod, setFilterPeriod] = useState('15/04/2026 a 15/10/2026');
  const [filterStartDate, setFilterStartDate] = useState('2026-04-15');
  const [filterEndDate, setFilterEndDate] = useState('2026-10-15');
  const [selectedPeriodType, setSelectedPeriodType] = useState<'custom' | 'today' | 'week' | 'month' | 'all'>('custom');
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [filterSalespeople, setFilterSalespeople] = useState<string[]>(['iranildo']);
  const [filterClientId, setFilterClientId] = useState('all');
  const [filterContactMedium, setFilterContactMedium] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' (Não realizadas), 'done' (Realizadas), 'all' (Todas)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const handleSelectPeriodType = (type: 'custom' | 'today' | 'week' | 'month' | 'all') => {
    setSelectedPeriodType(type);
    if (type === 'today') {
      setFilterStartDate('2026-07-15');
      setFilterEndDate('2026-07-15');
      setFilterPeriod('15/07/2026');
    } else if (type === 'week') {
      setFilterStartDate('2026-07-13');
      setFilterEndDate('2026-07-19');
      setFilterPeriod('13/07/2026 a 19/07/2026');
    } else if (type === 'month') {
      setFilterStartDate('2026-07-01');
      setFilterEndDate('2026-07-31');
      setFilterPeriod('01/07/2026 a 31/07/2026');
    } else if (type === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
      setFilterPeriod('Todo o período');
    } else if (type === 'custom') {
      setShowCustomPeriod(true);
    }
  };

  const handleCustomStartDateChange = (val: string) => {
    setFilterStartDate(val);
    setSelectedPeriodType('custom');
    if (val && filterEndDate) {
      setFilterPeriod(`${formatDateToBR(val)} a ${formatDateToBR(filterEndDate)}`);
    } else if (val) {
      setFilterPeriod(`A partir de ${formatDateToBR(val)}`);
    } else if (filterEndDate) {
      setFilterPeriod(`Até ${formatDateToBR(filterEndDate)}`);
    } else {
      setFilterPeriod('Todo o período');
    }
  };

  const handleCustomEndDateChange = (val: string) => {
    setFilterEndDate(val);
    setSelectedPeriodType('custom');
    if (filterStartDate && val) {
      setFilterPeriod(`${formatDateToBR(filterStartDate)} a ${formatDateToBR(val)}`);
    } else if (val) {
      setFilterPeriod(`Até ${formatDateToBR(val)}`);
    } else if (filterStartDate) {
      setFilterPeriod(`A partir de ${formatDateToBR(filterStartDate)}`);
    } else {
      setFilterPeriod('Todo o período');
    }
  };

  // Load clients, agenda items, and routes
  useEffect(() => {
    const loadedClients = getClients(userEmail);
    setClients(loadedClients);

    // Initial default items if none exist
    const agendaKey = getStorageKey('agenda_items');
    const stored = localStorage.getItem(agendaKey);
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      const defaultItems: AgendaItem[] = [
        {
          id: 'def-1',
          type: 'task',
          date: '15/07/2026',
          time: '14:30',
          contactMedium: 'Ligação',
          clientId: '1',
          clientName: 'Supermercado do Bairro',
          details: 'Confirmar o recebimento das amostras de couro legítimo e negociar lote inicial.',
          salesperson: 'iranildo',
          status: 'pending'
        },
        {
          id: 'def-2',
          type: 'activity',
          date: '15/07/2026',
          time: '22:48',
          contactMedium: 'Ligação',
          clientId: '2',
          clientName: 'Drogaria Saúde Viva',
          details: 'Ligação feita para tirar dúvidas sobre a impermeabilidade das mochilas executivas.',
          salesperson: 'iranildo',
          status: 'done',
          result: 'Agendou reunião'
        }
      ];
      localStorage.setItem(agendaKey, JSON.stringify(defaultItems));
      setItems(defaultItems);
    }

    // Load routes
    const routesKey = getStorageKey('planned_routes');
    const storedRoutes = localStorage.getItem(routesKey);
    if (storedRoutes) {
      setRoutes(JSON.parse(storedRoutes));
    } else {
      setRoutes([]);
    }
  }, [userEmail]);

  // Helper to persist items
  const saveItemsToStorage = (newItems: AgendaItem[]) => {
    setItems(newItems);
    localStorage.setItem(getStorageKey('agenda_items'), JSON.stringify(newItems));
  };

  // Helper to persist routes
  const saveRoutesToStorage = (newRoutes: PlannedRoute[]) => {
    setRoutes(newRoutes);
    localStorage.setItem(getStorageKey('planned_routes'), JSON.stringify(newRoutes));
  };

  // Submit handlers
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === taskClientId);
    const clientName = selectedClient ? selectedClient.name : 'Cliente Avulso';

    const newTask: AgendaItem = {
      id: `task-${Date.now()}`,
      type: 'task',
      date: formatDateToBR(taskDate),
      time: taskTime || '--:--',
      contactMedium: taskContactMedium,
      clientId: taskClientId,
      clientName: clientName,
      details: taskDetails,
      salesperson: taskSalesperson,
      status: 'pending'
    };

    const updated = [newTask, ...items];
    saveItemsToStorage(updated);
    
    // Reset Form
    setTaskTime('');
    setTaskDetails('');
    setTaskClientId('');
    setShowCreateTask(false);
  };

  const handleRegisterActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === activityClientId);
    const clientName = selectedClient ? selectedClient.name : 'Cliente Avulso';

    const newActivity: AgendaItem = {
      id: `activity-${Date.now()}`,
      type: 'activity',
      date: formatDateToBR(activityDate),
      time: activityTime || '00:00',
      contactMedium: activityContactMedium,
      clientId: activityClientId,
      clientName: clientName,
      details: activityDetails,
      salesperson: 'iranildo', // matching screenshot defaults
      status: 'done',
      result: activityResult
    };

    const updated = [newActivity, ...items];
    saveItemsToStorage(updated);

    // Reset Form
    setActivityDetails('');
    setActivityClientId('');
    setShowRegisterActivity(false);
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) return;

    const routeDataObj: PlannedRoute = {
      id: editingRouteId || `route-${Date.now()}`,
      name: routeName,
      salesperson: routeSalesperson || 'iranildo',
      date: routeDate,
      repeat: routeRepeat,
      active: routeActive,
      clients: routeClients,
    };

    let updated: PlannedRoute[];
    if (editingRouteId) {
      updated = routes.map(r => r.id === editingRouteId ? routeDataObj : r);
    } else {
      updated = [routeDataObj, ...routes];
    }

    saveRoutesToStorage(updated);

    // Reset Route form
    setRouteName('');
    setRouteSalesperson('');
    setRouteActive(true);
    setRouteDate('2026-07-15');
    setRouteRepeat('Nunca');
    setRouteClients([]);
    setEditingRouteId(null);
    setShowCreateRoute(false);
  };

  const handleToggleTaskStatus = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.status === 'pending') {
      // Open the Resolve Modal instead of immediate change
      setResolvingItemId(id);
      setResolveResult('Venda realizada'); // Default outcome
      setResolveDetails('');
      setShowResolveModal(true);
    } else {
      // Toggle back to pending
      const updated = items.map(i => {
        if (i.id === id) {
          return {
            ...i,
            status: 'pending' as const,
            result: undefined,
            resolutionDetails: undefined
          };
        }
        return i;
      });
      saveItemsToStorage(updated);
    }
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItemId) return;

    const updated = items.map(i => {
      if (i.id === resolvingItemId) {
        return {
          ...i,
          status: 'done' as const,
          result: resolveResult,
          resolutionDetails: resolveDetails
        };
      }
      return i;
    });

    saveItemsToStorage(updated);
    setResolvingItemId(null);
    setShowResolveModal(false);
    setResolveDetails('');
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    saveItemsToStorage(updated);
  };

  const handleClearFilters = () => {
    setFilterPeriod('15/04/2026 a 15/10/2026');
    setFilterStartDate('2026-04-15');
    setFilterEndDate('2026-10-15');
    setSelectedPeriodType('custom');
    setShowCustomPeriod(false);
    setFilterSalespeople(['iranildo']);
    setFilterClientId('all');
    setFilterContactMedium('all');
    setFilterStatus('all');
    setShowFilters(false);
    setSelectedCalendarDate(null);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // 0. Filter by Selected Calendar Date
    if (selectedCalendarDate && item.date !== selectedCalendarDate) {
      return false;
    }
    // 1. Filter Salesperson
    if (filterSalespeople.length > 0 && !filterSalespeople.includes(item.salesperson)) {
      return false;
    }
    // 2. Filter Client
    if (filterClientId !== 'all' && item.clientId !== filterClientId) {
      return false;
    }
    // 3. Filter Contact Medium
    if (filterContactMedium !== 'all' && item.contactMedium !== filterContactMedium) {
      return false;
    }
    // 4. Filter Status
    if (filterStatus === 'pending') {
      // only pending tasks
      if (!(item.type === 'task' && item.status === 'pending')) {
        return false;
      }
    } else if (filterStatus === 'done') {
      // only done tasks or completed activities
      if (!(item.type === 'activity' || (item.type === 'task' && item.status === 'done'))) {
        return false;
      }
    }
    // 5. Filter by Period (Date Range)
    if (item.date) {
      const itemDate = parseBRDate(item.date);
      if (itemDate) {
        if (filterStartDate) {
          const start = new Date(filterStartDate + 'T00:00:00');
          if (itemDate < start) return false;
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate + 'T23:59:59');
          if (itemDate > end) return false;
        }
      }
    }
    return true;
  });

  return (
    <div className="animate-in fade-in duration-300 md:max-w-3xl md:mx-auto relative pb-20">
      
      {/* Lightbulb Help Banner */}
      <div className="bg-primary-fixed text-on-primary-fixed p-4 flex gap-3 items-start md:mt-4 md:rounded-lg shadow-sm">
        <Lightbulb className="text-primary mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="text-label-md text-primary font-bold">Que tal uma demonstração gratuita?</h3>
          <p className="text-body-sm text-on-primary-fixed-variant mt-1">
            Fale com um de nossos especialistas e veja tudo que o Vitrine Pay pode fazer pelo seu negócio.
          </p>
        </div>
        <button className="p-1 rounded-full hover:bg-on-primary-fixed/10 transition-colors">
          <X size={18} className="text-primary" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex w-full bg-surface-container-lowest border-b border-outline-variant mt-2 md:rounded-t-lg md:mt-4">
        <button 
          onClick={() => setActiveTab('tarefas')}
          className={`flex-1 py-3 px-4 flex gap-2 items-center justify-center border-b-2 font-bold text-sm transition-all ${
            activeTab === 'tarefas' 
              ? 'border-[#851b42] text-[#851b42]' 
              : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <CheckCircle2 size={18} />
          TAREFAS
        </button>
        <button 
          onClick={() => setActiveTab('roteiros')}
          className={`flex-1 py-3 px-4 flex gap-2 items-center justify-center border-b-2 font-bold text-sm transition-all ${
            activeTab === 'roteiros' 
              ? 'border-[#851b42] text-[#851b42]' 
              : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <Route size={18} />
          ROTEIROS
        </button>
      </div>

      {activeTab === 'tarefas' ? (
        <>
          {/* Mini Calendar Row */}
          <div className="bg-surface-container-lowest border-b border-outline-variant py-4 px-2 overflow-x-auto hide-scrollbar">
            <div className="flex justify-between items-center min-w-max gap-2 px-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => {
                const dateNum = 13 + i; // adjusting values around 15th
                const dateStr = `${dateNum < 10 ? '0' : ''}${dateNum}/07/2026`;
                const isToday = dateNum === 15;
                const isSelected = selectedCalendarDate === dateStr;
                
                return (
                  <button 
                    key={day} 
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCalendarDate(null);
                      } else {
                        setSelectedCalendarDate(dateStr);
                      }
                    }}
                    className={`flex flex-col items-center min-w-[54px] gap-1.5 p-1.5 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-[#851b42]/15 border border-[#851b42]/30 shadow-xs' 
                        : 'hover:bg-slate-100/70 border border-transparent'
                    } ${selectedCalendarDate && !isSelected ? 'opacity-60 hover:opacity-100' : ''}`}
                  >
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      isSelected 
                        ? 'text-[#851b42]' 
                        : isToday 
                          ? 'text-[#851b42] font-extrabold' 
                          : 'text-slate-400'
                    }`}>
                      {day}
                    </span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-[#851b42] text-white shadow-sm font-extrabold' 
                        : isToday 
                          ? 'border-2 border-[#851b42] text-[#851b42] bg-white font-extrabold' 
                          : 'text-slate-700'
                    }`}>
                      {dateNum}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons Container */}
          <div className="p-4 flex gap-4 bg-surface-container-lowest md:rounded-b-lg shadow-sm border-b border-outline-variant">
            <button 
              onClick={() => setShowCreateTask(true)}
              className="flex-1 bg-primary text-on-primary py-3.5 px-4 rounded-xl flex justify-center items-center font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              REGISTRAR TAREFA
            </button>
            <button 
              onClick={() => setShowRegisterActivity(true)}
              className="flex-1 border border-primary/30 text-primary py-3.5 px-4 rounded-xl flex justify-center items-center font-bold text-sm hover:bg-primary/5 transition-colors"
            >
              REGISTRAR ATIVIDADE
            </button>
          </div>

          {/* Title & Filter Header */}
          <div className="px-4 pt-6 pb-4 flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Tarefas e Atividades</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Acompanhe as tarefas agendadas e realizadas.</p>
              {selectedCalendarDate && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-[#851b42]/10 border border-[#851b42]/20 rounded-lg text-[10px] font-bold text-[#851b42]">
                  <span>Mostrando apenas: {selectedCalendarDate}</span>
                  <button 
                    onClick={() => setSelectedCalendarDate(null)}
                    className="p-0.5 hover:bg-[#851b42]/20 rounded-full transition-colors flex items-center justify-center"
                    title="Limpar data"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
                filterStatus !== 'all' || filterClientId !== 'all' || filterSalespeople.length !== 1 || filterSalespeople[0] !== 'iranildo' || selectedCalendarDate !== null
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'border-slate-200 text-on-surface-variant hover:border-slate-300'
              }`}
            >
              <span>FILTROS</span>
              <FilterIcon size={14} />
            </button>
          </div>

          {/* Items List */}
          {filteredItems.length > 0 ? (
            <div className="px-4 space-y-4">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className={`p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col gap-3 ${
                    item.status === 'done' ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{item.clientName}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === 'done' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : item.type === 'task'
                              ? 'bg-primary/5 text-primary'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.type === 'task' ? 'Tarefa' : 'Atividade'}
                        </span>
                        {item.result && (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {item.result}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {item.time}
                        </span>
                        <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] font-bold text-primary/70">
                          • {item.contactMedium}
                        </span>
                        <span className="text-slate-400">• Vendedor: {item.salesperson}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleToggleTaskStatus(item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.status === 'done' 
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                            : 'text-slate-400 hover:text-primary hover:bg-slate-50'
                        }`}
                        title={item.status === 'done' ? 'Marcar como pendente' : 'Marcar como feita'}
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {item.details && (
                    <p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 leading-relaxed italic">
                      "{item.details}"
                    </p>
                  )}

                  {item.resolutionDetails && (
                    <div className="text-xs text-emerald-800 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/40 leading-relaxed mt-1">
                      <span className="font-bold">Desfecho:</span> "{item.resolutionDetails}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <ClipboardList size={36} className="text-slate-300 font-light" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Nenhuma tarefa ou atividade encontrada</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Não encontramos nenhuma tarefa ou atividade para este período. Crie uma nova ou verifique os filtros aplicados.
              </p>
            </div>
          )}
        </>
      ) : (
        /* ROTEIROS TAB CONTENT */
        <div className="p-4 space-y-6 animate-in fade-in duration-300">
          {!showCreateRoute ? (
            /* Screen 1: ROTEIROS PLANEJADOS LISTING */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">ROTEIROS PLANEJADOS</h2>
                  <p className="text-xs text-slate-500 mt-1">Crie e acompanhe os roteiros planejados para a sua equipe.</p>
                </div>
                {canManageRoutes && (
                  <button
                    onClick={() => {
                      setEditingRouteId(null);
                      setRouteName('');
                      setRouteSalesperson('');
                      setRouteActive(true);
                      setRouteDate('2026-07-15');
                      setRouteRepeat('Nunca');
                      setRouteClients([]);
                      setShowCreateRoute(true);
                    }}
                    className="bg-[#851b42] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#3d2c67] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    Criar roteiro
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Roteiro <span className="text-slate-300 text-[10px]">▼</span></th>
                      <th className="py-3 px-2">Vendedor</th>
                      <th className="py-3 px-2">Data</th>
                      <th className="py-3 px-2">Repete</th>
                      <th className="py-3 px-2">Dia da semana</th>
                      <th className="py-3 px-2">Qtde. de clientes</th>
                      <th className="py-3 px-2">Situação</th>
                      {canManageRoutes && <th className="py-3 px-2 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {routes.length > 0 ? (
                      routes.map((route) => (
                        <tr key={route.id} className="border-b border-slate-50 text-xs text-slate-700 hover:bg-slate-50/50 transition-all">
                          <td className="py-3 px-2 font-bold text-slate-800">{route.name}</td>
                          <td className="py-3 px-2">
                            {route.salesperson === 'iranildo' 
                              ? 'iranildo' 
                              : route.salesperson === 'maria_silva' 
                                ? 'Maria Silva' 
                                : route.salesperson === 'joao_p' 
                                  ? 'João Pedro' 
                                  : route.salesperson || 'Não selecionado'}
                          </td>
                          <td className="py-3 px-2">{formatDateToBR(route.date)}</td>
                          <td className="py-3 px-2">{route.repeat}</td>
                          <td className="py-3 px-2">{getDayOfWeekBR(route.date)}</td>
                          <td className="py-3 px-2">{route.clients.length} {route.clients.length === 1 ? 'cliente' : 'clientes'}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${route.active ? 'bg-[#f5f2f9] text-[#851b42]' : 'bg-slate-100 text-slate-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${route.active ? 'bg-[#851b42]' : 'bg-slate-400'}`}></span>
                              {route.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          {canManageRoutes && (
                            <td className="py-3 px-2 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingRouteId(route.id);
                                    setRouteName(route.name);
                                    setRouteSalesperson(route.salesperson);
                                    setRouteActive(route.active);
                                    setRouteDate(route.date);
                                    setRouteRepeat(route.repeat);
                                    setRouteClients(route.clients);
                                    setShowCreateRoute(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#851b42] hover:bg-slate-100 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                </button>
                                <button
                                  onClick={() => {
                                    setRouteToDelete(route);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          Não há roteiros criados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Screen 2: CREATE / EDIT ROUTE FORM */
            <form onSubmit={handleSaveRoute} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">ROTEIRO</h2>
                <p className="text-xs text-slate-500 mt-1">Configure o roteiro adicionando os clientes e ajustando a ordem das visitas.</p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Nome */}
                <div className="md:col-span-5 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do roteiro"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Vendedor */}
                <div className="md:col-span-5 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendedor</label>
                  <div className="relative">
                    <select
                      required
                      value={routeSalesperson}
                      onChange={(e) => setRouteSalesperson(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="" disabled>Selecione...</option>
                      <option value="iranildo">iranildo</option>
                      <option value="maria_silva">Maria Silva</option>
                      <option value="joao_p">João Pedro</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* Situação */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Situação</label>
                  <div className="flex items-center gap-2.5 py-1.5">
                    <button
                      type="button"
                      onClick={() => setRouteActive(!routeActive)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${routeActive ? 'bg-[#851b42]' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${routeActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs font-semibold text-slate-600">{routeActive ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
              </div>

              {/* Data e Repete row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-md">
                {/* Data */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data</label>
                  <input
                    type="date"
                    required
                    value={routeDate}
                    onChange={(e) => setRouteDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                  />
                </div>

                {/* Repete */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Repete</label>
                  <div className="relative">
                    <select
                      value={routeRepeat}
                      onChange={(e) => setRouteRepeat(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="Nunca">Nunca</option>
                      <option value="Semanalmente">Semanalmente</option>
                      <option value="Quinzenalmente">Quinzenalmente</option>
                      <option value="Mensalmente">Mensalmente</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Clientes List block */}
              <div className="space-y-2">
                <div className="p-5 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative min-h-[160px] hover:border-primary/40 transition-colors">
                  
                  {routeClients.length > 0 ? (
                    <div className="w-full space-y-2.5">
                      <div className="flex justify-between items-center px-1 mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visitas Adicionadas</span>
                        <button
                          type="button"
                          onClick={() => setShowAddClientsModal(true)}
                          className="text-xs font-bold text-[#851b42] hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Alterar seleção
                        </button>
                      </div>
                      
                      {routeClients.map((clientId, idx) => {
                        const client = clients.find(c => c.id === clientId);
                        if (!client) return null;
                        return (
                          <div key={clientId} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#f5f2f9] text-[#851b42] flex items-center justify-center text-xs font-extrabold">
                                {idx + 1}º
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{client.name}</h4>
                                <p className="text-[10px] text-slate-400">{client.location || 'Sem localização'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const updated = [...routeClients];
                                  const temp = updated[idx];
                                  updated[idx] = updated[idx - 1];
                                  updated[idx - 1] = temp;
                                  setRouteClients(updated);
                                }}
                                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-50"
                                title="Mover para cima"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                              </button>
                              <button
                                type="button"
                                disabled={idx === routeClients.length - 1}
                                onClick={() => {
                                  const updated = [...routeClients];
                                  const temp = updated[idx];
                                  updated[idx] = updated[idx + 1];
                                  updated[idx + 1] = temp;
                                  setRouteClients(updated);
                                }}
                                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-50"
                                title="Mover para baixo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                              </button>
                              <span className="text-slate-200 mx-1">|</span>
                              <button
                                type="button"
                                onClick={() => setRouteClients(routeClients.filter(id => id !== clientId))}
                                className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                                title="Remover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddClientsModal(true)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg group-hover:bg-[#f5f2f9] group-hover:text-[#851b42] transition-colors">
                        +
                      </div>
                      <span className="text-xs font-bold text-slate-500 tracking-tight group-hover:text-[#851b42] transition-colors">Adicionar clientes</span>
                    </button>
                  )}

                  {/* Client Count display matching screenshot */}
                  <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-400">
                    {routeClients.length} {routeClients.length === 1 ? 'cliente adicionado' : 'clientes adicionados'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-[#851b42] hover:bg-[#3d2c67] text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md transition-all"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRoute(false)}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-3 px-6 rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL 1: CRIAR TAREFA (1st Image) */}
      {/* ──────────────────────────────────────────────────────── */}
      {showCreateTask && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="bg-[#f8f9fa] border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-lg font-bold text-slate-800">Criar tarefa</span>
              <button 
                onClick={() => setShowCreateTask(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTaskSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* DATA Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DATA</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input 
                      type="date" 
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer text-center"
                    />
                  </div>
                </div>
              </div>

              {/* MEIO DE CONTATO Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MEIO DE CONTATO</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={taskContactMedium}
                    onChange={(e) => setTaskContactMedium(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="Ligação">Ligação</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Reunião Presencial">Reunião Presencial</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* CLIENTE Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CLIENTE</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={taskClientId}
                    onChange={(e) => setTaskClientId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>Selecione ou pesquise pelo nome</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="new">Criar cliente avulso...</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* DETALHES Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DETALHES</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <textarea 
                  rows={3}
                  value={taskDetails}
                  onChange={(e) => setTaskDetails(e.target.value)}
                  placeholder="Descreva o objetivo desta tarefa"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                ></textarea>
              </div>

              {/* VENDEDOR Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDEDOR</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={taskSalesperson}
                    onChange={(e) => setTaskSalesperson(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="iranildo">iranildo</option>
                    <option value="maria_silva">Maria Silva</option>
                    <option value="joao_p">João Pedro</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary/90 transition-all text-sm shadow-md"
                >
                  Salvar
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 bg-white text-primary border border-slate-200 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL 2: REGISTRAR ATIVIDADE (2nd Image) */}
      {/* ──────────────────────────────────────────────────────── */}
      {showRegisterActivity && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="bg-[#f8f9fa] border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-lg font-bold text-slate-800">Registrar atividade</span>
              <button 
                onClick={() => setShowRegisterActivity(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterActivitySubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* DATA Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DATA</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input 
                      type="date" 
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={activityTime}
                      onChange={(e) => setActivityTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer text-center"
                    />
                  </div>
                </div>
              </div>

              {/* MEIO DE CONTATO Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MEIO DE CONTATO</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={activityContactMedium}
                    onChange={(e) => setActivityContactMedium(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="Ligação">Ligação</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Reunião Presencial">Reunião Presencial</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* CLIENTE Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CLIENTE</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={activityClientId}
                    onChange={(e) => setActivityClientId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>Selecione ou pesquise pelo nome</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* RESULTADO Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RESULTADO</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <select 
                      value={activityResult}
                      onChange={(e) => setActivityResult(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none font-medium"
                    >
                      <option value="Resultado da atividade">Resultado da atividade</option>
                      <option value="Venda realizada">Venda realizada</option>
                      <option value="Agendou reunião">Agendou reunião</option>
                      <option value="Retornar depois">Retornar depois</option>
                      <option value="Não tem interesse">Não tem interesse</option>
                      <option value="Sem sucesso (Não atendeu)">Sem sucesso (Não atendeu)</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                  
                  <textarea 
                    rows={3}
                    value={activityDetails}
                    onChange={(e) => setActivityDetails(e.target.value)}
                    placeholder="Detalhes da atividade"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                    required
                  ></textarea>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary/90 transition-all text-sm shadow-md"
                >
                  Salvar
                </button>
                <button 
                  type="button"
                  onClick={() => setShowRegisterActivity(false)}
                  className="flex-1 bg-white text-primary border border-slate-200 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL 3: FILTRO DE TAREFAS E ATIVIDADES (3rd Image) */}
      {/* ──────────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="bg-[#f8f9fa] border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-lg font-bold text-slate-800">Filtro de tarefas e atividades</span>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* PERÍODO Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PERÍODO</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-600">
                    <span className="text-primary">✎</span>
                    <span className="font-medium">{filterPeriod}</span>
                  </div>

                  {/* Predefined range buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPeriodType('all')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${selectedPeriodType === 'all' ? 'bg-[#f5f2f9] border-[#e5dfec] text-[#851b42]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      Todo o período
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPeriodType('today')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${selectedPeriodType === 'today' ? 'bg-[#f5f2f9] border-[#e5dfec] text-[#851b42]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPeriodType('week')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${selectedPeriodType === 'week' ? 'bg-[#f5f2f9] border-[#e5dfec] text-[#851b42]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      Esta Semana
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPeriodType('month')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${selectedPeriodType === 'month' ? 'bg-[#f5f2f9] border-[#e5dfec] text-[#851b42]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      Este Mês
                    </button>
                  </div>
                  
                  <div 
                    onClick={() => {
                      setSelectedPeriodType('custom');
                      setShowCustomPeriod(!showCustomPeriod);
                    }}
                    className={`w-full border rounded-xl px-4 py-2.5 flex items-center justify-between text-sm font-bold cursor-pointer transition-all ${selectedPeriodType === 'custom' ? 'bg-[#f5f2f9]/60 border-[#e5dfec] text-[#851b42]' : 'bg-white border-slate-200 text-[#851b42] hover:bg-slate-50/30'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarDays size={18} className="text-primary" />
                      <span>Outro período</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${showCustomPeriod ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Custom date range inputs */}
                  {(showCustomPeriod || selectedPeriodType === 'custom') && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">De (Início)</label>
                          <input 
                            type="date" 
                            value={filterStartDate}
                            onChange={(e) => handleCustomStartDateChange(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Até (Fim)</label>
                          <input 
                            type="date" 
                            value={filterEndDate}
                            onChange={(e) => handleCustomEndDateChange(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VENDEDOR Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDEDOR</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                
                <div className="relative flex flex-wrap items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                  {filterSalespeople.map(sales => (
                    <span key={sales} className="flex items-center gap-1.5 bg-[#f5f2f9] border border-[#e5dfec] text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold">
                      <span>{sales}</span>
                      <button 
                        onClick={() => setFilterSalespeople(filterSalespeople.filter(v => v !== sales))}
                        className="text-red-500 hover:text-red-700 font-bold ml-0.5 text-[11px] focus:outline-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  
                  {filterSalespeople.length === 0 && (
                    <span className="text-slate-400 text-xs py-1">Selecione vendedores</span>
                  )}

                  <div className="ml-auto flex items-center gap-1.5">
                    <button 
                      onClick={() => {
                        if (!filterSalespeople.includes('iranildo')) {
                          setFilterSalespeople([...filterSalespeople, 'iranildo']);
                        }
                      }}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      + iranildo
                    </button>
                    <span className="text-slate-300">|</span>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* CLIENTE Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CLIENTE</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={filterClientId}
                    onChange={(e) => setFilterClientId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="all">Todos os clientes</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* MEIO DE CONTATO Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MEIO DE CONTATO</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={filterContactMedium}
                    onChange={(e) => setFilterContactMedium(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="all">Todos os meios de contato</option>
                    <option value="Ligação">Ligação</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Reunião Presencial">Reunião Presencial</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* STATUS Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>
                <div className="relative">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="all">Todas</option>
                    <option value="pending">Não realizadas</option>
                    <option value="done">Realizadas</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary/90 transition-all text-sm shadow-md"
                >
                  Aplicar
                </button>
                <button 
                  onClick={handleClearFilters}
                  className="flex-1 bg-white text-rose-600 border border-slate-200 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  Limpar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL 4: SELECIONAR CLIENTES PARA O ROTEIRO */}
      {/* ──────────────────────────────────────────────────────── */}
      {showAddClientsModal && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="bg-[#f8f9fa] border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-base font-bold text-slate-800">Selecionar Clientes</span>
              <button 
                onClick={() => setShowAddClientsModal(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Client Picker list */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-500">Selecione os clientes para visitar neste roteiro:</p>
              
              <div className="space-y-2">
                {clients.map(c => {
                  const isChecked = routeClients.includes(c.id);
                  return (
                    <label 
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-[#f5f2f9] border-[#e5dfec]' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setRouteClients(routeClients.filter(id => id !== c.id));
                          } else {
                            setRouteClients([...routeClients, c.id]);
                          }
                        }}
                        className="rounded border-slate-300 text-[#851b42] focus:ring-[#851b42] w-4 h-4"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block">{c.name}</span>
                        {c.location && <span className="text-[10px] text-slate-400 font-medium block">{c.location}</span>}
                      </div>
                    </label>
                  );
                })}

                {clients.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">Nenhum cliente cadastrado.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => setShowAddClientsModal(false)}
                className="flex-1 bg-[#851b42] hover:bg-[#3d2c67] text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                Confirmar ({routeClients.length})
              </button>
              <button
                onClick={() => setShowAddClientsModal(false)}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL 5: CONFIRMAR EXCLUSÃO DE ROTEIRO */}
      {/* ──────────────────────────────────────────────────────── */}
      {showDeleteModal && routeToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-red-50 border-b border-red-100/50 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Trash2 size={16} />
              </div>
              <span className="text-sm font-bold text-slate-800">Excluir Roteiro</span>
            </div>

            {/* Content */}
            <div className="p-6 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir o roteiro <strong className="text-slate-800">{routeToDelete.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                Esta ação é definitiva e não poderá ser desfeita.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  saveRoutesToStorage(routes.filter(r => r.id !== routeToDelete.id));
                  setRouteToDelete(null);
                  setShowDeleteModal(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs"
              >
                Excluir
              </button>
              <button
                type="button"
                onClick={() => {
                  setRouteToDelete(null);
                  setShowDeleteModal(false);
                }}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL 6: COMO FOI RESOLVIDO (DESFECHO) */}
      {/* ──────────────────────────────────────────────────────── */}
      {showResolveModal && resolvingItemId && (() => {
        const item = items.find(i => i.id === resolvingItemId);
        if (!item) return null;
        return (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-[#f8f9fa] border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Finalizar {item.type === 'task' ? 'Tarefa' : 'Atividade'}</span>
                <button 
                  type="button"
                  onClick={() => {
                    setResolvingItemId(null);
                    setShowResolveModal(false);
                  }}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
                <div className="bg-[#f5f2f9]/50 border border-[#e5dfec]/30 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-extrabold text-[#851b42] uppercase tracking-wider block">Cliente</span>
                  <span className="text-xs font-bold text-slate-800 block">{item.clientName}</span>
                  {item.details && (
                    <span className="text-[11px] text-slate-500 italic block mt-1">"{item.details}"</span>
                  )}
                </div>

                {/* RESULTADO Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Como foi resolvido?</span>
                    <div className="flex-1 h-[1px] bg-slate-100"></div>
                  </div>
                  <div className="relative">
                    <select 
                      value={resolveResult}
                      onChange={(e) => setResolveResult(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none font-semibold"
                    >
                      <option value="Venda realizada">Venda realizada</option>
                      <option value="Agendou reunião">Agendou reunião</option>
                      <option value="Retornar depois">Retornar depois</option>
                      <option value="Não tem interesse">Não tem interesse</option>
                      <option value="Sem sucesso (Não atendeu)">Sem sucesso (Não atendeu)</option>
                      <option value="Resolvido com sucesso">Resolvido com sucesso</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* DETALHES DO DESFECHO Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observações / Detalhes do desfecho</span>
                    <div className="flex-1 h-[1px] bg-slate-100"></div>
                  </div>
                  <textarea 
                    rows={3}
                    value={resolveDetails}
                    onChange={(e) => setResolveDetails(e.target.value)}
                    placeholder="Escreva como foi resolvido..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                    required
                  ></textarea>
                </div>

                {/* Footer */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
                  >
                    Salvar e Concluir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResolvingItemId(null);
                      setShowResolveModal(false);
                    }}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
