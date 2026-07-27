export async function processAndCompressImage(
  file: File,
  maxSizeBytes: number = 800 * 1024, // ~800KB target max for Base64 string
  maxWidth: number = 1000,
  maxHeight: number = 1000
): Promise<{ dataUrl: string; compressed: boolean; warning?: string }> {
  return new Promise((resolve, reject) => {
    // Basic file size sanity check before reading
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('A imagem selecionada é muito pesada (acima de 15MB). Por favor, selecione um arquivo menor.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('Formato de imagem inválido.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao processar imagem no navegador.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try JPEG compression with reducing quality if needed
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > maxSizeBytes && quality > 0.25) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        let warning: string | undefined;
        const compressed = file.size > maxSizeBytes || quality < 0.85 || img.width > maxWidth || img.height > maxHeight;

        if (dataUrl.length > 1000000) {
          warning = 'A imagem é grande e ficou próxima do limite (1MB). Caso ocorra erro no salvamento, utilize uma imagem menor.';
        } else if (file.size > 1000000) {
          warning = 'A imagem excedia 1MB e foi automaticamente otimizada e comprimida para garantir o salvamento.';
        }

        resolve({ dataUrl, compressed, warning });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
