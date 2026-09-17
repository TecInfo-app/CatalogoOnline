import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import { Client } from '../../types';
import { Search, Users, Plus, MapPin, Phone, Mail, Edit2, Trash2, Download, Upload, Info, Settings, Save, CheckCircle, X, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { getOrders, getIndicatorSettings, saveIndicatorSettings } from '../../lib/store';

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

interface ClientListProps {
  clients: Client[];
  userEmail?: string;
  onCreateNew: () => void;
  onClientClick: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onImport: (clients: Client[]) => void;
  canCreateClients?: boolean;
  canEditClients?: boolean;
  hideSettings?: boolean;
}

export function ClientList({ 
  clients, 
  userEmail, 
  onCreateNew, 
  onClientClick, 
  onEditClient, 
  onDeleteClient, 
  onImport,
  canCreateClients = true,
  canEditClients = true,
  hideSettings = false
}: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'CLIENTES' | 'CONFIGURAÇÕES'>('CLIENTES');
  const [syncVersion, setSyncVersion] = useState(0);
  const [isCarteiraModalOpen, setIsCarteiraModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'ativos' | 'inativos_recentes' | 'inativos_antigos' | 'prospects'>('ativos');
  const [modalSearch, setModalSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configurations states
  const [carteiraRecente, setCarteiraRecente] = useState(180);
  const [carteiraAntigo, setCarteiraAntigo] = useState(365);
  const [positivacaoRecente, setPositivacaoRecente] = useState(180);
  const [positivacaoAntigo, setPositivacaoAntigo] = useState(365);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  useEffect(() => {
    const handleSync = () => {
      setSyncVersion(v => v + 1);
    };
    window.addEventListener('vitrine_pay_data_synced', handleSync);
    return () => {
      window.removeEventListener('vitrine_pay_data_synced', handleSync);
    };
  }, []);

  useEffect(() => {
    const sets = getIndicatorSettings(userEmail || '');
    setCarteiraRecente(sets.carteiraRecenteDias);
    setCarteiraAntigo(sets.carteiraAntigoDias);
    setPositivacaoRecente(sets.positivacaoRecenteDias);
    setPositivacaoAntigo(sets.positivacaoAntigoDias);
  }, [userEmail, syncVersion]);

  const handleSaveSettings = () => {
    saveIndicatorSettings(userEmail || '', {
      carteiraRecenteDias: Number(carteiraRecente),
      carteiraAntigoDias: Number(carteiraAntigo),
      positivacaoRecenteDias: Number(positivacaoRecente),
      positivacaoAntigoDias: Number(positivacaoAntigo),
    });
    setSettingsSavedMessage('Configurações salvas com sucesso!');
    setTimeout(() => setSettingsSavedMessage(''), 3000);
  };

  // Advanced Search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advNomeCnpj, setAdvNomeCnpj] = useState('');
  const [advTelefone, setAdvTelefone] = useState('');
  const [advEmail, setAdvEmail] = useState('');
  const [advEndereco, setAdvEndereco] = useState('');
  const [advBairro, setAdvBairro] = useState('');
  const [advCidade, setAdvCidade] = useState('');
  const [advEstado, setAdvEstado] = useState('');
  const [advSegmento, setAdvSegmento] = useState('Qualquer');
  const [advRede, setAdvRede] = useState('Qualquer');
  const [advNomeContato, setAdvNomeContato] = useState('');
  const [advTag, setAdvTag] = useState('');

  const [appliedFilters, setAppliedFilters] = useState<{
    nomeCnpj: string;
    telefone: string;
    email: string;
    endereco: string;
    bairro: string;
    cidade: string;
    estado: string;
    segmento: string;
    rede: string;
    nomeContato: string;
    tag: string;
  } | null>(null);

  const BRAZILIAN_STATES = [
    { value: '', label: '----------' },
    { value: 'AC', label: 'AC - Acre' },
    { value: 'AL', label: 'AL - Alagoas' },
    { value: 'AP', label: 'AP - Amapá' },
    { value: 'AM', label: 'AM - Amazonas' },
    { value: 'BA', label: 'BA - Bahia' },
    { value: 'CE', label: 'CE - Ceará' },
    { value: 'DF', label: 'DF - Distrito Federal' },
    { value: 'ES', label: 'ES - Espírito Santo' },
    { value: 'GO', label: 'GO - Goiás' },
    { value: 'MA', label: 'MA - Maranhão' },
    { value: 'MT', label: 'MT - Mato Grosso' },
    { value: 'MS', label: 'MS - Mato Grosso do Sul' },
    { value: 'MG', label: 'MG - Minas Gerais' },
    { value: 'PA', label: 'PA - Pará' },
    { value: 'PB', label: 'PB - Paraíba' },
    { value: 'PR', label: 'PR - Paraná' },
    { value: 'PE', label: 'PE - Pernambuco' },
    { value: 'PI', label: 'PI - Piauí' },
    { value: 'RJ', label: 'RJ - Rio de Janeiro' },
    { value: 'RN', label: 'RN - Rio Grande do Norte' },
    { value: 'RS', label: 'RS - Rio Grande do Sul' },
    { value: 'RO', label: 'RO - Rondônia' },
    { value: 'RR', label: 'RR - Roraima' },
    { value: 'SC', label: 'SC - Santa Catarina' },
    { value: 'SP', label: 'SP - São Paulo' },
    { value: 'SE', label: 'SE - Sergipe' },
    { value: 'TO', label: 'TO - Tocantins' }
  ];

  const handleApplyAdvancedSearch = () => {
    setAppliedFilters({
      nomeCnpj: advNomeCnpj,
      telefone: advTelefone,
      email: advEmail,
      endereco: advEndereco,
      bairro: advBairro,
      cidade: advCidade,
      estado: advEstado,
      segmento: advSegmento,
      rede: advRede,
      nomeContato: advNomeContato,
      tag: advTag,
    });
  };

  const handleHideAdvancedSearch = () => {
    setShowAdvancedSearch(false);
    setAppliedFilters(null);
  };

  const filteredClients = useMemo(() => {
    if (showAdvancedSearch && appliedFilters) {
      return clients.filter(c => {
        // Nome ou CNPJ
        if (appliedFilters.nomeCnpj) {
          const lower = appliedFilters.nomeCnpj.toLowerCase();
          const matchName = c.name?.toLowerCase().includes(lower);
          const matchLegal = c.legalName?.toLowerCase().includes(lower);
          const matchCnpj = c.cnpj?.includes(appliedFilters.nomeCnpj);
          if (!matchName && !matchLegal && !matchCnpj) return false;
        }

        // Telefone
        if (appliedFilters.telefone) {
          const lower = appliedFilters.telefone.toLowerCase();
          const matchPhoneList = c.phones?.some(p => p.toLowerCase().includes(lower));
          const matchContactPhone = c.contacts?.some(cont => cont.phones?.some(p => p.toLowerCase().includes(lower)));
          if (!matchPhoneList && !matchContactPhone) return false;
        }

        // Email
        if (appliedFilters.email) {
          const lower = appliedFilters.email.toLowerCase();
          const matchEmailList = c.emails?.some(e => e.toLowerCase().includes(lower));
          const matchContactEmail = c.contacts?.some(cont => cont.emails?.some(e => e.toLowerCase().includes(lower)));
          if (!matchEmailList && !matchContactEmail) return false;
        }

        // Endereço
        if (appliedFilters.endereco) {
          const lower = appliedFilters.endereco.toLowerCase();
          const matchAddr = c.address?.endereco?.toLowerCase().includes(lower) || c.location?.toLowerCase().includes(lower);
          if (!matchAddr) return false;
        }

        // Bairro
        if (appliedFilters.bairro) {
          const lower = appliedFilters.bairro.toLowerCase();
          const matchBairro = c.address?.bairro?.toLowerCase().includes(lower);
          if (!matchBairro) return false;
        }

        // Cidade
        if (appliedFilters.cidade) {
          const lower = appliedFilters.cidade.toLowerCase();
          const matchCidade = c.address?.cidade?.toLowerCase().includes(lower) || c.location?.toLowerCase().includes(lower);
          if (!matchCidade) return false;
        }

        // Estado
        if (appliedFilters.estado) {
          const lower = appliedFilters.estado.toLowerCase();
          const locationState = c.location?.split('-').pop()?.trim().toLowerCase();
          const matchEstado = c.address?.estado?.toLowerCase() === lower || locationState === lower;
          if (!matchEstado) return false;
        }

        // Nome contato
        if (appliedFilters.nomeContato) {
          const lower = appliedFilters.nomeContato.toLowerCase();
          const matchContact = c.contacts?.some(cont => cont.name?.toLowerCase().includes(lower));
          if (!matchContact) return false;
        }

        return true;
      });
    }

    if (!searchTerm) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.legalName.toLowerCase().includes(lower) || 
      c.cnpj.includes(searchTerm)
    );
  }, [clients, searchTerm, showAdvancedSearch, appliedFilters]);

  const carteiraData = useMemo(() => {
    const orders = getOrders(userEmail || '');
    const currentYear = new Date().getFullYear();
    const nowTime = new Date().getTime();
    
    const sets = getIndicatorSettings(userEmail || '');
    const carteiraRecenteMs = sets.carteiraRecenteDias * 24 * 60 * 60 * 1000;
    const carteiraAntigoMs = sets.carteiraAntigoDias * 24 * 60 * 60 * 1000;

    // Group orders by client
    const clientOrdersMap = new Map<string, typeof orders>();
    orders.forEach(order => {
      if (order.clientId) {
        const existing = clientOrdersMap.get(order.clientId) || [];
        existing.push(order);
        clientOrdersMap.set(order.clientId, existing);
      } else if (order.clientName) {
        const matchedClient = clients.find(c => 
          c.name.toLowerCase() === order.clientName?.toLowerCase() || 
          c.legalName.toLowerCase() === order.clientName?.toLowerCase()
        );
        if (matchedClient) {
          const existing = clientOrdersMap.get(matchedClient.id) || [];
          existing.push(order);
          clientOrdersMap.set(matchedClient.id, existing);
        }
      }
    });

    const ativos: { id: string; name: string; phone: string; lastOrder: string; totalOrders: number; client: Client }[] = [];
    const inativosRecentes: { id: string; name: string; phone: string; lastOrder: string; totalOrders: number; client: Client }[] = [];
    const inativosAntigos: { id: string; name: string; phone: string; lastOrder: string; totalOrders: number; client: Client }[] = [];
    const prospects: { id: string; name: string; phone: string; date: string; client: Client }[] = [];

    clients.forEach(client => {
      const clientOrders = clientOrdersMap.get(client.id) || [];
      const completedOrders = clientOrders.filter(o => o.status === 'completed');
      const phone = client.phones?.[0] || 'Sem telefone';
      const clientName = client.name || client.legalName;

      // 1. CARTEIRA CLASSIFICATION (Identical to IndicatorsView)
      if (completedOrders.length === 0) {
        prospects.push({
          id: client.id,
          name: clientName,
          phone,
          date: 'Sem pedidos',
          client
        });
      } else {
        let latestOrder: typeof orders[0] | null = null;
        let latestOrderDate: Date | null = null;
        
        completedOrders.forEach(o => {
          const d = parseOrderDate(o.date, currentYear);
          if (d) {
            if (!latestOrderDate || d > latestOrderDate) {
              latestOrderDate = d;
              latestOrder = o;
            }
          }
        });

        if (latestOrderDate) {
          const age = nowTime - (latestOrderDate as Date).getTime();
          const info = {
            id: client.id,
            name: clientName,
            phone,
            lastOrder: latestOrder ? (latestOrder as any).date : 'N/A',
            totalOrders: completedOrders.length,
            client
          };

          if (age <= carteiraRecenteMs) {
            ativos.push(info);
          } else if (age <= carteiraAntigoMs) {
            inativosRecentes.push(info);
          } else {
            inativosAntigos.push(info);
          }
        } else {
          prospects.push({
            id: client.id,
            name: clientName,
            phone,
            date: 'Sem pedidos',
            client
          });
        }
      }
    });

    return {
      total: clients.length,
      ativos,
      inativosRecentes,
      inativosAntigos,
      prospects,
      settings: sets
    };
  }, [clients, userEmail, carteiraRecente, carteiraAntigo, syncVersion]);

  const stats = useMemo(() => ({
    total: carteiraData.total,
    ativos: carteiraData.ativos.length,
    inativosRecentes: carteiraData.inativosRecentes.length,
    inativosAntigos: carteiraData.inativosAntigos.length,
    prospects: carteiraData.prospects.length
  }), [carteiraData]);

  const chartData = useMemo(() => [
    { name: 'ativos', value: stats.ativos, color: '#10b981' }, // green
    { name: 'inativos antigos', value: stats.inativosAntigos, color: '#ef4444' }, // red
    { name: 'inativos recentes', value: stats.inativosRecentes, color: '#eab308' }, // yellow
    { name: 'prospects', value: stats.prospects, color: '#d1d5db' }, // gray
  ], [stats]);

  const currentMonthYear = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();
  }, []);

  const exportClients = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clients, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "clientes.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const importedClients = JSON.parse(content);
      onImport(importedClients);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex border-b border-slate-200 mb-6 font-bold text-sm">
        <button 
          className={cn("px-4 py-3 flex items-center gap-2", activeTab === 'CLIENTES' ? "border-b-2 border-[#333] text-[#333]" : "text-slate-500 hover:text-[#333]")}
          onClick={() => setActiveTab('CLIENTES')}
        >
          <Users size={16} className="text-current" />
          CLIENTES
        </button>
        {!hideSettings && (
          <button 
            className={cn("px-4 py-3 flex items-center gap-2", activeTab === 'CONFIGURAÇÕES' ? "border-b-2 border-[#333] text-[#333]" : "text-slate-500 hover:text-[#333]")}
            onClick={() => setActiveTab('CONFIGURAÇÕES')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            CONFIGURAÇÕES
          </button>
        )}
      </div>

      {activeTab === 'CLIENTES' ? (
        <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white border border-slate-200 rounded p-4 shadow-sm">
          
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex gap-2">
              {canCreateClients && (
                <>
                  <button 
                    onClick={onCreateNew}
                    className="bg-[#851b42] hover:bg-[#5e132e] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> Cadastrar cliente
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-[#851b42] px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload size={16} /> Importar
                  </button>
                </>
              )}
              <button 
                onClick={exportClients}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-[#851b42] px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={16} /> Exportar
              </button>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Pesquise por nome ou CNPJ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 border border-slate-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#851b42]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <button 
                onClick={() => setShowAdvancedSearch(true)}
                className="text-[#851b42] text-xs mt-1 absolute -bottom-5 right-0 hover:underline"
              >
                Pesquise por cidade, estado, etc.
              </button>
            </div>
          </div>

          {showAdvancedSearch && (
            <div className="bg-slate-50 border border-slate-200 rounded p-5 mb-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome ou CNPJ */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome ou CNPJ:</label>
                  <input 
                    type="text" 
                    value={advNomeCnpj}
                    onChange={(e) => setAdvNomeCnpj(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>

                {/* Telefone & Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone:</label>
                  <input 
                    type="text" 
                    value={advTelefone}
                    onChange={(e) => setAdvTelefone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
                  <input 
                    type="text" 
                    value={advEmail}
                    onChange={(e) => setAdvEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>

                {/* Endereço & Bairro */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Endereço:</label>
                  <input 
                    type="text" 
                    value={advEndereco}
                    onChange={(e) => setAdvEndereco(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bairro:</label>
                  <input 
                    type="text" 
                    value={advBairro}
                    onChange={(e) => setAdvBairro(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>

                {/* Cidade & Estado */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cidade:</label>
                  <input 
                    type="text" 
                    value={advCidade}
                    onChange={(e) => setAdvCidade(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado:</label>
                  <select 
                    value={advEstado}
                    onChange={(e) => setAdvEstado(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42] cursor-pointer"
                  >
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                {/* Segmento & Rede */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Segmento:</label>
                  <select 
                    value={advSegmento}
                    onChange={(e) => setAdvSegmento(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42] cursor-pointer"
                  >
                    <option value="Qualquer">Qualquer</option>
                    <option value="Atacado">Atacado</option>
                    <option value="Varejo">Varejo</option>
                    <option value="Distribuidor">Distribuidor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rede:</label>
                  <select 
                    value={advRede}
                    onChange={(e) => setAdvRede(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42] cursor-pointer"
                  >
                    <option value="Qualquer">Qualquer</option>
                    <option value="Rede Principal">Rede Principal</option>
                    <option value="Rede Secundária">Rede Secundária</option>
                  </select>
                </div>

                {/* Nome do contato & Tag */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do contato:</label>
                  <input 
                    type="text" 
                    value={advNomeContato}
                    onChange={(e) => setAdvNomeContato(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tag:</label>
                  <input 
                    type="text" 
                    value={advTag}
                    onChange={(e) => setAdvTag(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#851b42]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-2">
                <button 
                  onClick={handleApplyAdvancedSearch}
                  className="bg-[#851b42] hover:bg-[#5e132e] text-white px-5 py-2.5 rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Search size={14} /> Pesquisar
                </button>

                <button 
                  onClick={handleHideAdvancedSearch}
                  className="text-[#851b42] hover:text-[#5e132e] font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                  Ocultar pesquisa avançada
                </button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <button className="text-[#851b42] font-bold text-sm flex items-center gap-1 hover:underline">
              Exibir todos os clientes <ChevronDown size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {filteredClients.map(client => (
              <div key={client.id} className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex-1">
                  <div 
                    className="text-[#851b42] font-bold text-base cursor-pointer hover:underline mb-2 flex items-center"
                    onClick={() => onClientClick(client)}
                  >
                    {client.name} <span className="text-slate-500 font-normal ml-1"> - {client.legalName} - {client.cnpj}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4 text-sm text-slate-600">
                    {client.phones && client.phones[0] && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" /> {client.phones[0]}
                      </div>
                    )}
                    {client.emails && client.emails[0] && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" /> {client.emails[0]}
                      </div>
                    )}
                    <div className="flex items-center gap-2 md:col-span-2 mt-2">
                      <MapPin size={14} className="text-slate-400" /> {client.location}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {canEditClients && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditClient(client); }}
                        className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded flex items-center gap-1 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit2 size={12} className="text-[#851b42]" /> Alterar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }}
                        className="border border-slate-200 text-red-500 px-3 py-1.5 rounded flex items-center gap-1 text-xs font-bold hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-right">
            <span className="text-[#851b42] text-sm font-bold">
              Contar registros: {filteredClients.length}
            </span>
          </div>

        </div>

        {/* Right Sidebar - Chart */}
        <div className="w-full lg:w-80">
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="text-slate-500 font-bold text-xs uppercase flex items-center gap-1">
                CARTEIRA DE CLIENTES <Info size={14} className="text-slate-400" />
              </h3>
              <span className="text-slate-500 text-xs font-bold uppercase">{currentMonthYear}</span>
            </div>
            
            <div className="p-6">
              <div className="relative h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl text-slate-700 font-light">{stats.total}</span>
                  <span className="text-xs text-[#8089b2]">Clientes</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 mt-6">
                <button 
                  onClick={() => { setModalTab('ativos'); setIsCarteiraModalOpen(true); }}
                  className="flex items-center gap-2 text-xs text-left hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700">{stats.ativos} ativos</span>
                </button>
                <button 
                  onClick={() => { setModalTab('inativos_recentes'); setIsCarteiraModalOpen(true); }}
                  className="flex items-center gap-2 text-xs text-left hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                  <span className="font-bold text-slate-500">{stats.inativosRecentes} inativos recentes</span>
                </button>
                <button 
                  onClick={() => { setModalTab('inativos_antigos'); setIsCarteiraModalOpen(true); }}
                  className="flex items-center gap-2 text-xs text-left hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="font-bold text-slate-700">{stats.inativosAntigos} inativos antigos</span>
                </button>
                <button 
                  onClick={() => { setModalTab('prospects'); setIsCarteiraModalOpen(true); }}
                  className="flex items-center gap-2 text-xs text-left hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                  <span className="font-bold text-slate-400">{stats.prospects} prospects</span>
                </button>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setIsCarteiraModalOpen(true)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-[#851b42] py-2 rounded text-sm font-bold flex justify-center items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="bg-[#851b42] text-white p-1 rounded-sm">
                    <BarChart2 size={12} />
                  </span>
                  Detalhar carteira
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
            <Settings className="text-[#851b42]" size={20} />
            <h2 className="text-base font-bold text-slate-800">Configuração de Indicadores</h2>
          </div>

          <p className="text-xs text-slate-500 mb-6">
            Configure as regras de inatividade para classificar os clientes nos indicadores de <span className="font-semibold text-slate-700">Carteira de Clientes</span> e <span className="font-semibold text-slate-700">Positivação</span>.
          </p>

          <div className="space-y-6">
            {/* CARTEIRA DE CLIENTES SETTINGS */}
            <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#851b42] mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-3 rounded bg-[#851b42] inline-block" />
                Carteira de Clientes
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    INATIVOS RECENTES
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-600 font-medium">Clientes que não compram há:</span>
                    <input 
                      type="number" 
                      value={carteiraRecente}
                      onChange={(e) => setCarteiraRecente(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]"
                    />
                    <span className="text-xs text-slate-600 font-medium">dias ou mais</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    INATIVOS ANTIGOS
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-600 font-medium">Clientes que não compram há:</span>
                    <input 
                      type="number" 
                      value={carteiraAntigo}
                      onChange={(e) => setCarteiraAntigo(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]"
                    />
                    <span className="text-xs text-slate-600 font-medium">dias ou mais</span>
                  </div>
                </div>
              </div>
            </div>

            {/* POSITIVACAO SETTINGS */}
            <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#851b42] mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-3 rounded bg-[#851b42] inline-block" />
                Positivação
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    INATIVOS RECENTES
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-600 font-medium">Clientes que não compram há:</span>
                    <input 
                      type="number" 
                      value={positivacaoRecente}
                      onChange={(e) => setPositivacaoRecente(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]"
                    />
                    <span className="text-xs text-slate-600 font-medium">dias ou mais</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    INATIVOS ANTIGOS
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-600 font-medium">Clientes que não compram há:</span>
                    <input 
                      type="number" 
                      value={positivacaoAntigo}
                      onChange={(e) => setPositivacaoAntigo(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]"
                    />
                    <span className="text-xs text-slate-600 font-medium">dias ou mais</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              {settingsSavedMessage && (
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold animate-in fade-in duration-300">
                  <CheckCircle size={14} />
                  {settingsSavedMessage}
                </div>
              )}
            </div>
            <button 
              onClick={handleSaveSettings}
              className="bg-[#851b42] hover:bg-[#5e132e] text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Save size={14} /> Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* Detalhamento da Carteira Modal */}
      {isCarteiraModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="text-[#851b42] animate-pulse" size={22} />
                  Detalhamento da Carteira de Clientes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dados sincronizados em tempo real com a tela de Indicadores
                </p>
              </div>
              <button 
                onClick={() => setIsCarteiraModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Context Explanation */}
              <div className="p-4 bg-[#851b42]/5 border border-[#851b42]/15 rounded-xl">
                <p className="text-xs text-slate-700 leading-relaxed">
                  O indicador de situação da carteira classifica os clientes em:
                  <br /><span className="font-bold text-slate-900">● Prospects</span>: clientes cadastrados que ainda não efetuaram nenhum pedido;
                  <br /><span className="font-bold text-slate-900">● Clientes ativos</span>: clientes que compraram nos últimos {carteiraData.settings.carteiraRecenteDias} dias;
                  <br /><span className="font-bold text-slate-900">● Inativos Recentes</span>: clientes sem comprar entre {carteiraData.settings.carteiraRecenteDias} e {carteiraData.settings.carteiraAntigoDias} dias;
                  <br /><span className="font-bold text-slate-900">● Inativos Antigos</span>: clientes sem comprar há {carteiraData.settings.carteiraAntigoDias} dias ou mais.
                </p>
              </div>

              {/* Category selector grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <button
                  onClick={() => setModalTab('ativos')}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-center cursor-pointer",
                    modalTab === 'ativos'
                      ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className="text-xl font-black text-emerald-700">{carteiraData.ativos.length}</div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">Ativos</div>
                </button>

                <button
                  onClick={() => setModalTab('inativos_recentes')}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-center cursor-pointer",
                    modalTab === 'inativos_recentes'
                      ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className="text-xl font-black text-amber-700">{carteiraData.inativosRecentes.length}</div>
                  <div className="text-[10px] font-bold text-amber-800 uppercase mt-0.5">Inat. Recentes</div>
                </button>

                <button
                  onClick={() => setModalTab('inativos_antigos')}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-center cursor-pointer",
                    modalTab === 'inativos_antigos'
                      ? "bg-red-50 border-red-300 ring-2 ring-red-500/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className="text-xl font-black text-red-700">{carteiraData.inativosAntigos.length}</div>
                  <div className="text-[10px] font-bold text-red-800 uppercase mt-0.5">Inat. Antigos</div>
                </button>

                <button
                  onClick={() => setModalTab('prospects')}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-center cursor-pointer",
                    modalTab === 'prospects'
                      ? "bg-slate-100 border-slate-300 ring-2 ring-slate-400/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className="text-xl font-black text-slate-700">{carteiraData.prospects.length}</div>
                  <div className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">Prospects</div>
                </button>
              </div>

              {/* Category List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">
                    {modalTab === 'ativos' && `Clientes Ativos (${carteiraData.ativos.length})`}
                    {modalTab === 'inativos_recentes' && `Inativos Recentes (${carteiraData.inativosRecentes.length})`}
                    {modalTab === 'inativos_antigos' && `Inativos Antigos (${carteiraData.inativosAntigos.length})`}
                    {modalTab === 'prospects' && `Prospects Sem Pedidos (${carteiraData.prospects.length})`}
                  </h4>

                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Pesquisar nesta lista..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#851b42] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {(() => {
                    const list = modalTab === 'ativos' 
                      ? carteiraData.ativos 
                      : modalTab === 'inativos_recentes'
                      ? carteiraData.inativosRecentes
                      : modalTab === 'inativos_antigos'
                      ? carteiraData.inativosAntigos
                      : carteiraData.prospects;

                    const filteredList = list.filter(item => {
                      if (!modalSearch) return true;
                      const s = modalSearch.toLowerCase();
                      return item.name.toLowerCase().includes(s) || item.phone.includes(s);
                    });

                    if (filteredList.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-slate-400">
                          Nenhum cliente encontrado nesta categoria.
                        </div>
                      );
                    }

                    return filteredList.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          setIsCarteiraModalOpen(false);
                          onClientClick(c.client);
                        }}
                        className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div>
                          <p className="font-semibold text-xs text-slate-800 group-hover:text-[#851b42] transition-colors">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {c.phone}
                          </p>
                        </div>

                        <div className="text-right">
                          {'lastOrder' in c ? (
                            <>
                              <p className="text-[10px] text-slate-500">
                                Última compra: <span className="font-semibold text-slate-700">{c.lastOrder}</span>
                              </p>
                              <p className="text-[9px] font-bold text-[#851b42] mt-0.5">
                                {c.totalOrders} {c.totalOrders === 1 ? 'pedido concluído' : 'pedidos concluídos'}
                              </p>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              Sem pedidos
                            </span>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsCarteiraModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal icon for chevron down
function ChevronDown({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
