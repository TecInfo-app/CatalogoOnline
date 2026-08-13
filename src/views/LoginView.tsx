import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

import logoImg from '../assets/shop-logo.png';

export function LoginView({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error(error);
      let message = 'Erro de autenticação';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        message = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail inválido.';
      } else {
        message = error.message || 'Erro de autenticação';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Por favor, digite seu e-mail no campo acima para redefinir a senha.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`E-mail de redefinição enviado com sucesso para ${email}! Verifique sua caixa de entrada e spam.`);
    } catch (error: any) {
      console.error(error);
      let message = 'Erro ao enviar e-mail de redefinição';
      if (error.code === 'auth/user-not-found') {
        message = 'Nenhum usuário encontrado com este e-mail.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail inválido.';
      } else {
        message = error.message || 'Erro ao enviar e-mail de redefinição';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 md:p-12">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 flex flex-col items-center">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img 
            src={logoImg}
            alt="Vitrine Pay"
            className="h-12 w-auto object-contain shrink-0" 
          />
          <span className="text-3xl font-extrabold text-primary tracking-tight">Vitrine Pay</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 text-center">
          Acessar o sistema
        </h1>
        <p className="text-sm text-slate-500 mb-8 text-center">
          Entre com suas credenciais para continuar
        </p>

        {errorMsg && (
          <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="w-full bg-emerald-50 text-emerald-700 text-sm p-3.5 rounded-lg mb-6 border border-emerald-100 text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* E-mail Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 text-sm bg-slate-50 hover:bg-slate-50/50"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700 block">
                Senha
              </label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 text-sm bg-slate-50 hover:bg-slate-50/50 pr-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00d166] hover:bg-[#00b859] active:scale-[0.98] disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-all text-base shadow-md shadow-[#00d166]/10 mt-2 cursor-pointer"
          >
            {loading ? 'Aguarde...' : 'ENTRAR'}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center space-y-4 w-full border-t border-slate-100 pt-6">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Para saber como tratamos os dados pessoais visite nosso{' '}
            <a href="#" className="underline hover:text-slate-600">
              Aviso de privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
