import { useState, useEffect } from 'react';
import { getOrders, addOrder, updateOrder, deleteOrder, getStoreProfile } from '../lib/store';
import { Order } from '../types';
import { OrderList } from '../components/orders/OrderList';
import { OrderForm } from '../components/orders/OrderForm';

type ViewState = 'list' | 'create';

export function OrdersView({ userEmail, onNavigate }: { userEmail: string, onNavigate: (tab: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewState, setViewState] = useState<ViewState>(() => {
    return sessionStorage.getItem('preselected_order_client') ? 'create' : 'list';
  });
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();

    const handleSync = () => {
      loadOrders();
    };

    window.addEventListener('vercos_data_synced', handleSync);
    return () => {
      window.removeEventListener('vercos_data_synced', handleSync);
    };
  }, [userEmail]);

  const loadOrders = () => {
    setOrders(getOrders(userEmail));
  };

  const handleCreateNew = () => {
    setOrderToEdit(null);
    setViewState('create');
  };

  const handleEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setViewState('create');
  };

  const handleDeleteOrder = (id: string) => {
    setOrderToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (orderToDelete) {
      const order = orders.find(o => o.id === orderToDelete);
      if (order && order.paymentMethod === 'Boleto' && order.asaasPaymentId && !order.asaasPaymentId.startsWith('sim_')) {
        try {
          const profile = getStoreProfile(userEmail);
          if (profile.asaasApiKey) {
            const workerUrl = 'https://vercos.iranildo-jobs.workers.dev';
            const pathPrefix = profile.asaasEnvironment === 'production' 
              ? '/asaas-production'
              : '/asaas-sandbox';
            const baseUrl = `${workerUrl}${pathPrefix}`;

            let targetId = order.asaasPaymentId;
            let isInstallment = targetId.startsWith('ins_');

            // If it's a single payment ID (pay_...) but might belong to an installment group, check it
            if (targetId.startsWith('pay_')) {
              const getRes = await fetch(`${baseUrl}/payments/${targetId}`, {
                method: 'GET',
                headers: {
                  'access_token': profile.asaasApiKey,
                  'Content-Type': 'application/json'
                }
              });
              if (getRes.ok) {
                const payDetails = await getRes.json();
                if (payDetails.installment) {
                  targetId = payDetails.installment;
                  isInstallment = true;
                }
              }
            }

            // Cancel either the installment group or the single payment
            const deleteUrl = isInstallment 
              ? `${baseUrl}/installments/${targetId}`
              : `${baseUrl}/payments/${targetId}`;

            await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                'access_token': profile.asaasApiKey,
                'Content-Type': 'application/json'
              }
            });
            console.log(`Cancelled Asaas billing (${targetId}) for deleted order ${order.orderNumber}`);
          }
        } catch (err) {
          console.error("Failed to cancel Asaas payment during order deletion:", err);
        }
      }

      deleteOrder(userEmail, orderToDelete);
      loadOrders();
      setOrderToDelete(null);
    }
  };

  const handleSaveOrder = (partialOrder: Partial<Order>) => {
    if (orderToEdit) {
      updateOrder(userEmail, { ...orderToEdit, ...partialOrder } as Order);
    } else {
      addOrder(userEmail, partialOrder as Order);
    }
    loadOrders();
    setViewState('list');
    setOrderToEdit(null);
  };

  const handleBackToList = () => {
    setViewState('list');
    setOrderToEdit(null);
  };

  return (
    <div className="h-full bg-slate-50/50 p-6 overflow-y-auto relative">
      {viewState === 'list' && (
        <OrderList 
          orders={orders} 
          onCreateNew={handleCreateNew} 
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      )}

      {viewState === 'create' && (
        <OrderForm 
          userEmail={userEmail}
          orderToEdit={orderToEdit}
          onSave={handleSaveOrder} 
          onCancel={handleBackToList} 
          onNavigate={onNavigate}
        />
      )}

      {orderToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-800 text-base">Confirmar Exclusão</h3>
            <p className="text-slate-600 text-xs">Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
