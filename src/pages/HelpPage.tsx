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
        <div className="min-h-screen bg-brand-dark flex flex-col font-sans text-gray-100">
            <Navbar />

            <div className="bg-black border-b border-brand-red/30 pb-24 pt-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <HelpCircle className="w-16 h-16 text-brand-orange mx-auto mb-6 drop-shadow-md" />
                    <h1 className="text-4xl md:text-5xl font-black font-heading uppercase italic tracking-wider text-white mb-4 drop-shadow-md">Como podemos ajudar?</h1>
                    <p className="text-gray-300 text-lg font-medium">Encontre respostas para as perguntas mais comuns sobre nossos serviços de gravação e edição.</p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 -mt-16 w-full flex-grow mb-12">
                <div className="bg-black rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.1)] border border-brand-red/20 p-8">
                    <h2 className="text-3xl font-black font-heading uppercase text-white tracking-widest mb-8">Perguntas Frequentes</h2>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-brand-red/20 rounded-xl overflow-hidden transition-colors hover:border-brand-orange bg-brand-dark/50">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                                >
                                    <span className="font-bold font-heading tracking-wide uppercase text-white pr-4">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-brand-orange' : ''}`} />
                                </button>

                                <div
                                    className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-5 pt-0 text-gray-400 leading-relaxed border-t border-brand-red/10">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-8 bg-brand-dark rounded-xl border border-brand-red/20 text-center">
                        <h3 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white mb-2">Ainda precisa de ajuda?</h3>
                        <p className="text-gray-400 mb-8 font-medium">Nossa equipe de suporte está pronta para te atender.</p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <a href="mailto:suporte@highnocaute.com" className="flex items-center justify-center px-6 py-3.5 bg-black border border-brand-red/30 text-white font-heading font-bold uppercase tracking-wider rounded-lg hover:border-brand-orange transition-colors">
                                <Mail className="w-5 h-5 mr-3 text-brand-orange" />
                                suporte@highnocaute.com
                            </a>
                            <a href="#" className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-brand-red to-brand-orange text-white font-heading font-black uppercase italic tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">
                                Falar no WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
