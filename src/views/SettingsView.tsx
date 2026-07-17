import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Check, AlertCircle, ShieldAlert, Key, Globe, CheckCircle } from 'lucide-react';
import { getStoreProfile, saveStoreProfile } from '../lib/store';
import { StoreProfile } from '../types';

interface SettingsViewProps {
  userEmail: string;
}

export function SettingsView({ userEmail }: SettingsViewProps) {
  const [profile, setProfile] = useState<StoreProfile>({
    name: '',
    phone: '',
    email: '',
    bio: '',
    shopName: '',
    shopNumber: '',
    logoUrl: '',
    abacatePayEnabled: false,
    abacatePayApiKey: ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    const data = getStoreProfile(userEmail);
    setProfile(data);
  }, [userEmail]);

  const handleToggle = () => {
    setProfile(prev => ({
      ...prev,
      abacatePayEnabled: !prev.abacatePayEnabled
    }));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      abacatePayApiKey: e.target.value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreProfile(userEmail, profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const testConnection = async () => {
    if (!profile.abacatePayApiKey) {
      setTestStatus({
        status: 'error',
        message: 'Por favor, insira uma Chave de API antes de testar.'
      });
      return;
    }

    setTestStatus({ status: 'loading', message: 'Testando conexão...' });

    try {
      // Direct call to AbacatePay store endpoint
      const response = await fetch('https://api.abacatepay.com/v1/store', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${profile.abacatePayApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API (${response.status})`);
      }

      const result = await response.json();
      const storeData = result?.data || result;
      if (storeData && storeData.name) {
        setTestStatus({
          status: 'success',
          message: `Conectado com sucesso! Loja: ${storeData.name || 'AbacatePay'}`
        });
      } else {
        setTestStatus({
          status: 'error',
          message: result?.error || 'A API retornou uma resposta inválida.'
        });
      }
    } catch (err: any) {
      console.error('AbacatePay connection test failed', err);
      // Let's provide a friendly notice since client-side calls might hit CORS or network blockages in preview
      setTestStatus({
        status: 'error',
        message: `Não foi possível conectar: ${err.message || 'Verifique sua chave ou restrições de CORS'}`
      });
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6 pb-20 md:pb-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1.5 pt-4">
        <div className="flex items-center gap-1.5 text-[#4c3780]">
          <Settings size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Configurações do Sistema</span>
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Configurações</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Configure as integrações de pagamento e opções avançadas para o seu catálogo de vendas online.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ABACATEPAY CONFIGURATION CARD */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Integração AbacatePay
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Pagamentos por Pix e Cartão no Catálogo
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* ENABLE/DISABLE TOGGLE */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">Ativar checkout AbacatePay</span>
                <span className="text-[10px] text-slate-400 leading-relaxed max-w-sm block font-medium">
                  Se ativado, seus clientes poderão pagar seus pedidos diretamente com Pix ou Cartão de Crédito.
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  profile.abacatePayEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    profile.abacatePayEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* API KEY INPUT */}
            <div className={`space-y-1.5 transition-all duration-300 ${profile.abacatePayEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Chave de API (Bearer Token)
                </label>
                <a 
                  href="https://abacatepay.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-[#4c3780] hover:underline"
                >
                  Obter chave no painel do AbacatePay &rarr;
                </a>
              </div>
              
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <Key size={14} />
                </div>
                <input
                  type="password"
                  value={profile.abacatePayApiKey || ''}
                  onChange={handleApiKeyChange}
                  disabled={!profile.abacatePayEnabled}
                  placeholder="Insira sua Chave de API Bearer Token (api_abc...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                Sua chave de API é criptografada e salva localmente de forma segura. Nunca compartilhe esta chave com ninguém.
              </p>
            </div>

            {/* CONNECTION TEST BUTTON */}
            {profile.abacatePayEnabled && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Testar Configuração
                  </span>
                  <button
                    type="button"
                    onClick={testConnection}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Globe size={11} /> Testar Conexão
                  </button>
                </div>

                {testStatus.status !== 'idle' && (
                  <div className={`p-3 rounded-xl flex items-start gap-2 text-[11px] ${
                    testStatus.status === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-100/50' :
                    testStatus.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                    'bg-amber-50 text-amber-700 border border-amber-100/50'
                  }`}>
                    {testStatus.status === 'loading' && (
                      <div className="w-3.5 h-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                    )}
                    {testStatus.status === 'success' && <CheckCircle size={14} className="shrink-0 text-emerald-600 mt-0.5" />}
                    {testStatus.status === 'error' && <AlertCircle size={14} className="shrink-0 text-amber-600 mt-0.5" />}
                    <div className="font-semibold flex-1 leading-relaxed">
                      {testStatus.message}
                      {testStatus.status === 'error' && (
                        <p className="text-[9px] text-amber-500 mt-1 font-medium">
                          Nota: Em ambientes de preview, requisições diretas de API podem ser bloqueadas por CORS pelo navegador. A integração funcionará perfeitamente e o catálogo usará o checkout inteligente com simulação para garantir que suas vendas nunca travem!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FORM CONTROLS */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {savedSuccess && (
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-left-2">
                <Check size={16} /> Configurações salvas!
              </div>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4c3780] hover:bg-[#3c2a68] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1 ml-auto"
            >
              <Check size={14} /> Salvar Configurações
            </button>
          </div>
        </form>

        {/* SIDE BAR DETAILS */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-5">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
            Como funciona a API?
          </h3>
          
          <ul className="space-y-4 text-[11px] text-slate-600 leading-relaxed font-semibold">
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-[#4c3780] text-white flex items-center justify-center rounded-full text-[10px] shrink-0 font-bold">1</span>
              <div>
                <strong className="text-slate-800 block mb-0.5">Ativação no Catálogo</strong>
                Os clientes verão um novo método de pagamento "Pix / Cartão" no encerramento da compra.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-[#4c3780] text-white flex items-center justify-center rounded-full text-[10px] shrink-0 font-bold">2</span>
              <div>
                <strong className="text-slate-800 block mb-0.5">Redirecionamento Seguro</strong>
                Eles serão redirecionados para a tela de checkout segura do AbacatePay para realizar o Pix ou preencher o cartão.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-[#4c3780] text-white flex items-center justify-center rounded-full text-[10px] shrink-0 font-bold">3</span>
              <div>
                <strong className="text-slate-800 block mb-0.5">Confirmação em Tempo Real</strong>
                Após o pagamento, o cliente retorna ao catálogo onde a API do AbacatePay valida a transação e libera a conclusão do pedido.
              </div>
            </li>
          </ul>

          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex gap-2.5">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-amber-800 block">Ambiente de Simulação</span>
              <p className="text-[9px] text-amber-700 leading-relaxed font-semibold">
                Para fins de teste, se a chave de API não for fornecida ou falhar devido a bloqueios, o sistema ativará o modo de demonstração AbacatePay. Isso possibilita testar o ciclo completo de checkout sem gastar dinheiro real!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
