import React, { useState, useMemo, useRef, ChangeEvent } from 'react';
import { Client } from '../../types';
import { Search, Plus, MapPin, Phone, Mail, Edit2, Trash2, Download, Upload, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

interface ClientListProps {
  clients: Client[];
  onCreateNew: () => void;
  onClientClick: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onImport: (clients: Client[]) => void;
}

export function ClientList({ clients, onCreateNew, onClientClick, onEditClient, onDeleteClient, onImport }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'CLIENTES' | 'CONFIGURAÇÕES'>('CLIENTES');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.legalName.toLowerCase().includes(lower) || 
      c.cnpj.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: clients.length,
      ativos: clients.filter(c => c.status === 'active').length,
      prospects: clients.filter(c => c.status === 'prospect').length,
      inativos: clients.filter(c => c.status === 'inactive').length,
    };
  }, [clients]);

  const chartData = [
    { name: 'ativos', value: stats.ativos, color: '#10b981' }, // green
    { name: 'inativos antigos', value: stats.inativos, color: '#ef4444' }, // red
    { name: 'inativos recentes', value: 0, color: '#eab308' }, // yellow
    { name: 'prospects', value: stats.prospects, color: '#d1d5db' }, // gray
  ];

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
          <span className="bg-[#333] text-white p-0.5 rounded-sm"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg></span>
          CLIENTES
        </button>
        <button 
          className={cn("px-4 py-3 flex items-center gap-2", activeTab === 'CONFIGURAÇÕES' ? "border-b-2 border-[#333] text-[#333]" : "text-slate-500 hover:text-[#333]")}
          onClick={() => setActiveTab('CONFIGURAÇÕES')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          CONFIGURAÇÕES
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white border border-slate-200 rounded p-4 shadow-sm">
          
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex gap-2">
              <button 
                onClick={onCreateNew}
                className="bg-[#4c3780] hover:bg-[#3d2c66] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={16} /> Cadastrar cliente
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-[#4c3780] px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Upload size={16} /> Importar
              </button>
              <button 
                onClick={exportClients}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-[#4c3780] px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
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
                className="w-full sm:w-64 border border-slate-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#4c3780]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <button className="text-[#4c3780] text-xs mt-1 absolute -bottom-5 right-0 hover:underline">
                Pesquise por cidade, estado, etc.
              </button>
            </div>
          </div>

          <div className="mb-4">
            <button className="text-[#4c3780] font-bold text-sm flex items-center gap-1 hover:underline">
              Exibir todos os clientes <ChevronDown size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {filteredClients.map(client => (
              <div key={client.id} className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex-1">
                  <div 
                    className="text-[#4c3780] font-bold text-base cursor-pointer hover:underline mb-2 flex items-center"
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
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditClient(client); }}
                    className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded flex items-center gap-1 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit2 size={12} className="text-[#4c3780]" /> Alterar
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }}
                    className="border border-slate-200 text-red-500 px-3 py-1.5 rounded flex items-center gap-1 text-xs font-bold hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-right">
            <span className="text-[#4c3780] text-sm hover:underline cursor-pointer">Contar registros</span>
          </div>

        </div>

        {/* Right Sidebar - Chart */}
        <div className="w-full lg:w-80">
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="text-slate-500 font-bold text-xs uppercase flex items-center gap-1">
                CARTEIRA DE CLIENTES <Info size={14} className="text-slate-400" />
              </h3>
              <span className="text-slate-500 text-xs font-bold uppercase">JULHO DE 2026</span>
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
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-700">{stats.ativos} ativos</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="font-bold text-slate-500">{chartData[2].value} inativos recentes</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="font-bold text-slate-700">{stats.inativos} inativos antigos</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="font-bold text-slate-400">{stats.prospects} prospects</span>
                </div>
              </div>

              <div className="mt-8">
                <button className="w-full bg-slate-50 hover:bg-slate-100 text-[#4c3780] py-2 rounded text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                  <span className="bg-[#4c3780] text-white p-1 rounded-sm"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></span>
                  Detalhar carteira
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
