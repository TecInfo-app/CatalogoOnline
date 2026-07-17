import React, { useState } from 'react';
import { X, Clipboard, Download, Upload, Check } from 'lucide-react';
import { Product } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onImport: (importedProducts: Product[]) => void;
}

export function ImportExportModal({
  isOpen,
  onClose,
  products,
  onImport,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle Download JSON
  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `produtos_exportados_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Copy to Clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(products, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse and Import Inputted Data
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!inputText.trim()) {
      setErrorMsg('Por favor, cole os dados para importar.');
      return;
    }

    try {
      let parsedData: any[] = [];
      const trimmed = inputText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        // Parse as JSON
        const raw = JSON.parse(trimmed);
        parsedData = Array.isArray(raw) ? raw : [raw];
      } else {
        // Simple CSV parser
        const lines = trimmed.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        parsedData = lines.slice(1).map((line, lineIdx) => {
          const cells = line.split(',');
          const obj: any = {};
          headers.forEach((header, cellIdx) => {
            let val: any = cells[cellIdx]?.trim();
            if (header === 'price' || header === 'preco') {
              val = parseFloat(val) || 0;
            } else if (header === 'stock' || header === 'estoque') {
              val = parseInt(val) || 0;
            }
            // Map common portuguese fields
            if (header === 'nome') header = 'name';
            if (header === 'codigo' || header === 'sku') header = 'sku';
            if (header === 'preco') header = 'price';
            if (header === 'estoque') header = 'stock';

            obj[header] = val;
          });
          return obj;
        });
      }

      // Validate imported products structure
      const validProducts: Product[] = parsedData
        .filter(p => p && typeof p === 'object' && p.name)
        .map(p => ({
          id: p.id || `imported-${Math.floor(100000 + Math.random() * 900000)}`,
          sku: p.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: String(p.name),
          price: parseFloat(p.price) || 0,
          stock: parseInt(p.stock) || 0,
          status: p.status || (parseInt(p.stock) > 0 ? 'in_stock' : 'out_of_stock'),
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=300',
          category: p.category || 'Sem categoria',
          unit: p.unit || 'Un',
          multiple: parseInt(p.multiple) || 1,
          minPrice: parseFloat(p.minPrice) || 0,
          description: p.description || '',
          weight: p.weight || '',
          dimensions: p.dimensions || '',
          variations: Array.isArray(p.variations) ? p.variations : [],
        }));

      if (validProducts.length === 0) {
        setErrorMsg('Nenhum produto válido encontrado. Certifique-se de que cada registro contém pelo menos o campo "name" ou "nome".');
        return;
      }

      onImport(validProducts);
      setSuccessMsg(`${validProducts.length} produtos importados com sucesso!`);
      setInputText('');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);

    } catch (err: any) {
      setErrorMsg(`Erro de formatação: ${err.message || 'Verifique o JSON/CSV digitado.'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-sm font-bold text-[#4c3780] uppercase tracking-wider flex items-center gap-2">
            Importar / Exportar Catálogo
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-slate-100 flex bg-slate-50/50">
          <button
            type="button"
            onClick={() => { setActiveTab('import'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-bold tracking-wider transition-all border-b-2 text-center ${
              activeTab === 'import' 
                ? 'text-[#4c3780] border-[#4c3780] bg-white' 
                : 'text-slate-400 hover:text-slate-600 border-transparent'
            }`}
          >
            IMPORTAR PRODUTOS
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('export'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-bold tracking-wider transition-all border-b-2 text-center ${
              activeTab === 'export' 
                ? 'text-[#4c3780] border-[#4c3780] bg-white' 
                : 'text-slate-400 hover:text-slate-600 border-transparent'
            }`}
          >
            EXPORTAR PRODUTOS
          </button>
        </div>

        {/* Form/View Body */}
        <div className="p-6">
          {activeTab === 'import' ? (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Cole abaixo um array JSON ou dados em formato CSV para adicionar novos produtos à sua conta.
              </p>

              {/* Sample Templates */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-500 space-y-1">
                <span className="font-bold text-slate-700">Modelo JSON suportado:</span>
                <pre className="overflow-x-auto p-1 bg-white rounded border border-slate-100/50">
{`[
  {
    "name": "Bolsa Couro Especial",
    "sku": "BLS-99",
    "price": 250.00,
    "stock": 45,
    "category": "Bolsas",
    "unit": "Un"
  }
]`}
                </pre>
              </div>

              <textarea
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='Cole o JSON ou CSV aqui...'
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 outline-none focus:border-[#4c3780] resize-none"
              ></textarea>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-bounce">
                  <Check size={16} /> {successMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Upload size={14} /> Processar e Importar
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Você pode exportar a lista atual de {products.length} produtos em formato JSON para cópia ou download.
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  rows={6}
                  value={JSON.stringify(products, null, 2)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-500 outline-none select-all resize-none"
                ></textarea>
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="absolute right-3 top-3 bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-600 transition-all flex items-center gap-1 text-[10px] font-bold"
                  title="Copiar para área de transferência"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Clipboard size={12} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="flex-1 bg-[#4c3780] hover:bg-[#3c2a68] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Download size={14} /> Baixar Arquivo .JSON
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
