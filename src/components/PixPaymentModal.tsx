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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Pagamento Pix</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto text-center">
                    <p className="text-gray-500 mb-6">Escaneie o QR Code ou copie o código abaixo para finalizar o pagamento do seu pedido.</p>

                    {qrCodeUrl ? (
                        <div className="mb-6 flex justify-center">
                            <img src={qrCodeUrl} alt="QR Code Pix" className="w-48 h-48" />
                        </div>
                    ) : (
                        <div className="mb-6 bg-gray-100 p-4 rounded text-xs break-all hidden">
                            Image unavailable
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 break-all text-xs font-mono text-gray-600 overflow-x-auto text-left">
                        {qrCode}
                    </div>

                    <button
                        onClick={handleCopyPix}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mb-4 hover:bg-blue-700 transition-colors"
                    >
                        Copiar Código Pix
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
