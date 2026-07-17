import { Product, Client, Order } from './types';

export const products: Product[] = [
  {
    id: '1',
    sku: 'BLS-001-BR',
    name: 'Bolsa com Alças em Couro Legítimo - Marrom',
    price: 245.90,
    stock: 120,
    status: 'in_stock',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm1fDLdecLi8ujGCSzGdyq75ZzoyDjaemI6z66UtmUDbhlQPH17Lm5vOFkQhcHD6kaNk8U71euWMaFaCOfxJWVG-0XWr9FhF6oOP-ThNcvgGAIiwEGzlfiveqq6GitEn-Io66bCbo0-VCgal5WS4FrBRwW6SqKH6YrhaQGCmp3H1IsiioGAEWKoBe3W9yOUtNkS7M7FwxudJ_VLpD7YTBjx32576v5ddr4H_AD6cOp8JbgRB8poJ-fJWncH2DvY4BF-_nWapmo1Xw',
  },
  {
    id: '2',
    sku: 'MCH-042-BK',
    name: 'Mochila Executiva Compacta Impermeável',
    price: 189.50,
    stock: 12,
    status: 'low_stock',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdViAF396AE23uhBkMa-PMwzmJDxDCFzu-9gQ_3Q4n-SrGwRQgg9-pd56-mtksB3FIA_X8xGVKNxiHBPSANGAyuu4DtwyNdtstFGel5avlsrS69IbekBTpeyqX8pSwa41SvlRZok0e2kbRF9SCMBSiGSipj9BgLn9U0P8n1YUoQYUsJD-IAWwHeQBVLMiaJqQrjZL5XxwWmxHKIssDTrwt6A8Dnnu_TnHEQCK4AewMlRX9XlwiB4i9A4f1pNyVpcnr5Ti_p2VQhhc',
  },
  {
    id: '3',
    sku: 'BLS-088-BG',
    name: 'Bolsa Transversal Estruturada - Bege',
    price: 165.00,
    stock: 0,
    status: 'out_of_stock',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeYi2m9M4r7YUcCYt_4AEqm_Q1Mp4LH6rkOO1Z-UisUPy5mUfyC4SlXLz-DfJxofVfWUVIPaTcv8OaWDes1izt0KKoo-f6-VmYqjXbMg6qPAB47BWG_3_lRnUjTxTtvbrB6KNZgFiq0qZVd9HxeSB9BHjOX3kfr7yAf2eA0cRXkwe1VYlDkJxA1PwgXimqGpiOfEVPXTU_PjQbp-FlJ3-RvLXAPNleaOtDFeJpg-2FwNilElb0Z1bE0FzNhQSmpwGZyp7_CSelqZo',
  },
  {
    id: '4',
    sku: 'CAR-011-NV',
    name: 'Carteira Masculina Couro Slim - Azul Marinho',
    price: 75.50,
    originalPrice: 89.90,
    stock: 450,
    status: 'in_stock',
    isPromo: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8kAb7zqCCwlz-1zfcnbTOal0JT2VCDH1ikCpyEK1NDZjU_oL50QAHLuHs3MSljGx-Q0OJhhhLlBwiCyKerKWWSHlegIeH-uzi1Cea873xyDpmJyi8Nyc-ajgTKTmASWx4AryQIkJisWpLmLPYfLgwnTSAFQjSxdHAX5J0GTnTJkug78Syh7ytpnRPUKL85v8v062aiNVajW67oPuKPcyg7I-lVvAIV0u0DkWNAN8t-4eoKoBGdjXjnhzJlqB8Z8NLQoVWNTk-Hus',
  }
];

export const clients: Client[] = [
  {
    id: '1',
    name: 'silva',
    legalName: 'iranildo silva',
    cnpj: '094.536.184-03',
    status: 'active',
    location: 'São Paulo',
    lastContact: 'Última compra: 12/07/2026',
    ltv: 12450.00,
    phones: ['(81) 99971-2618'],
    emails: ['ciachopp2016@gmail.com'],
    isPortalEnabled: true
  },
  {
    id: '2',
    name: 'Supermercado do Bairro',
    legalName: 'Comércio de Gêneros Alimentícios LTDA',
    cnpj: '12.345.678/0001-90',
    status: 'active',
    location: 'São Paulo, SP',
    lastContact: 'Última compra: 12/07/2026',
    ltv: 12450.00,
    phones: ['(11) 98765-4321']
  },
  {
    id: '3',
    name: 'Drogaria Saúde Viva',
    legalName: 'Saúde Viva Farmácias S.A.',
    cnpj: '98.765.432/0001-10',
    status: 'prospect',
    location: 'Campinas, SP',
    lastContact: 'Último contato: Há 2 dias',
  },
  {
    id: '4',
    name: 'Distribuidora Alfa',
    legalName: 'Alfa Distribuição LTDA',
    cnpj: '11.222.333/0001-44',
    status: 'inactive',
    location: 'Curitiba, PR',
    lastContact: 'Último contato: Há 6 meses',
  }
];

export const orders: Order[] = [
  {
    id: '1',
    clientName: 'Supermercado Silva',
    orderNumber: '4582',
    date: '15 Out 2023',
    itemsCount: 12,
    total: 1450.00,
    status: 'budget'
  },
  {
    id: '2',
    clientName: 'Farmácia Saúde',
    orderNumber: '4581',
    date: '14 Out 2023',
    itemsCount: 5,
    total: 320.50,
    status: 'completed'
  },
  {
    id: '3',
    clientName: 'Lojas ABC Ltda',
    orderNumber: '4580',
    date: '12 Out 2023',
    itemsCount: 24,
    total: 4200.00,
    status: 'canceled'
  }
];
