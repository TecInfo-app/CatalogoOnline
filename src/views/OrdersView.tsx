import { useState, useEffect } from 'react';
import { getOrders, addOrder, updateOrder, deleteOrder, getStoreProfile, getClients } from '../lib/store';
import { Order, Seller } from '../types';
import { OrderList } from '../components/orders/OrderList';
import { OrderForm } from '../components/orders/OrderForm';

type ViewState = 'list' | 'create';

export function OrdersView({ userEmail, onNavigate, activeSeller }: { userEmail: string, onNavigate: (tab: string) => void, activeSeller?: Seller | null }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewState, setViewState] = useState<ViewState>(() => {
    return sessionStorage.getItem('preselected_order_client') ? 'create' : 'list';
  });
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canEditOrders = !activeSeller || activeSeller.role === 'Administrador' || activeSeller.permissions.permitirAlterarPedidoGerado;

  useEffect(() => {
    loadOrders();

    const handleSync = () => {
      loadOrders();
    };

    window.addEventListener('vitrine_pay_data_synced', handleSync);
    return () => {
      window.removeEventListener('vitrine_pay_data_synced', handleSync);
    };
  }, [userEmail, activeSeller]);

  const loadOrders = () => {
    let allOrders = getOrders(userEmail);
    if (activeSeller && activeSeller.role === 'Comum' && !activeSeller.permissions.visualizarPedidosOutrosVendedores) {
      allOrders = allOrders.filter(o => o.sellerId === activeSeller.id);
    }
    setOrders(allOrders);
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
    setDeleteError(null);
    setOrderToDelete(id);
  };

  const cancelAsaasBillingForOrder = async (order: Order): Promise<{ ok: boolean; error?: string }> => {
    const isSimulated =
      order.asaasStatus === 'SIMULATED' ||
      Boolean(order.asaasPaymentId?.startsWith('sim_')) ||
      Boolean(order.asaasUrl?.includes('/simulado/'));

    if (isSimulated) {
      return { ok: true };
    }

    const hasBoleto =
      order.paymentMethod === 'Boleto' ||
      Boolean(order.paymentMethod?.includes('Boleto')) ||
      Boolean(order.paymentSplits?.some(s => s.method === 'Boleto' || s.method === 'Boleto (Asaas)')) ||
      Boolean(order.asaasPaymentId) ||
      Boolean(order.asaasInstallmentId) ||
      Boolean(order.asaasPaymentIds && order.asaasPaymentIds.length > 0) ||
      Boolean(order.asaasUrl);

    if (!hasBoleto) {
      return { ok: true };
    }

    const profile = getStoreProfile(userEmail);
    if (!profile.asaasApiKey) {
      return { ok: true };
    }

    const workerUrl = 'https://vercos.iranildo-jobs.workers.dev';
    const pathPrefix = profile.asaasEnvironment === 'production'
      ? '/asaas-production'
      : '/asaas-sandbox';
    const baseUrl = `${workerUrl}${pathPrefix}`;

    const headers = {
      'access_token': profile.asaasApiKey,
      'Content-Type': 'application/json'
    };

    try {
      const installmentIdsToDelete = new Set<string>();
      const paymentIdsToDelete = new Set<string>();
      let discoveredCustomerId = '';

      if (order.asaasInstallmentId && !order.asaasInstallmentId.startsWith('sim_')) {
        installmentIdsToDelete.add(order.asaasInstallmentId);
      }

      if (order.asaasPaymentIds && order.asaasPaymentIds.length > 0) {
        order.asaasPaymentIds.forEach(id => {
          if (id && !id.startsWith('sim_')) {
            if (id.startsWith('ins_')) {
              installmentIdsToDelete.add(id);
            } else {
              paymentIdsToDelete.add(id);
            }
          }
        });
      }

      if (order.asaasPaymentId && !order.asaasPaymentId.startsWith('sim_')) {
        const mainId = order.asaasPaymentId;
        if (mainId.startsWith('ins_')) {
          installmentIdsToDelete.add(mainId);
        } else if (mainId.startsWith('pay_')) {
          paymentIdsToDelete.add(mainId);
          try {
            const getRes = await fetch(`${baseUrl}/payments/${mainId}`, { method: 'GET', headers });
            if (getRes.ok) {
              const payDetails = await getRes.json();
              if (payDetails.installment) {
                installmentIdsToDelete.add(payDetails.installment);
              }
              if (payDetails.customer) {
                discoveredCustomerId = payDetails.customer;
              }
            }
          } catch (e) {
            console.warn('Could not inspect payment details before deletion:', e);
          }
        } else {
          // Non-prefixed ID (can be an installment UUID/numeric ID or payment ID)
          installmentIdsToDelete.add(mainId);
          paymentIdsToDelete.add(mainId);
        }
      }

      // Search by externalReference in case order had multiple weekly/biweekly charges or missing IDs
      if (order.orderNumber) {
        try {
          const refRes = await fetch(
            `${baseUrl}/payments?externalReference=${encodeURIComponent(order.orderNumber)}&limit=100`,
            { method: 'GET', headers }
          );
          if (refRes.ok) {
            const refData = await refRes.json();
            if (Array.isArray(refData.data)) {
              for (const p of refData.data) {
                if (p.status === 'PENDING' || p.status === 'OVERDUE') {
                  if (p.installment) installmentIdsToDelete.add(p.installment);
                  paymentIdsToDelete.add(p.id);
                }
                if (p.customer && !discoveredCustomerId) {
                  discoveredCustomerId = p.customer;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error querying Asaas by externalReference:', e);
        }
      }

      // If we still don't have customer ID, look up client CPF/CNPJ to find all open charges for this order
      if (!discoveredCustomerId) {
        try {
          const allClients = getClients(userEmail);
          const matchedClient = allClients.find(
            c => (order.clientId && c.id === order.clientId) || c.name === order.clientName
          );
          const cleanCnpj = matchedClient?.cnpj?.replace(/\D/g, '') || '';
          if (cleanCnpj) {
            const custRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCnpj}`, { method: 'GET', headers });
            if (custRes.ok) {
              const custData = await custRes.json();
              if (custData.data && custData.data.length > 0) {
                discoveredCustomerId = custData.data[0].id;
              }
            }
          }
        } catch (e) {
          console.warn('Error looking up customer in Asaas:', e);
        }
      }

      // Search customer payments matching this order number (catches weekly/biweekly _1, _2, ... or description match)
      if (discoveredCustomerId && order.orderNumber) {
        try {
          const custPaysRes = await fetch(
            `${baseUrl}/payments?customer=${discoveredCustomerId}&limit=100`,
            { method: 'GET', headers }
          );
          if (custPaysRes.ok) {
            const custPaysData = await custPaysRes.json();
            if (Array.isArray(custPaysData.data)) {
              for (const p of custPaysData.data) {
                if (p.deleted) continue;
                const isThisOrder =
                  p.externalReference === order.orderNumber ||
                  (typeof p.externalReference === 'string' && p.externalReference.startsWith(`${order.orderNumber}_`)) ||
                  (typeof p.description === 'string' && p.description.includes(`Pedido #${order.orderNumber}`));

                if (isThisOrder && (p.status === 'PENDING' || p.status === 'OVERDUE')) {
                  if (p.installment) installmentIdsToDelete.add(p.installment);
                  paymentIdsToDelete.add(p.id);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error querying customer payments in Asaas:', e);
        }
      }

      if (installmentIdsToDelete.size === 0 && paymentIdsToDelete.size === 0) {
        return { ok: true };
      }

      let deletedCount = 0;
      const errors: string[] = [];

      // 1. Delete installment groups first
      for (const instId of installmentIdsToDelete) {
        const delInstRes = await fetch(`${baseUrl}/installments/${instId}`, {
          method: 'DELETE',
          headers
        });

        if (delInstRes.ok) {
          deletedCount++;
        } else if (delInstRes.status !== 404) {
          // Fallback: fetch payments inside this installment and delete pending ones individually
          let fallbackDeleted = false;
          try {
            const instPaysRes = await fetch(`${baseUrl}/payments?installment=${encodeURIComponent(instId)}&limit=100`, {
              method: 'GET',
              headers
            });
            if (instPaysRes.ok) {
              const instPaysData = await instPaysRes.json();
              if (Array.isArray(instPaysData.data)) {
                for (const p of instPaysData.data) {
                  if (!p.deleted && (p.status === 'PENDING' || p.status === 'OVERDUE')) {
                    const delPay = await fetch(`${baseUrl}/payments/${p.id}`, { method: 'DELETE', headers });
                    if (delPay.ok) {
                      deletedCount++;
                      fallbackDeleted = true;
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Fallback installment deletion failed:', e);
          }

          if (!fallbackDeleted) {
            const errBody = await delInstRes.json().catch(() => ({}));
            const msg = errBody?.errors?.[0]?.description || `Erro HTTP ${delInstRes.status} ao remover parcelamento ${instId}`;
            errors.push(msg);
          }
        }
      }

      // 2. Delete individual payments (skipping any already removed by installment deletion)
      for (const payId of paymentIdsToDelete) {
        // Check if payment still exists and isn't already deleted
        try {
          const checkRes = await fetch(`${baseUrl}/payments/${payId}`, { method: 'GET', headers });
          if (checkRes.status === 404) {
            continue;
          }
          if (checkRes.ok) {
            const payObj = await checkRes.json();
            if (payObj.deleted || (payObj.status !== 'PENDING' && payObj.status !== 'OVERDUE')) {
              continue;
            }
          }
        } catch {
          // Proceed to attempt delete anyway
        }

        const delPayRes = await fetch(`${baseUrl}/payments/${payId}`, {
          method: 'DELETE',
          headers
        });

        if (delPayRes.ok) {
          deletedCount++;
        } else if (delPayRes.status !== 404) {
          const errBody = await delPayRes.json().catch(() => ({}));
          const msg = errBody?.errors?.[0]?.description || `Erro HTTP ${delPayRes.status} ao remover cobrança ${payId}`;
          errors.push(msg);
        }
      }

      if (errors.length > 0 && deletedCount === 0) {
        return { ok: false, error: errors[0] };
      }

      return { ok: true };
    } catch (err: any) {
      console.error('Failed to cancel Asaas payment during order deletion:', err);
      return { ok: false, error: err?.message || 'Erro de conexão com o Asaas' };
    }
  };

  const handleConfirmDelete = async (forceLocalOnly: boolean = false) => {
    if (!orderToDelete) return;
    const order = orders.find(o => o.id === orderToDelete);
    if (!order) return;

    setIsDeleting(true);
    setDeleteError(null);

    if (!forceLocalOnly) {
      const result = await cancelAsaasBillingForOrder(order);
      if (!result.ok) {
        setIsDeleting(false);
        setDeleteError(
          `Não foi possível cancelar o boleto no Asaas (${result.error}). Você pode tentar novamente ou excluir apenas do aplicativo.`
        );
        return;
      }
    }

    deleteOrder(userEmail, orderToDelete);
    loadOrders();
    setIsDeleting(false);
    setDeleteError(null);
    setOrderToDelete(null);
  };

  const handleSaveOrder = (partialOrder: Partial<Order>) => {
    if (orderToEdit) {
      updateOrder(userEmail, { ...orderToEdit, ...partialOrder } as Order);
    } else {
      const newOrder = { sellerId: activeSeller?.id, ...partialOrder } as Order;
      addOrder(userEmail, newOrder);
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
          canEditOrders={canEditOrders}
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
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-800 text-base">Confirmar Exclusão</h3>
            <p className="text-slate-600 text-xs">
              Tem certeza que deseja excluir este pedido? Se houver cobrança em aberto no Asaas, ela também será cancelada. Esta ação não pode ser desfeita.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md font-medium">
                {deleteError}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button 
                disabled={isDeleting}
                onClick={() => { setOrderToDelete(null); setDeleteError(null); }}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              {deleteError && (
                <button
                  disabled={isDeleting}
                  onClick={() => handleConfirmDelete(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Excluir apenas do app
                </button>
              )}
              <button 
                disabled={isDeleting}
                onClick={() => handleConfirmDelete(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Cancelando no Asaas...' : deleteError ? 'Tentar novamente' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
