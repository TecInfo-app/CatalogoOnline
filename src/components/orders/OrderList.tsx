import { Order } from '../../types';
import { Package, Plus, Receipt, Settings, Lightbulb, MessageCircle, X, Edit2, Trash2, LayoutGrid, List } from 'lucide-react';
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
  const [displayMode, setDisplayMode] = useState<'mosaico' | 'lista'>('mosaico');

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

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">Meus Pedidos</h2>
        <button 
          onClick={onCreateNew}
          className="bg-[#851b42] hover:bg-[#5e132e] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={16} /> NOVO PEDIDO
        </button>
      </div>

      {/* DISPLAY MODE SELECTOR (MOSAICO VS LISTA) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-xl mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Exibição:</span>
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setDisplayMode('mosaico')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer",
                displayMode === 'mosaico'
                  ? "bg-[#851b42] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutGrid size={14} /> Mosaico
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('lista')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer",
                displayMode === 'lista'
                  ? "bg-[#851b42] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <List size={14} /> Lista
            </button>
          </div>
        </div>

        <span className="text-xs font-extrabold text-slate-500 pr-1">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white rounded border border-slate-200">
          Nenhum pedido encontrado.
        </div>
      ) : displayMode === 'mosaico' ? (
        /* MOSAICO (CARDS GRID) MODE */
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
        </div>
      ) : (
        /* LISTA (STRUCTURED TABLE) MODE */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden mb-20 md:mb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Pedido</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Pagamento</th>
                  <th className="py-3.5 px-4 text-center">Itens</th>
                  <th className="py-3.5 px-4 text-right">Valor Total</th>
                  {canEditOrders && <th className="py-3.5 px-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-800">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {order.clientName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-semibold whitespace-nowrap">
                      {order.date}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 uppercase",
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
                    </td>
                    <td className="py-3.5 px-4">
                      {order.paymentMethod === 'Boleto' && order.asaasUrl ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-100">
                            Boleto Asaas
                          </span>
                          <a
                            href={order.asaasUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-[10px] font-extrabold"
                          >
                            Ver Boleto
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-semibold">
                          {order.paymentMethod || 'Não informado'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                      {order.itemsCount}
                    </td>
                    <td className={cn(
                      "py-3.5 px-4 text-right font-black text-sm",
                      order.status === 'canceled' ? "text-slate-400 line-through" : (order.status === 'budget' ? "text-[#851b42]" : "text-slate-800")
                    )}>
                      R$ {order.total.toFixed(2).replace('.', ',')}
                    </td>
                    {canEditOrders && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-[#851b42]/10 hover:text-[#851b42] text-slate-500 transition-colors border border-slate-200 cursor-pointer"
                            title="Editar pedido"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors border border-slate-200 cursor-pointer"
                            title="Excluir pedido"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button onClick={onCreateNew} className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#851b42] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5e132e] transition-colors z-40">
        <Plus size={24} />
      </button>
    </div>
  );
}

