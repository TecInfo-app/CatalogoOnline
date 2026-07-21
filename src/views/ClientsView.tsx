import { useState, useEffect } from 'react';
import { getClients, addClient, updateClient, deleteClient } from '../lib/store';
import { Client } from '../types';
import { ClientList } from '../components/clients/ClientList';
import { ClientForm } from '../components/clients/ClientForm';
import { ClientDetail } from '../components/clients/ClientDetail';

type ViewState = 'list' | 'create' | 'detail';

export function ClientsView({ userEmail }: { userEmail: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadClients();

    const handleSync = () => {
      loadClients();
    };

    window.addEventListener('vercos_data_synced', handleSync);
    return () => {
      window.removeEventListener('vercos_data_synced', handleSync);
    };
  }, [userEmail]);

  const loadClients = () => {
    setClients(getClients(userEmail));
  };

  const handleCreateNew = () => {
    setClientToEdit(null);
    setViewState('create');
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setViewState('create');
  };

  const handleSaveClient = (partialClient: Partial<Client>) => {
    if (clientToEdit) {
      // Edit mode
      const updated = { ...clientToEdit, ...partialClient } as Client;
      updateClient(userEmail, updated);
      loadClients();
      setViewState('list');
      setClientToEdit(null);
      setSelectedClient(null);
    } else {
      // Create mode
      const newClient = partialClient as Client;
      addClient(userEmail, newClient);
      loadClients();
      setViewState('list');
    }
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setViewState('detail');
  };

  const handleUpdateClient = (client: Client) => {
    updateClient(userEmail, client);
    loadClients();
    setSelectedClient(client);
  };

  const handleDeleteClient = (id: string) => {
    setClientToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      deleteClient(userEmail, clientToDelete);
      loadClients();
      if (selectedClient?.id === clientToDelete) {
        setViewState('list');
        setSelectedClient(null);
      }
      setClientToDelete(null);
    }
  };

  const handleImport = (importedClients: Client[]) => {
    if (!Array.isArray(importedClients)) return;
    
    const existingClients = getClients(userEmail);
    const existingIds = new Set(existingClients.map(c => c.id));
    const existingCnpjs = new Set(
      existingClients
        .map(c => c.cnpj?.replace(/\D/g, ''))
        .filter(Boolean)
    );

    importedClients.forEach(c => {
      if (!c.name) return; // Ignore invalid entries

      // Ensure the client has a valid unique ID
      const clientWithId = {
        ...c,
        id: c.id || `cli-${Math.floor(100000 + Math.random() * 900000)}`
      };

      const cleanCnpj = clientWithId.cnpj?.replace(/\D/g, '');

      const isDuplicate = existingIds.has(clientWithId.id) || (cleanCnpj && existingCnpjs.has(cleanCnpj));

      if (isDuplicate) {
        // If they already exist in this store, merge and update them
        const match = existingClients.find(
          existing => 
            existing.id === clientWithId.id || 
            (cleanCnpj && existing.cnpj?.replace(/\D/g, '') === cleanCnpj)
        );
        if (match) {
          const updated = { ...match, ...clientWithId, id: match.id };
          updateClient(userEmail, updated);
        }
      } else {
        // Otherwise, insert as a brand new client in this store
        addClient(userEmail, clientWithId);
        existingIds.add(clientWithId.id);
        if (cleanCnpj) existingCnpjs.add(cleanCnpj);
      }
    });
    loadClients();
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedClient(null);
    setClientToEdit(null);
  };

  return (
    <div className="h-full bg-slate-50/50 p-6 overflow-y-auto">
      {viewState === 'list' && (
        <ClientList 
          clients={clients} 
          onCreateNew={handleCreateNew} 
          onClientClick={handleClientClick}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onImport={handleImport}
        />
      )}

      {viewState === 'create' && (
        <ClientForm 
          clientToEdit={clientToEdit}
          onSave={handleSaveClient} 
          onCancel={handleBackToList} 
        />
      )}

      {viewState === 'detail' && selectedClient && (
        <ClientDetail 
          client={selectedClient} 
          onBack={handleBackToList}
          onUpdate={handleUpdateClient}
          onEdit={handleEditClient}
        />
      )}

      {/* Custom Confirmation Modal to bypass native confirm() iframe constraints */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-800 text-base">Confirmar Exclusão</h3>
            <p className="text-slate-600 text-xs">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setClientToDelete(null)}
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
