import { Order } from '../../types';
import { Package, Plus, Receipt, Settings, Lightbulb, MessageCircle, X, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface OrderListProps {
  orders: Order[];
  onCreateNew: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  canEditOrders?: boolean;
}

export function OrderList({ orders, onCreateNew, onEditOrder, onDeleteOrder, canEditOrders = true }: OrderListProps) {
  const [showDemo, setShowDemo] = useState(true);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex border-b border-slate-200 mb-6 font-bold text-sm">
        <button 
          className="px-4 py-3 flex items-center gap-2 border-b-2 border-[#333] text-[#333]"
        >
          <Receipt size={16} />
          PEDIDOS
        </button>
        <button 
          className="px-4 py-3 flex items-center gap-2 text-slate-500 hover:text-[#333]"
        >
          <Settings size={16} />
          CONFIGURAÇÕES
        </button>
      </div>

      {showDemo && (
        <div className="bg-[#851b42]/10 border border-[#851b42]/20 text-[#851b42] p-4 rounded-lg flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-[#851b42] mt-1 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-[#851b42]">Que tal uma demonstração gratuita?</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Fale com um de nossos especialistas e veja tudo que o Vitrine Pay pode fazer pelo seu negócio.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-[#851b42] text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-[#5e132e] transition-colors shrink-0 hidden sm:flex">
              <MessageCircle size={16} />
              Falar com especialista
            </button>
            <button onClick={() => setShowDemo(false)} className="text-slate-400 p-1 rounded-full hover:bg-slate-200 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">Meus Pedidos</h2>
        <button 
          onClick={onCreateNew}
          className="bg-[#851b42] hover:bg-[#5e132e] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={16} /> NOVO PEDIDO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 md:pb-0">
        {orders.map(order => (
          <div 
            key={order.id} 
            className="bg-white rounded border border-slate-200 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#851b42] transition-colors" />
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-800">{order.clientName}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pedido #{order.orderNumber} &bull; {order.date}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase",
                  order.status === 'budget' && "bg-yellow-100 text-yellow-800",
                  order.status === 'completed' && "bg-emerald-100 text-emerald-800",
                  order.status === 'canceled' && "bg-red-100 text-red-800"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    order.status === 'budget' && "bg-yellow-600",
                    order.status === 'completed' && "bg-emerald-600",
                    order.status === 'canceled' && "bg-red-600"
                  )} />
                  {order.status === 'budget' ? 'Em orçamento' : order.status === 'completed' ? 'Concluído' : 'Cancelado'}
                </span>
                {canEditOrders && (
                  <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditOrder(order); }}
                      className="border border-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit2 size={12} className="text-[#851b42]" /> Editar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                      className="border border-slate-200 text-red-500 px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>

            {order.paymentMethod === 'Boleto' && order.asaasUrl && (
              <div className="flex items-center gap-2 mt-2 bg-blue-50/70 border border-blue-100/60 p-2.5 rounded-lg">
                <Receipt size={14} className="text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0 font-sans">
                  <span className="text-[10px] font-bold text-blue-800 block uppercase tracking-wider">Boleto Parcelado Asaas</span>
                  <span className="text-[9px] text-slate-500 block font-medium">Vencimento: {order.dueDate ? new Date(order.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '---'} &bull; {order.installments || 1}x {order.billingFrequency ? `(${order.billingFrequency})` : ''}</span>
                </div>
                <a
                  href={order.asaasUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-[9px] font-extrabold transition-colors shrink-0 uppercase tracking-wide flex items-center gap-1"
                >
                  Ver Boleto
                </a>
              </div>
            )}
            
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Package size={16} />
                {order.itemsCount} itens
              </div>
              <div className={cn(
                "text-lg font-bold",
                order.status === 'canceled' ? "text-slate-400 line-through" : (order.status === 'budget' ? "text-[#851b42]" : "text-slate-800")
              )}>
                R$ {order.total.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Nenhum pedido encontrado.
          </div>
        )}
      </div>

      <button onClick={onCreateNew} className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#851b42] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5e132e] transition-colors z-40">
        <Plus size={24} />
      </button>
    </div>
  );
}
