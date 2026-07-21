import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Copy, Check, ArrowLeft, ShieldCheck, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { getStoreProfile } from '../lib/store';

interface AbacatePayCheckoutViewProps {
  orderId: string;
  sellerEmail: string;
}

export function AbacatePayCheckoutView({ orderId, sellerEmail }: AbacatePayCheckoutViewProps) {
  const [session, setSession] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  const storeProfile = getStoreProfile(sellerEmail);
  const shopName = storeProfile.shopName || 'Loja';

  useEffect(() => {
    const sessionData = localStorage.getItem(`abacatepay_session_${orderId}`);
    if (sessionData) {
      setSession(JSON.parse(sessionData));
    }
  }, [orderId]);

  const handleCopyPix = () => {
    const pixCode = `00020101021226830014br.gov.bcb.pix2561api.abacatepay.com/v2/pix/${orderId}5204000053039865405${session?.cartTotal || '0.00'}5802BR5924AbacatePay Intermediacao6009Sao Paulo62070503***6304D1A2`;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate processing time
    setTimeout(() => {
      setLoading(false);
      // Redirect back with success flag and simulated=true using slug if available
      const sellerId = storeProfile.slug || sellerEmail;
      const returnUrl = window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerId}&pay=success&orderId=${orderId}&simulated=true`;
      window.location.href = returnUrl;
    }, 2500);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-400">Carregando checkout AbacatePay...</p>
      </div>
    );
  }

  const formattedTotal = session.cartTotal.toFixed(2).replace('.', ',');

  return (
    <div className="min-h-screen bg-[#0d160f] text-slate-100 flex flex-col font-sans">
      
      {/* ABACATEPAY HEADER BRAND */}
      <header className="border-b border-emerald-950/40 bg-[#090f0a]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-base italic leading-none">A</span>
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-emerald-400 text-sm block">Abacate<span className="text-white">Pay</span></span>
              <span className="text-[9px] text-emerald-500 font-bold tracking-wider uppercase block">Checkout Seguro</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-900/40">
            <ShieldCheck size={12} /> Sandbox / Homologação ativo
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* PAYMENT COLUMN */}
        <div className="md:col-span-7 bg-[#111e14] border border-emerald-950/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Método de pagamento</span>
            <h2 className="text-lg font-black tracking-tight">Como deseja pagar?</h2>
          </div>

          {/* METHOD BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                paymentMethod === 'pix'
                  ? "bg-emerald-950/40 border-emerald-500/80 text-white shadow-lg shadow-emerald-500/5"
                  : "bg-[#16271a] border-emerald-950 text-slate-400 hover:border-emerald-900/50 hover:text-slate-300"
              )}
            >
              <QrCode size={24} className={paymentMethod === 'pix' ? "text-emerald-400" : "text-slate-500"} />
              <div className="text-center">
                <span className="text-xs font-black block">Pix</span>
                <span className="text-[9px] opacity-75 font-semibold">Aprovação imediata</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                paymentMethod === 'card'
                  ? "bg-emerald-950/40 border-emerald-500/80 text-white shadow-lg shadow-emerald-500/5"
                  : "bg-[#16271a] border-emerald-950 text-slate-400 hover:border-emerald-900/50 hover:text-slate-300"
              )}
            >
              <CreditCard size={24} className={paymentMethod === 'card' ? "text-emerald-400" : "text-slate-500"} />
              <div className="text-center">
                <span className="text-xs font-black block">Cartão de Crédito</span>
                <span className="text-[9px] opacity-75 font-semibold">Até 12x parcelas</span>
              </div>
            </button>
          </div>

          {/* PAYMENT DETAILS CONTENT */}
          {paymentMethod === 'pix' ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col items-center justify-center p-6 bg-[#16271a] rounded-2xl border border-emerald-950 text-center space-y-4">
                
                {/* Simulated QR Code */}
                <div className="bg-white p-3 rounded-2xl shadow-lg border border-emerald-950/10 relative group">
                  <div className="w-36 h-36 bg-[#f0f9f3] flex items-center justify-center border-4 border-[#16271a] relative overflow-hidden">
                    {/* Generates a nice techno visual matrix to simulate a QR Code */}
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-2 opacity-95">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "rounded-xs", 
                            (i % 3 === 0 || i % 5 === 2 || i < 8 || i > 28) ? "bg-[#0d160f]" : "bg-emerald-500/20"
                          )} 
                        />
                      ))}
                    </div>
                    {/* Position indicators */}
                    <div className="absolute top-2 left-2 w-7 h-7 bg-[#0d160f] border-4 border-emerald-600 rounded" />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-[#0d160f] border-4 border-emerald-600 rounded" />
                    <div className="absolute bottom-2 left-2 w-7 h-7 bg-[#0d160f] border-4 border-emerald-600 rounded" />
                  </div>
                  <div className="absolute inset-0 bg-emerald-900/10 backdrop-blur-3xs rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded shadow">Simulado</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-emerald-400">Escaneie o QR Code Pix</span>
                  <p className="text-[10px] text-slate-400 max-w-xs font-medium">
                    Abra o aplicativo de pagamentos do seu banco e escolha a opção "Pagar com Pix" escaneando a imagem.
                  </p>
                </div>
              </div>

              {/* PIX COPIA E COLA */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pix Copia e Cola</span>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#16271a] border border-emerald-950 rounded-xl px-3.5 py-3 text-[10px] text-slate-300 font-mono truncate select-all leading-normal">
                    00020101021226830014br.gov.bcb.pix2561api.abacatepay.com/v2/pix/{orderId}5204000053039865405{session.cartTotal}5802BR
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-[#0d160f] px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="stroke-[3]" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PAY BUTTON */}
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-emerald-400 hover:bg-emerald-500 text-[#0d160f] font-black py-4 px-6 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" /> Confirmando seu Pix na API...
                  </>
                ) : (
                  <>
                    Concluir Pagamento do Pix
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4 animate-in fade-in duration-200">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome impresso no cartão</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="EX: CARLOS O SILVA"
                  className="w-full bg-[#16271a] border border-emerald-950 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-600 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Número do cartão</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-[#16271a] border border-emerald-950 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validade</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d{1,2})/, '$1/$2'))}
                    placeholder="MM/AA"
                    className="w-full bg-[#16271a] border border-emerald-950 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CVC / CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    className="w-full bg-[#16271a] border border-emerald-950 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-400 hover:bg-emerald-500 text-[#0d160f] font-black py-4 px-6 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" /> Autorizando compra via API...
                  </>
                ) : (
                  <>
                    Pagar R$ {formattedTotal}
                  </>
                )}
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold border-t border-emerald-950/40 pt-4">
            <ShieldCheck size={14} className="text-emerald-500" /> Seus dados estão 100% protegidos por criptografia de ponta a ponta.
          </div>
        </div>

        {/* ORDER SUMMARY COLUMN */}
        <div className="md:col-span-5 space-y-6">
          
          {/* MERCHANT DETAILS */}
          <div className="bg-[#111e14] border border-emerald-950/60 rounded-3xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-900/60 flex items-center justify-center font-black text-sm">
              {shopName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-wider block">Recebendo pagamento para</span>
              <h3 className="text-xs font-bold text-white tracking-wide">{shopName}</h3>
            </div>
          </div>

          {/* SUMMARY CARD */}
          <div className="bg-[#111e14] border border-emerald-950/60 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-emerald-950/60 pb-3 flex items-center justify-between">
              <span>Resumo da compra</span>
              <span className="text-[10px] font-bold text-[#851b42] bg-purple-950/40 border border-purple-900/40 px-2 py-0.5 rounded-lg">#{orderId}</span>
            </h3>

            {/* PRODUCT ITEMS LIST */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {session.cart.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start text-xs font-medium gap-3">
                  <div className="min-w-0">
                    <span className="text-slate-300 font-bold block line-clamp-1">{item.product.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{item.quantity} unidade(s)</span>
                  </div>
                  <span className="text-slate-300 font-bold shrink-0">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            {/* SUMMARY NUMBERS */}
            <div className="border-t border-emerald-950/60 pt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400 font-semibold">
                <span>Subtotal:</span>
                <span>R$ {session.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              
              {session.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-bold">
                  <span>Desconto:</span>
                  <span>-R$ {session.discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-bold border-t border-emerald-950/40 pt-2.5 text-white">
                <span>Valor Total:</span>
                <span className="text-lg font-black text-emerald-400">
                  R$ {formattedTotal}
                </span>
              </div>
            </div>
          </div>

          {/* BACK TO CATALOG */}
          <button
            onClick={() => {
              const confirmCancel = window.confirm('Tem certeza de que deseja sair do checkout? Seu pedido não será finalizado.');
              if (confirmCancel) {
                const sellerId = storeProfile.slug || sellerEmail;
                window.location.href = window.location.origin + window.location.pathname + `?view=catalog&seller=${sellerId}`;
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold hover:text-slate-400 transition-colors"
          >
            <ArrowLeft size={13} /> Voltar ao catálogo online
          </button>
        </div>

      </main>

      <footer className="py-6 border-t border-emerald-950/20 bg-[#090f0a]/30 text-center text-[10px] text-slate-600 font-semibold">
        Intermediação de pagamentos processada por AbacatePay Tecnologia S.A. CNPJ 00.000.000/0001-00.
      </footer>
    </div>
  );
}
