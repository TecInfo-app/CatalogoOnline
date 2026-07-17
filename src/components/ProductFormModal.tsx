import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Info, ChevronDown } from 'lucide-react';
import { Product } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> & { id?: string }, keepOpen?: boolean) => void;
  productToEdit?: Product | null;
  categories: string[];
  onAddCategory: (category: string) => void;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
  onAddCategory,
}: ProductFormModalProps) {
  const [activeTab, setActiveTab] = useState<'preco' | 'geral' | 'variacoes' | 'peso'>('preco');
  
  // Basic Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('Un');
  const [multiple, setMultiple] = useState(1);
  const [category, setCategory] = useState('Sem categoria');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Pricing Tab
  const [currency, setCurrency] = useState('R$');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  // General Info Tab
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [isPromo, setIsPromo] = useState(false);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);

  // Variations Tab
  const [variations, setVariations] = useState<Array<{ name: string; values: string[] }>>([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  // Weight & Dimensions Tab
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');

  // Image Upload / URL
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Preset Mock Images
  const presetImages = [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300', // Backpack
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300', // Red Bag
    'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=300', // Wallet
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=300', // Cosmetics
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=300', // Books/Mug
  ];

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setUnit(productToEdit.unit || 'Un');
      setMultiple(productToEdit.multiple || 1);
      setCategory(productToEdit.category || 'Sem categoria');
      setPrice(productToEdit.price || 0);
      setMinPrice(productToEdit.minPrice || 0);
      setDescription(productToEdit.description || '');
      setStock(productToEdit.stock || 0);
      setStatus(productToEdit.status || 'in_stock');
      setIsPromo(productToEdit.isPromo || false);
      setIsActive(productToEdit.isActive !== false);
      setOriginalPrice(productToEdit.originalPrice);
      setWeight(productToEdit.weight || '');
      setDimensions(productToEdit.dimensions || '');
      setImageUrl(productToEdit.imageUrl || '');
      setVariations(productToEdit.variations || []);
    } else {
      // Reset to default
      setName('');
      setSku('');
      setUnit('Un');
      setMultiple(1);
      setCategory('Sem categoria');
      setPrice(0);
      setMinPrice(0);
      setDescription('');
      setStock(10);
      setStatus('in_stock');
      setIsPromo(false);
      setIsActive(true);
      setOriginalPrice(undefined);
      setWeight('');
      setDimensions('');
      setImageUrl(presetImages[0]);
      setVariations([]);
    }
    setActiveTab('preco');
    setShowNewCategoryInput(false);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle image upload from local file
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add variation
  const handleAddVariation = () => {
    if (!newVarName.trim() || !newVarValue.trim()) return;
    const values = newVarValue
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val !== '');
    
    if (values.length === 0) return;

    setVariations([...variations, { name: newVarName.trim(), values }]);
    setNewVarName('');
    setNewVarValue('');
  };

  // Remove variation
  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  // Add dynamic category
  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      onAddCategory(trimmed);
      setCategory(trimmed);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    }
  };

  const handleSubmit = (e: React.FormEvent, keepOpen = false) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Determine status from stock
    let finalStatus = status;
    if (stock <= 0) {
      finalStatus = 'out_of_stock';
    } else if (stock <= 5) {
      finalStatus = 'low_stock';
    } else {
      finalStatus = 'in_stock';
    }

    const payload: Omit<Product, 'id'> & { id?: string } = {
      name,
      sku: sku || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      price: price || 0,
      stock,
      status: finalStatus,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=300',
      isPromo,
      isActive,
      originalPrice: isPromo ? originalPrice || Math.round(price * 1.2) : undefined,
      unit,
      multiple,
      category,
      minPrice,
      description,
      weight,
      dimensions,
      variations,
    };

    if (productToEdit) {
      payload.id = productToEdit.id;
    }

    onSave(payload, keepOpen);

    if (keepOpen) {
      // Reset form for next item
      setName('');
      setSku('');
      setUnit('Un');
      setMultiple(1);
      setPrice(0);
      setMinPrice(0);
      setDescription('');
      setStock(10);
      setStatus('in_stock');
      setIsPromo(false);
      setIsActive(true);
      setOriginalPrice(undefined);
      setWeight('');
      setDimensions('');
      setImageUrl(presetImages[Math.floor(Math.random() * presetImages.length)]);
      setVariations([]);
      setActiveTab('preco');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-sm font-bold text-[#4c3780] uppercase tracking-wider">
            {productToEdit ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Scroll Area */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Image Selector Column */}
            <div className="md:col-span-3 flex flex-col items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-start">Imagem do Produto</span>
              <div className="relative w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 hover:border-[#4c3780]/40 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all group">
                {imageUrl ? (
                  <>
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                      <label className="p-2 bg-white text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shadow-xs" title="Carregar nova do dispositivo">
                        <Upload size={14} />
                        <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setImageUrl('')}
                        className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-xs"
                        title="Remover imagem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2 group-hover:text-[#4c3780] group-hover:bg-[#4c3780]/5 transition-all">
                      <Upload size={18} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">Inserir do Dispositivo</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Clique ou arraste o arquivo</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* device upload trigger helper */}
              <label className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 border border-slate-200 hover:border-[#4c3780]/30 hover:bg-[#4c3780]/5 text-slate-700 hover:text-[#4c3780] rounded-xl cursor-pointer text-xs font-bold transition-all shadow-2xs">
                <Upload size={13} />
                <span>Escolher do Dispositivo</span>
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
              </label>
              
              {/* Presets Row */}
              <div className="w-full">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ou escolha um modelo:</span>
                <div className="flex gap-1.5 justify-between">
                  {presetImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(img)}
                      className={`w-8 h-8 rounded-md overflow-hidden border-2 transition-all ${
                        imageUrl === img ? 'border-[#4c3780] scale-105' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <img src={img} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fields Column */}
            <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Name (Required) */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  * Nome do Produto
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cama Pet Formato Toca"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 transition-all font-semibold"
                  required
                />
              </div>

              {/* Code / SKU */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Código (SKU ou referência)
                </label>
                <input 
                  type="text" 
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-001"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 transition-all font-mono"
                />
              </div>

              {/* Unit of measure */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Unidade de medida
                </label>
                <input 
                  type="text" 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Kg, Cx, Un, Pç, etc."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 transition-all font-semibold"
                />
              </div>

              {/* Venda em múltiplos de */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Venda em múltiplos de
                </label>
                <input 
                  type="number" 
                  value={multiple}
                  onChange={(e) => setMultiple(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 transition-all font-semibold"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Categoria
                </label>
                {showNewCategoryInput ? (
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nova categoria..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] transition-all font-semibold"
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={handleCreateCategory}
                      className="bg-[#4c3780] hover:bg-[#3c2a68] text-white px-3 rounded-xl text-xs font-bold transition-all"
                    >
                      Ok
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowNewCategoryInput(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 rounded-xl text-xs transition-all"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 transition-all appearance-none font-semibold"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                      title="Criar Nova Categoria"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Visibilidade do Produto Toggle */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Visibilidade do Produto
                </span>
                <label className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 cursor-pointer hover:bg-slate-100/50 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#4c3780] focus:ring-[#4c3780]/30 cursor-pointer"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700">Ativo no Catálogo</p>
                    <p className="text-[9px] text-slate-400">Mostrar aos clientes no site</p>
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* Tab Selection Area */}
          <div className="border-b border-slate-100">
            <div className="flex gap-6 overflow-x-auto hide-scrollbar">
              {[
                { id: 'preco', label: 'TABELAS DE PREÇO' },
                { id: 'geral', label: 'INFORMAÇÕES GERAIS' },
                { id: 'variacoes', label: 'VARIAÇÕES' },
                { id: 'peso', label: 'PESO E DIMENSÕES' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 text-xs font-bold tracking-wider transition-all relative ${
                    activeTab === tab.id 
                      ? 'text-[#4c3780] border-b-2 border-[#4c3780]' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Contents */}
          <div className="bg-slate-50/40 border border-slate-100/50 rounded-2xl p-6 min-h-[180px]">
            
            {/* TAB 1: TABELAS DE PREÇO */}
            {activeTab === 'preco' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Moeda
                  </label>
                  <div className="relative">
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-700 outline-none focus:border-[#4c3780] appearance-none font-semibold"
                    >
                      <option value="R$">R$ (Real)</option>
                      <option value="US$">US$ (Dólar)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Preço Mínimo
                    <Info size={12} className="text-slate-400" title="Preço mínimo aceitável de venda" />
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-bold text-slate-400">{currency}</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={minPrice || ''}
                      onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#4c3780] uppercase tracking-wider block">
                    * Preço de Tabela
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-bold text-slate-400">{currency}</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-full bg-white border border-[#4c3780] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] focus:ring-1 focus:ring-[#4c3780]/20 font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INFORMAÇÕES GERAIS */}
            {activeTab === 'geral' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Quantidade em Estoque
                    </label>
                    <input 
                      type="number" 
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isPromo}
                        onChange={(e) => setIsPromo(e.target.checked)}
                        className="rounded border-slate-300 text-[#4c3780] focus:ring-[#4c3780]"
                      />
                      <span className="text-xs font-semibold text-slate-700">Produto em Promoção</span>
                    </label>
                    {isPromo && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Preço Original:</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={originalPrice || ''}
                          onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || undefined)}
                          placeholder="Ex: R$ 299,00"
                          className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Descrição do Produto
                  </label>
                  <textarea 
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Escreva detalhes técnicos, comerciais ou notas gerais do produto..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 outline-none focus:border-[#4c3780] resize-none"
                  ></textarea>
                </div>
              </div>
            )}

            {/* TAB 3: VARIAÇÕES */}
            {activeTab === 'variacoes' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Nome da Variação (Ex: Cor, Tamanho)
                    </label>
                    <input 
                      type="text" 
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      placeholder="Ex: Tamanho"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-6 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Opções / Valores (Separados por vírgula)
                    </label>
                    <input 
                      type="text" 
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      placeholder="Ex: P, M, G, GG"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4c3780] font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="w-full bg-[#4c3780]/10 hover:bg-[#4c3780]/20 text-[#4c3780] font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variações Ativas</span>
                  {variations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhuma variação criada. Ex: Tamanhos P, M, G ou Cores Preto, Azul.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {variations.map((v, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-xs">
                          <div>
                            <span className="text-xs font-bold text-[#4c3780] block">{v.name}</span>
                            <div className="flex gap-1 flex-wrap mt-1">
                              {v.values.map((val, i) => (
                                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                  {val}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariation(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PESO E DIMENSÕES */}
            {activeTab === 'peso' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Peso (Kg ou g)
                  </label>
                  <input 
                    type="text" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 0.450 kg"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Dimensões (A x L x C cm)
                  </label>
                  <input 
                    type="text" 
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="Ex: 15 x 30 x 10 cm"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#4c3780] font-semibold"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer inside Scroll */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6">
            <button
              type="submit"
              className="bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1"
            >
              ✓ Salvar
            </button>
            {!productToEdit && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="bg-[#4c3780]/10 hover:bg-[#4c3780]/20 text-[#4c3780] font-bold py-3 px-6 rounded-xl text-xs transition-all"
              >
                Salvar e cadastrar outro
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-3 px-6 rounded-xl text-xs transition-all sm:ml-auto"
            >
              Cancelar
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
