import { useState, useEffect } from 'react';
import { Share2, Copy, Check, ExternalLink, QrCode, Smartphone, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { getProducts, getStoreProfile } from '../lib/store';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface PortalViewProps {
  userEmail: string;
}

export function PortalView({ userEmail }: PortalViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [inactiveProductsCount, setInactiveProductsCount] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  // Generate the catalog sharing link dynamically using slug if available
  const profile = getStoreProfile(userEmail);
  const sellerId = profile.slug ? profile.slug : userEmail;
  const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
  const catalogUrl = `${window.location.origin}${basePath}?view=catalog&seller=${encodeURIComponent(sellerId)}`;

  useEffect(() => {
    const products = getProducts(userEmail);
    setTotalProductsCount(products.length);
    setActiveProductsCount(products.filter(p => p.isActive !== false).length);
    setInactiveProductsCount(products.filter(p => p.isActive === false).length);
  }, [userEmail]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenCatalog = () => {
    // Use same window for preview to ensure localStorage is shared in iframe environments
    window.location.href = `${catalogUrl}&preview=true`;
  };

  const handleShareWhatsApp = () => {
    const text = `Olá! Confira nosso catálogo de produtos online e faça seu pedido direto pelo link: ${catalogUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6 pb-20 md:pb-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1.5 pt-4">
        <div className="flex items-center gap-1 text-[#851b42]">
          <Share2 size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Portal de Vendas</span>
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Catálogo Online do Cliente</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Divulgue seu catálogo interativo e receba pedidos de orçamentos estruturados direto no seu painel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LINKS & MANAGEMENT */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* LINK SHARING CARD */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-2xs">
                  ● Catálogo Ativo
                </span>
                <h3 className="text-sm font-extrabold text-slate-800">Seu Link de Divulgação Exclusivo</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 text-[#851b42] flex items-center justify-center">
                <Share2 size={18} />
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Copie o endereço abaixo e adicione na Bio do seu Instagram, envie para seus contatos do WhatsApp ou use em suas redes sociais:
            </p>

            {/* URL Display Bar */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 overflow-hidden">
              <input
                type="text"
                readOnly
                value={catalogUrl}
                className="flex-1 bg-transparent border-none outline-none text-xs font-mono font-bold text-[#851b42] select-all px-2 overflow-x-auto"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={cn(
                  "py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0",
                  copied 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-white border border-slate-200 hover:border-[#851b42]/30 hover:bg-[#851b42]/5 text-slate-600 hover:text-[#851b42]"
                )}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* CTA Actions Button group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleOpenCatalog}
                className="w-full bg-[#851b42] hover:bg-[#5e132e] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={13} /> Abrir Catálogo
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Divulgar no WhatsApp
              </button>
            </div>
          </div>

          {/* HOW IT WORKS STEP-BY-STEP */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> Como Funciona o Catálogo?
            </h3>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-50 text-[#851b42] font-black text-xs flex items-center justify-center shrink-0">1</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Selecione a Visibilidade dos Produtos</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    No menu <strong className="text-slate-700">Produtos</strong>, clique na chave "Catálogo" de cada produto ou edite-o e ative a chave "Visibilidade do Produto" para que ele apareça online.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-50 text-[#851b42] font-black text-xs flex items-center justify-center shrink-0">2</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Compartilhe com Seus Clientes</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Divulgue seu link exclusivo. Seus clientes podem acessar de qualquer celular ou computador sem precisar instalar nada!
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-50 text-[#851b42] font-black text-xs flex items-center justify-center shrink-0">3</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">O Cliente Monta e Envia o Carrinho</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Eles navegam pelas categorias, selecionam quantidades e clicam em enviar. Informam os dados de contato e finalizam.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-50 text-[#851b42] font-black text-xs flex items-center justify-center shrink-0">4</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Acompanhe Seus Novos Pedidos</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    O pedido aparece instantaneamente com o status <strong className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-mono">Em orçamento</strong> na sua tela de <strong className="text-slate-700">Pedidos</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW & STATS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CATALOG VISIBILITY STATS */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Métricas do Catálogo</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/30 text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                  <Eye size={16} />
                </div>
                <span className="text-[20px] font-black text-slate-800">{activeProductsCount}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Produtos Ativos</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/40 text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1">
                  <EyeOff size={16} />
                </div>
                <span className="text-[20px] font-black text-slate-800">{inactiveProductsCount}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Produtos Ocultos</p>
              </div>
            </div>

            <div className="bg-[#851b42]/5 rounded-2xl p-4 border border-[#851b42]/10 flex items-center justify-between text-xs">
              <span className="font-bold text-[#851b42]">Total de produtos cadastrados:</span>
              <span className="font-extrabold text-slate-800">{totalProductsCount}</span>
            </div>
          </div>

          {/* SIMULATED DEVICE FRAME PREVIEW */}
          <div className="bg-slate-950 rounded-[40px] p-4 pt-10 pb-8 relative shadow-xl border-4 border-slate-800 hidden sm:block overflow-hidden max-w-xs mx-auto">
            
            {/* Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-auto mr-3" />
            </div>

            {/* Screen Content Wrapper */}
            <div className="bg-slate-50 h-[380px] rounded-2xl overflow-y-auto overflow-x-hidden relative flex flex-col justify-between text-slate-700 hide-scrollbar">
              
              {/* Fake Client App Header */}
              <div className="bg-white border-b border-slate-100 p-2.5 flex justify-between items-center sticky top-0 shadow-3xs">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-[#851b42] uppercase tracking-wider">Vitrine Pay</span>
                  <span className="text-[7.5px] font-bold text-slate-600 -mt-0.5 truncate max-w-[80px]">Catálogo</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#851b42] text-white flex items-center justify-center text-[8px] font-bold">
                  🛒
                </div>
              </div>

              {/* Fake Catalog Products */}
              <div className="p-3 space-y-2 flex-grow">
                <div className="bg-purple-100/40 p-2 rounded-lg border border-purple-200/50 text-[9px] font-bold text-[#851b42] text-center">
                  Visualização Mobile do Cliente
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Fake product 1 */}
                  <div className="bg-white border border-slate-100 p-2 rounded-xl flex flex-col justify-between">
                    <div className="aspect-square bg-slate-50 rounded flex items-center justify-center p-1">
                      <span className="text-xl">🎒</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-800 line-clamp-1 mt-1">Mochila Executiva</p>
                    <p className="text-[8px] font-black text-[#851b42] mt-0.5">R$ 180,00</p>
                  </div>

                  {/* Fake product 2 */}
                  <div className="bg-white border border-slate-100 p-2 rounded-xl flex flex-col justify-between">
                    <div className="aspect-square bg-slate-50 rounded flex items-center justify-center p-1">
                      <span className="text-xl">🧥</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-800 line-clamp-1 mt-1">Sobretudo Couro</p>
                    <p className="text-[8px] font-black text-[#851b42] mt-0.5">R$ 499,00</p>
                  </div>
                </div>
              </div>

              {/* Fake Footer */}
              <div className="bg-white p-2 text-center text-[7px] text-slate-400 border-t border-slate-100">
                Vitrine Pay Catálogo Online
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
