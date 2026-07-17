import { useState } from 'react';
import { Client } from '../../types';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface ClientFormProps {
  clientToEdit?: Client | null;
  onSave: (client: Partial<Client>) => void;
  onCancel: () => void;
}

export function ClientForm({ clientToEdit, onSave, onCancel }: ClientFormProps) {
  const [type, setType] = useState<'Pessoa Jurídica' | 'Pessoa Física'>(clientToEdit?.type || 'Pessoa Jurídica');
  const [cnpj, setCnpj] = useState(clientToEdit?.cnpj || '');
  const [legalName, setLegalName] = useState(clientToEdit?.legalName || '');
  const [name, setName] = useState(clientToEdit?.name || '');
  const [phone, setPhone] = useState(clientToEdit?.phones?.[0] || '');
  const [email, setEmail] = useState(clientToEdit?.emails?.[0] || '');
  const [validationError, setValidationError] = useState('');
  
  const [showFullForm, setShowFullForm] = useState(false);
  const [cep, setCep] = useState(clientToEdit?.address?.cep || '');
  const [endereco, setEndereco] = useState(clientToEdit?.address?.endereco || '');
  const [numero, setNumero] = useState(clientToEdit?.address?.numero || '');
  const [complemento, setComplemento] = useState(clientToEdit?.address?.complemento || '');
  const [bairro, setBairro] = useState(clientToEdit?.address?.bairro || '');
  const [cidade, setCidade] = useState(clientToEdit?.address?.cidade || '');
  const [estado, setEstado] = useState(clientToEdit?.address?.estado || '');

  const [contactName, setContactName] = useState('');
  const [contactCargo, setContactCargo] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactsList, setContactsList] = useState<{name: string, role: string, phones: string[], emails: string[]}[]>(clientToEdit?.contacts || []);

  const handleAddContact = () => {
    if (contactName) {
      setContactsList([...contactsList, {
        name: contactName,
        role: contactCargo,
        phones: contactPhone ? [contactPhone] : [],
        emails: contactEmail ? [contactEmail] : []
      }]);
      setContactName('');
      setContactCargo('');
      setContactPhone('');
      setContactEmail('');
    }
  };

  const handleRemoveContact = (index: number) => {
    setContactsList(contactsList.filter((_, i) => i !== index));
  };

  const handleSave = (andCreateAnother = false) => {
    if (!legalName.trim()) {
      setValidationError('Razão social é obrigatória');
      return;
    }
    setValidationError('');
    
    onSave({
      id: clientToEdit?.id || Date.now().toString(),
      type,
      cnpj,
      legalName,
      name: name || legalName,
      status: clientToEdit?.status || 'prospect',
      location: cidade && estado ? `${cidade} - ${estado}` : clientToEdit?.location || 'Não informada',
      lastContact: clientToEdit?.lastContact || 'Criado hoje',
      phones: phone ? [phone] : [],
      emails: email ? [email] : [],
      isPortalEnabled: clientToEdit ? clientToEdit.isPortalEnabled : true,
      address: {
        cep, endereco, numero, complemento, bairro, cidade, estado
      },
      contacts: contactsList
    });

    if (andCreateAnother) {
      setCnpj('');
      setLegalName('');
      setName('');
      setPhone('');
      setEmail('');
      setCep('');
      setEndereco('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setCidade('');
      setEstado('');
      setContactName('');
      setContactCargo('');
      setContactPhone('');
      setContactEmail('');
      setContactsList([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-6">
        {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
      </h2>

      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm font-medium">
          ⚠️ {validationError}
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="radio" 
              name="clientType"
              value="Pessoa Jurídica"
              checked={type === 'Pessoa Jurídica'}
              onChange={() => setType('Pessoa Jurídica')}
              className="text-[#4c3780] focus:ring-[#4c3780]"
            />
            Pessoa Jurídica
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="radio" 
              name="clientType"
              value="Pessoa Física"
              checked={type === 'Pessoa Física'}
              onChange={() => setType('Pessoa Física')}
              className="text-[#4c3780] focus:ring-[#4c3780]"
            />
            Pessoa Física
          </label>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1 font-semibold">{type === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF'}</label>
          <input 
            type="text" 
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder={type === 'Pessoa Jurídica' ? '00.000.000/0001-00' : '000.000.000-00'}
            className="w-full max-w-md border border-slate-300 rounded-md px-3.5 py-2.5 text-base font-semibold text-slate-800 focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">* {type === 'Pessoa Jurídica' ? 'Razão social' : 'Nome completo'}</label>
          <input 
            type="text" 
            placeholder="obrigatório"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">{type === 'Pessoa Jurídica' ? 'Nome fantasia' : 'Apelido'}</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Telefone</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full max-w-md border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]"
          />
          <button type="button" className="text-[#4c3780] text-sm font-medium mt-2 hover:underline block">
            Adicionar telefone
          </button>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">E-mail</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full max-w-md border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]"
          />
          <button type="button" className="text-[#4c3780] text-sm font-medium mt-2 hover:underline block">
            Adicionar e-mail
          </button>
        </div>

        <button 
          type="button" 
          onClick={() => setShowFullForm(!showFullForm)}
          className="flex items-center gap-2 text-[#4c3780] text-sm font-bold mt-4 hover:underline"
        >
          {showFullForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Preencher cadastro completo: contatos, endereço e informações adicionais
        </button>

        {showFullForm && (
          <div className="mt-8 space-y-8 border-t border-slate-200 pt-8 animate-in slide-in-from-top-4 duration-300">
            {/* Endereço Principal */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Endereço Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">CEP</label>
                  <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} className="w-full max-w-md border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">Endereço</label>
                  <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Número</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Complemento</label>
                  <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Bairro</label>
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Cidade</label>
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]">
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contatos */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Contatos</h3>
              
              {contactsList.length > 0 && (
                <div className="mb-6 space-y-3">
                  {contactsList.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded-md bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-800">{c.name} <span className="text-sm font-normal text-slate-500">- {c.role}</span></p>
                        <p className="text-sm text-slate-600">{c.phones.join(', ')} {c.emails.length > 0 && `| ${c.emails.join(', ')}`}</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveContact(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">Nome</label>
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">Cargo</label>
                  <input type="text" placeholder="Ex: Gerente de Compras, Recepcionista, etc." value={contactCargo} onChange={(e) => setContactCargo(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">Telefone</label>
                  <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full max-w-md border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">E-mail</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full max-w-md border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]" />
                </div>
                <div className="md:col-span-2">
                  <button type="button" onClick={handleAddContact} className="text-[#4c3780] border border-[#4c3780] hover:bg-slate-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Adicionar contato
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-6 mt-6 flex flex-wrap gap-3">
          <button 
            onClick={() => handleSave(false)}
            className="bg-[#4c3780] hover:bg-[#3d2c66] text-white px-6 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            Salvar
          </button>
          {!clientToEdit && (
            <button 
              onClick={() => handleSave(true)}
              className="bg-[#4c3780] hover:bg-[#3d2c66] text-white px-6 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Salvar e cadastrar outro
            </button>
          )}
          <button 
            onClick={onCancel}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
