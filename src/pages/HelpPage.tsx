import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { ChevronDown, HelpCircle, Mail } from 'lucide-react';

const faqs = [
    {
        question: 'Como faço para assistir/baixar minha luta?',
        answer: 'Após o pagamento ser aprovado (imediato para Pix e Cartão de Crédito), acesse a aba "Minha Conta" no menu superior. Lá estarão todos os seus pedidos. Se o seu pedido for de Luta na Íntegra e já estiver finalizado, haverá um botão para acessar o vídeo.'
    },
    {
        question: 'Quanto tempo demora a edição do meu highlight?',
        answer: 'Os highlights são editados sob demanda. O prazo médio de entrega varia de 3 a 7 dias úteis após o preenchimento dos dados da sua luta na aba "Minha Conta". Você poderá acompanhar o status de produção por lá.'
    },
    {
        question: 'Tem perigo do pagamento falhar?',
        answer: 'Utilizamos o Pagar.me, uma das maiores e mais seguras plataformas de pagamento do Brasil. Todas as transações são criptografadas e seguras. Em caso de falha no cartão, verifique o limite ou tente via Pix.'
    },
    {
        question: 'Errei alguma informação na hora de preencher os dados da luta. E agora?',
        answer: 'Não se preocupe! Na aba "Minha Conta", caso o seu vídeo ainda não tenha sido entregue, você encontrará um botão "Editar Informações" para corrigir os dados enviados para a nossa equipe de edição.'
    },
    {
        question: 'Como faço para falar com o suporte?',
        answer: 'Caso tenha outros problemas ou necessite de suporte específico, sinta-se livre para nos contactar através do WhatsApp oficial ou pelo nosso e-mail de suporte.'
    }
];

export function HelpPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="bg-blue-600 pb-24 pt-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <HelpCircle className="w-16 h-16 text-white/90 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-white mb-4">Como podemos ajudar?</h1>
                    <p className="text-blue-100 text-lg">Encontre respostas para as perguntas mais comuns sobre nossos serviços de gravação e edição.</p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 -mt-16 w-full flex-grow mb-12">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Perguntas Frequentes</h2>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-blue-200">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-5 bg-white text-left focus:outline-none"
                                >
                                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-blue-600' : ''}`} />
                                </button>

                                <div
                                    className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-5 pt-0 text-gray-600 leading-relaxed border-t border-gray-100">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Ainda precisa de ajuda?</h3>
                        <p className="text-gray-600 mb-6">Nossa equipe de suporte está pronta para te atender.</p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <a href="mailto:suporte@highnocaute.com" className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                <Mail className="w-5 h-5 mr-2 text-gray-400" />
                                suporte@highnocaute.com
                            </a>
                            <a href="#" className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                                Falar no WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
