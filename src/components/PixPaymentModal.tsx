import { X, QrCode } from 'lucide-react';

interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCode: string;
    qrCodeUrl: string | null;
}

export function PixPaymentModal({ isOpen, onClose, qrCode, qrCodeUrl }: PixPaymentModalProps) {
    if (!isOpen) return null;

    const handleCopyPix = () => {
        if (qrCode) {
            navigator.clipboard.writeText(qrCode);
            alert('Código Pix copiado!');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <div className="bg-black border border-brand-red/30 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.2)] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-brand-red/20 bg-brand-dark/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                            <QrCode className="w-5 h-5 text-green-400" />
                        </div>
                        <h2 className="text-xl font-black font-heading uppercase italic tracking-widest text-white">Pagamento Pix</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-brand-red/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto text-center bg-brand-dark">
                    <p className="text-gray-300 mb-6 font-medium">Escaneie o QR Code ou copie o código abaixo para finalizar o pagamento do seu pedido.</p>

                    {qrCodeUrl ? (
                        <div className="mb-8 flex justify-center p-4 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] inline-block mx-auto border-4 border-white">
                            <img src={qrCodeUrl} alt="QR Code Pix" loading="lazy" className="w-48 h-48 object-contain" />
                        </div>
                    ) : (
                        <div className="mb-6 bg-brand-dark border border-brand-red/20 p-4 rounded text-xs break-all hidden text-gray-500">
                            Image unavailable
                        </div>
                    )}

                    <div className="bg-black p-4 rounded-xl border border-brand-red/30 mb-6 break-all text-xs font-mono text-gray-400 overflow-x-auto text-left shadow-inner">
                        {qrCode}
                    </div>

                    <button
                        onClick={handleCopyPix}
                        className="w-full py-4 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm mb-4 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all transform hover:-translate-y-0.5"
                    >
                        Copiar Código Pix
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-black border border-gray-700 text-gray-400 hover:text-white rounded-xl font-bold hover:bg-gray-900 transition-colors uppercase tracking-wider text-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
