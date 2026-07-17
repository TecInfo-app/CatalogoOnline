import { useState } from 'react';
import { Client } from '../../types';
import { Edit2, Link as LinkIcon, Phone, Mail, ChevronDown, Plus, FileText, ToggleLeft, ToggleRight, MessageSquare, Briefcase, ShoppingCart, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onUpdate: (client: Client) => void;
  onEdit?: (client: Client) => void;
}

export function ClientDetail({ client, onBack, onUpdate, onEdit }: ClientDetailProps) {
  
  const handleTogglePortal = () => {
    onUpdate({
      ...client,
      isPortalEnabled: !client.isPortalEnabled
    });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6 bg-white border-b border-slate-200 pb-4">
        <button onClick={onBack} className="text-[#4c3780] text-sm hover:underline self-start mb-2">
          &larr; Voltar
        </button>
        <h1 className="text-2xl text-slate-800 font-normal">{client.name}</h1>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit?.(client)}
            className="bg-[#4c3780] hover:bg-[#3d2c66] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 size={12} /> Alterar
          </button>
          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-[#4c3780] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors">
            <LinkIcon size={12} /> Vínculos e Permissões
          </button>
          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-[#4c3780] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors">
            Mais opções <ChevronDown size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-600 mt-2">
          {client.phones && client.phones[0] && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-400" /> {client.phones[0]} <span className="text-emerald-500 font-bold ml-1">whatsapp</span>
            </div>
          )}
          {client.emails && client.emails[0] && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#4c3780]" /> <span className="text-[#4c3780] hover:underline cursor-pointer">{client.emails[0]}</span>
            </div>
          )}
        </div>

        <div className="mt-2 text-center text-[#4c3780] text-xs font-bold flex items-center justify-center gap-1 hover:underline cursor-pointer">
          <ChevronDown size={14} /> Ver cadastro completo
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-12">
        {/* Left Column */}
        <div className="flex-2 flex flex-col gap-6">
          
          <Section title="TAREFAS" action={{ label: 'Criar tarefa', onClick: () => {} }}>
            <div className="text-center text-slate-400 text-xs py-10">
              Crie uma tarefa na agenda para lembrar de contatar este cliente.
            </div>
          </Section>

          <Section title="OPORTUNIDADES ABERTAS" action={{ label: 'Criar oportunidade', onClick: () => {}, outline: true }}>
            <div className="text-center text-slate-400 text-xs py-10">
              Acompanhe as oportunidades criadas para seu cliente.
            </div>
          </Section>

          <Section 
            title="PEDIDOS E ATIVIDADES" 
            actions={[
              { label: 'Criar pedido', onClick: () => {}, primary: true },
              { label: 'Registrar atividade', onClick: () => {}, outline: true }
            ]}
          >
            <div className="text-center text-slate-400 text-xs py-10">
              Veja os pedidos criados e registre as atividades realizadas neste cliente.
            </div>
          </Section>

          <Section title="NOTAS FISCAIS">
            <div className="text-center text-slate-400 text-xs py-10">
              Não há notas fiscais disponíveis no Mercos para este cliente.
            </div>
          </Section>

          <div className="bg-white font-bold text-xs text-slate-600 uppercase tracking-wide py-4 border-b border-slate-200 flex items-center gap-2">
            <ShoppingCart size={14} /> PRODUTOS MAIS COMPRADOS
          </div>

        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Resumo */}
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-3 font-bold text-xs text-slate-600 uppercase tracking-wide">
              RESUMO
            </div>
            <div className="p-4">
              <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-3">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-bold mb-3">
                  <Calendar size={14} /> Últimos 6 meses
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText size={16} className="text-blue-400" /> <span className="font-bold text-lg">0</span> <span className="text-xs">Pedidos realizados</span>
                </div>
              </div>
              <div className="text-slate-400 text-xs flex items-center gap-1">
                <Info size={12} /> Apenas pedidos do tipo venda
              </div>
            </div>
          </div>

          {/* Portal do Cliente */}
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-3 font-bold text-xs text-slate-600 uppercase tracking-wide">
              PORTAL DO CLIENTE
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm font-bold text-emerald-500">
                Portal liberado <Info size={14} className="text-slate-400" />
              </div>
              <button onClick={handleTogglePortal} className={cn("transition-colors", client.isPortalEnabled ? "text-[#4c3780]" : "text-slate-300")}>
                {client.isPortalEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>

          {/* Limite de Crédito */}
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-3 font-bold text-xs text-slate-600 uppercase tracking-wide">
              LIMITE DE CRÉDITO
            </div>
            <div className="p-4">
              <div className="font-bold text-sm text-slate-700 mb-4">perfumaria</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Limite disponível</div>
                  <div className="text-sm text-slate-700 font-bold flex items-center gap-1">
                    <span className="text-slate-400">$</span> Não definido
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Limite total</div>
                  <div className="text-sm text-slate-700 font-bold flex items-center gap-1">
                    <span className="text-slate-400">$</span> Não definido
                  </div>
                </div>
                <button className="text-slate-400 hover:text-[#4c3780] border border-slate-200 p-1.5 rounded">
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Títulos */}
          <div className="bg-white border border-slate-200 rounded shadow-sm relative">
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
              <span className="font-bold text-xs text-slate-600 uppercase tracking-wide">TÍTULOS</span>
              <button className="border border-slate-200 text-[#4c3780] bg-white px-2 py-1 rounded flex items-center gap-1 text-xs hover:bg-slate-50">
                <Plus size={12} /> Adicionar título
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-8">
                <button className="bg-[#4c3780] text-white px-3 py-1 rounded-full text-xs">
                  A receber
                </button>
                <button className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs hover:bg-slate-50">
                  Recebidos
                </button>
              </div>
              <div className="text-center text-slate-400 text-xs py-8">
                Este cliente não possui títulos a receber cadastrados no sistema.
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white border border-slate-200 p-3 rounded-full shadow-lg text-[#4c3780] cursor-pointer hover:bg-slate-50">
              <FileText size={20} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children, action, actions }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
        <span className="font-bold text-xs text-slate-600 uppercase tracking-wide">{title}</span>
        <div className="flex gap-2">
          {action && (
            <button className={cn(
              "px-3 py-1.5 rounded text-xs font-bold transition-colors",
              action.outline 
                ? "bg-white border border-slate-300 text-[#4c3780] hover:bg-slate-50" 
                : "bg-[#4c3780] text-white hover:bg-[#3d2c66]"
            )} onClick={action.onClick}>
              {action.label}
            </button>
          )}
          {actions && actions.map((a: any, i: number) => (
            <button key={i} className={cn(
              "px-3 py-1.5 rounded text-xs font-bold transition-colors",
              !a.primary 
                ? "bg-white border border-slate-300 text-[#4c3780] hover:bg-slate-50" 
                : "bg-[#4c3780] text-white hover:bg-[#3d2c66]"
            )} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function Info({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
