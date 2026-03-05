export const compressImageToWebp = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not found'));
                    return;
                }

                // Definir dimensões (opcional: redimensionamento aqui se necessário)
                let width = img.width;
                let height = img.height;

                // Exemplo: Limitar largura a 1200px (opcional)
                const MAX_WIDTH = 1200;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Blob conversion failed'));
                            return;
                        }

                        // Criar novo arquivo WebP
                        const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                        });
                        resolve(webpFile);
                    },
                    'image/webp',
                    0.8 // Qualidade: 80%
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
