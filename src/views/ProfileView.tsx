import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, FileText, Camera, Check, RotateCcw, Building, Hash, Image as ImageIcon, Copy, ExternalLink } from 'lucide-react';
import { getStoreProfile, saveStoreProfile } from '../lib/store';
import { StoreProfile } from '../types';

interface ProfileViewProps {
  userEmail: string;
  onProfileSave?: () => void;
}

export function ProfileView({ userEmail, onProfileSave }: ProfileViewProps) {
  const [profile, setProfile] = useState<StoreProfile>({
    name: '',
    phone: '',
    email: '',
    bio: '',
    shopName: '',
    shopNumber: '',
    logoUrl: ''
  });

  const [initialProfile, setInitialProfile] = useState<StoreProfile | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
    
    setProfile(prev => ({
      ...prev,
      slug: value
    }));
  };

  const getFriendlyLink = (slugValue: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const slug = slugValue ? slugValue.trim().toLowerCase() : '';
    return `${origin}${pathname}?view=catalog&seller=${slug || 'nome-da-sua-loja'}`;
  };

  const copyLinkToClipboard = () => {
    const link = getFriendlyLink(profile.slug || '');
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    const data = getStoreProfile(userEmail);
    setProfile(data);
    setInitialProfile(data);
  }, [userEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'bio' && value.length > 140) {
      return; // strict limit of 140 characters
    }

    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreProfile(userEmail, profile);
    setInitialProfile(profile);
    setSavedSuccess(true);
    if (onProfileSave) {
      onProfileSave();
    }
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCancel = () => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  };

  const bioCharsLeft = 140 - (profile.bio || '').length;

  return (
    <div className="animate-in fade-in duration-300 space-y-6 pb-20 md:pb-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1.5 pt-4">
        <div className="flex items-center gap-1.5 text-[#4c3780]">
          <User size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Configurações</span>
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Meus Dados</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Insira as informações gerais do usuário e da loja que serão exibidas no Vercos e no Catálogo Online.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-8 max-w-2xl">
        
        {/* PERSONAL INFORMATION SECTION */}
        <div className="space-y-6">
          <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-3">
            Informações Pessoais
          </h2>

          {/* AVATAR / LOGO COMPONENT */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200/60 flex items-center justify-center shrink-0">
                {profile.logoUrl ? (
                  <img 
                    src={profile.logoUrl} 
                    alt="Logo da loja" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-400">
                    <User size={44} className="stroke-[1.5]" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 p-2 bg-[#4c3780] hover:bg-[#3c2a68] text-white rounded-full shadow-md transition-colors cursor-pointer"
                title="Fazer upload de logo/foto"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="text-center sm:text-left space-y-1 flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700">Foto de Perfil / Logo da Loja</p>
              <p className="text-[10px] text-slate-400 max-w-md leading-relaxed">
                Clique no ícone de câmera para selecionar a imagem da sua marca. Ela aparecerá no topo do seu catálogo online.
              </p>
            </div>
          </div>

          {/* FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                * Nome
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Nome do usuário"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Telefone
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="(81) 99971-2618"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                E-mail
              </label>
              <div className="space-y-2">
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="seuemail@exemplo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
                <button
                  type="button"
                  className="text-[11px] font-extrabold text-[#4c3780] hover:text-[#3c2a68] flex items-center gap-1 hover:underline transition-colors cursor-pointer"
                >
                  <Mail size={12} /> Alterar e-mail
                </button>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Biografia
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {bioCharsLeft} caracteres restantes
                </span>
              </div>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Escreva uma breve biografia ou frase de apresentação..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-medium resize-none"
              />
            </div>

          </div>
        </div>

        {/* STORE DETAILS SECTION (ADDITIONAL REQUEST) */}
        <div className="space-y-6 pt-2 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-3">
            Informações da Loja
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Nome da Loja
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="shopName"
                  value={profile.shopName}
                  onChange={handleChange}
                  placeholder="Nome Fantasia da Loja"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Número da Loja
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="shopNumber"
                  value={profile.shopNumber}
                  onChange={handleChange}
                  placeholder="Identificador da Loja (ex: 1)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Link Amigável / Usuário da Loja (Slug)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="slug"
                  value={profile.slug || ''}
                  onChange={handleSlugChange}
                  placeholder="ex: ciadochopp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:bg-white transition-all font-semibold"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Escolha um identificador único sem espaços ou caracteres especiais (ex: ciadochopp). Seus clientes poderão usar este nome amigável para acessar sua loja!
              </p>

              {/* FRIENDLY URL CARD PREVIEW */}
              <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Link do seu catálogo online:
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-grow bg-white border border-slate-200/60 rounded-xl px-3 py-2.5 text-[11px] font-mono font-bold text-[#4c3780] break-all select-all flex items-center overflow-x-auto min-h-[38px] min-w-0">
                    {getFriendlyLink(profile.slug || '')}
                  </div>
                  <button
                    type="button"
                    onClick={copyLinkToClipboard}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                      copiedLink
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-[#4c3780]/5 text-[#4c3780] hover:bg-[#4c3780]/10 border border-[#4c3780]/10"
                    }`}
                  >
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    {copiedLink ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FORM CONTROLS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {savedSuccess && (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-left-2">
              <Check size={16} /> Dados salvos com sucesso!
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4c3780] hover:bg-[#3c2a68] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
            >
              <Check size={14} /> Salvar
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
