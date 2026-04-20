/**
 * Utilitário para otimização de imagens com conversão para WebP
 * WebP oferece 20-30% menor tamanho comparado a JPG/PNG
 */
import { logger } from '@/lib/logger';

export interface OptimizedImage {
  blob: Blob;
  type: string;
  extension: string;
}

/**
 * Verifica se o navegador suporta WebP
 */
export const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

/**
 * Converte uma imagem para WebP com qualidade otimizada
 * @param file - Arquivo de imagem original
 * @param quality - Qualidade de 0 a 1 (padrão: 0.85 - bom equilíbrio tamanho/qualidade)
 * @returns Promise com o blob otimizado
 */
export const convertToWebP = async (
  file: File,
  quality: number = 0.85
): Promise<OptimizedImage> => {
  // Se já é WebP, apenas retorna
  if (file.type === 'image/webp') {
    return {
      blob: file,
      type: 'image/webp',
      extension: 'webp'
    };
  }

  // Se é GIF animado ou SVG, não converte (perderíamos animação/vetorização)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    const extension = file.type === 'image/gif' ? 'gif' : 'svg';
    return {
      blob: file,
      type: file.type,
      extension
    };
  }

  // Verifica suporte a WebP
  if (!supportsWebP()) {
    logger.warn('Navegador não suporta WebP, mantendo formato original');
    const extension = file.type.split('/')[1] || 'jpg';
    return {
      blob: file,
      type: file.type,
      extension
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Define dimensões do canvas
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (!ctx) {
        reject(new Error('Falha ao obter contexto do canvas'));
        return;
      }

      // Desenha a imagem no canvas
      ctx.drawImage(img, 0, 0);

      // Converte para WebP
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao converter imagem para WebP'));
            return;
          }

          // Verifica se a conversão resultou em arquivo menor
          if (blob.size >= file.size) {
            logger.log('WebP não é menor que o original, mantendo formato original');
            const extension = file.type.split('/')[1] || 'jpg';
            resolve({
              blob: file,
              type: file.type,
              extension
            });
            return;
          }

          const savings = ((file.size - blob.size) / file.size * 100).toFixed(1);
          logger.log(`✅ Imagem otimizada: ${savings}% de redução (${formatBytes(file.size)} → ${formatBytes(blob.size)})`);

          resolve({
            blob,
            type: 'image/webp',
            extension: 'webp'
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem para conversão'));
    };

    // Cria URL temporária para a imagem
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Otimiza imagem com redimensionamento opcional
 * @param file - Arquivo de imagem original
 * @param options - Opções de otimização
 */
export const optimizeImage = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    convertToWebP?: boolean;
  } = {}
): Promise<OptimizedImage> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    convertToWebP: shouldConvert = true
  } = options;

  // Se não precisa converter e não precisa redimensionar
  if (!shouldConvert) {
    const extension = file.type.split('/')[1] || 'jpg';
    return { blob: file, type: file.type, extension };
  }

  // Se é GIF ou SVG, não processa
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return convertToWebP(file, quality);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { naturalWidth: width, naturalHeight: height } = img;

      // Calcula novas dimensões mantendo proporção
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Falha ao obter contexto do canvas'));
        return;
      }

      // Desenha com suavização
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determina formato de saída
      const outputType = supportsWebP() ? 'image/webp' : 'image/jpeg';
      const extension = supportsWebP() ? 'webp' : 'jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao otimizar imagem'));
            return;
          }

          // Verifica se otimização valeu a pena
          if (blob.size >= file.size && width === img.naturalWidth && height === img.naturalHeight) {
            const originalExt = file.type.split('/')[1] || 'jpg';
            resolve({ blob: file, type: file.type, extension: originalExt });
            return;
          }

          const savings = ((file.size - blob.size) / file.size * 100).toFixed(1);
          logger.log(`✅ Imagem otimizada: ${savings}% de redução (${formatBytes(file.size)} → ${formatBytes(blob.size)})`);

          resolve({ blob, type: outputType, extension });
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem para otimização'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Formata bytes em unidade legível
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
