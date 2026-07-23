import React, { useState, useEffect } from 'react';
import { Mail, Phone, ArrowLeft, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { getSellers, getStoreProfile } from '../lib/store';
import { getEmailBySlug, loadStoreData } from '../lib/firebase-sync';
import { Seller } from '../types';
import logoImg from '../assets/shop-logo.png';

interface SellerLoginViewProps {
  ownerId: string; // email or slug of owner
  onLoginSuccess: (ownerEmail: string, seller: Seller) => void;
  onBackToOwnerLogin: () => void;
}

export function SellerLoginView({ ownerId, onLoginSuccess, onBackToOwnerLogin }: SellerLoginViewProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState('Vitrine Pay');
  const [resolvedOwnerEmail, setResolvedOwnerEmail] = useState<string>('');

  // Try to resolve the owner's email from the slug/email provided
  useEffect(() => {
    const resolveAndLoadData = async () => {
      let actualOwnerEmail = ownerId;
      
      if (ownerId && !ownerId.includes('@')) {
        const resolvedEmail = await getEmailBySlug(ownerId);
        if (resolvedEmail) {
          actualOwnerEmail = resolvedEmail;
        }
      }
      
      setResolvedOwnerEmail(actualOwnerEmail);
      
      if (actualOwnerEmail) {
        // Load store data (including sellers) from Firebase so login works on new devices
        await loadStoreData(actualOwnerEmail, true);
        
        try {
          const profile = getStoreProfile(actualOwnerEmail);
          if (profile && profile.shopName) {
            setShopName(profile.shopName);
          }
        } catch (e) {
          console.error("Error fetching owner profile:", e);
        }
      }
    };
    
    resolveAndLoadData();
  }, [ownerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!email || !phone) {
      setErrorMsg('Por favor, preencha o e-mail e o telefone/celular.');
      setLoading(false);
      return;
    }

    try {
      const actualOwnerEmail = resolvedOwnerEmail || ownerId;

      // 2. Fetch sellers list for this owner
      const sellers = getSellers(actualOwnerEmail);
      
      // 3. Find seller with matching email and phone (numbers only comparison to prevent mask mismatch)
      const cleanInputPhone = phone.replace(/\D/g, '');
      const matchedSeller = sellers.find(s => {
        const cleanSellerPhone = s.phone.replace(/\D/g, '');
        const emailMatch = s.email.toLowerCase().trim() === email.toLowerCase().trim();
        const phoneMatch = cleanSellerPhone === cleanInputPhone || s.phone === phone;
        return emailMatch && phoneMatch;
      });

      if (matchedSeller) {
        // Save session
        localStorage.setItem('vitrine_pay_seller_session', JSON.stringify({
          ownerEmail: actualOwnerEmail,
          sellerId: matchedSeller.id
        }));
        
        onLoginSuccess(actualOwnerEmail, matchedSeller);
      } else {
        setErrorMsg('Vendedor não cadastrado ou celular incorreto para este estabelecimento.');
      }
    } catch (err) {
      console.error("Seller login error:", err);
      setErrorMsg('Erro ao processar login. Verifique as informações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 md:p-12">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 flex flex-col items-center">
        
        {/* Logo & Shop Name */}
        <div className="flex flex-col items-center justify-center gap-1 mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg}
              alt="Vitrine Pay"
              className="h-10 w-auto object-contain shrink-0" 
            />
            <span className="text-2xl font-black text-[#851b42] tracking-tight">Vitrine Pay</span>
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Estabelecimento: {shopName}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 text-center flex items-center gap-2">
          <KeyRound size={20} className="text-[#851b42]" /> Portal do Vendedor
        </h1>
        <p className="text-xs text-slate-500 mb-6 text-center leading-relaxed">
          Insira seu e-mail e telefone de vendedor cadastrados para acessar a plataforma de vendas.
        </p>

        {errorMsg && (
          <div className="w-full bg-red-50 text-red-600 text-xs p-3.5 rounded-xl mb-6 border border-red-100 text-center flex items-center gap-2 justify-center font-semibold">
            <ShieldAlert size={14} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Seller E-mail Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Seu E-mail de Vendedor
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendedor@exemplo.com"
                className="w-full pl-11 pr-5 py-3 rounded-xl border border-slate-200 focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 outline-none transition-all text-slate-800 text-sm bg-slate-50/50 hover:bg-slate-50"
                required
              />
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Seller Phone Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Seu Telefone / Celular cadastrado
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full pl-11 pr-5 py-3 rounded-xl border border-slate-200 focus:border-[#851b42] focus:ring-1 focus:ring-[#851b42]/20 outline-none transition-all text-slate-800 text-sm bg-slate-50/50 hover:bg-slate-50"
                required
              />
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#851b42] hover:bg-[#5e132e] active:scale-[0.98] disabled:opacity-70 text-white font-extrabold py-3.5 rounded-xl transition-all text-sm shadow-md shadow-[#851b42]/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Verificando cadastro...' : 'ENTRAR NO PORTAL'} <ArrowRight size={15} />
          </button>
        </form>

        {/* Footer info & Go back */}
        <div className="mt-6 text-center space-y-4 w-full border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onBackToOwnerLogin}
            className="text-xs font-bold text-[#851b42] hover:underline flex items-center gap-1.5 justify-center mx-auto"
          >
            <ArrowLeft size={13} /> Voltar para login de Administrador
          </button>
        </div>
      </div>
    </div>
  );
}
