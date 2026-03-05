import { Navbar } from '../components/layout/Navbar';

export function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="bg-blue-600 pb-24 pt-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Termos de Serviço e Política de Reembolso
                    </h1>
                    <p className="text-blue-100 text-lg">
                        Nocaute Mídia
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 -mt-16 w-full flex-grow mb-12">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-gray-700 leading-relaxed space-y-6">

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Política de Captação para Atletas</h2>
                        <p>
                            A Nocaute Mídia trabalha com o compromisso de entregar o melhor registro do seu desempenho no tatame ou no ringue. Para garantir a transparência e a segurança de ambas as partes, estabelecemos as seguintes políticas de captação, entrega e estorno. Ao contratar nossos serviços, o atleta concorda com as condições abaixo.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">1. Cancelamento de Lutas e W.O. (Estorno Integral)</h3>
                        <p>
                            Se a sua luta cair, for cancelada pelo evento ou o seu adversário não comparecer (W.O.) antes do início do combate, o valor pago pelo pacote de vídeo será 100% estornado. O serviço não pôde ser prestado por motivos de força maior, e o seu dinheiro será devolvido integralmente.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">2. Falhas Técnicas e Erros de Captação (Estorno Integral)</h3>
                        <p className="mb-2">
                            Nossa equipe utiliza equipamentos profissionais, mas imprevistos técnicos podem ocorrer. O atleta terá direito ao estorno de 100% do valor pago caso ocorram falhas de responsabilidade exclusiva da nossa equipe, tais como:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Perda de momentos cruciais por falha de equipamento (ex: cartão de memória corrompido, bateria descarregada).</li>
                            <li>Câmera desfocada no momento de um golpe importante, nocaute ou finalização.</li>
                            <li>Erro humano na captação (ex: filmagem da luta errada ou foco excessivo no corner, perdendo a ação principal).</li>
                            <li>Arquivo final entregue corrompido ou com áudio inaudível (quando a captação de áudio original fizer parte do pacote contratado).</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">3. Incidentes de Luta e Bloqueios Visuais (Árbitros e Médicos)</h3>
                        <p className="mb-2">
                            Em esportes de combate, a prioridade absoluta é a integridade física dos atletas. Nossa equipe se posiciona nos melhores ângulos permitidos pela organização do evento.
                        </p>
                        <p className="mb-2">
                            Não nos responsabilizamos por bloqueios visuais causados pela movimentação de árbitros, médicos ou membros da comissão técnica que entrem na frente da câmera durante a luta, incluindo momentos de interrupção, nocautes ou finalizações.
                        </p>
                        <p className="mb-2">
                            Como este é um fator fora do nosso controle (incidente natural do evento), não realizamos o estorno integral nestes casos.
                        </p>
                        <p>
                            Caso um momento crucial (como um nocaute) seja bloqueado, mas o restante da luta tenha sido captado com qualidade, a Nocaute Mídia avaliará a situação junto ao atleta para oferecer um acordo justo, que pode incluir um estorno parcial ou um desconto significativo na captação do seu próximo combate.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">4. Prazos de Entrega e Atrasos</h3>
                        <p className="mb-2">
                            Sabemos que o timing da postagem é fundamental para o seu engajamento nas redes sociais. O prazo de entrega do seu material será combinado no momento da contratação (ex: X dias úteis após o evento).
                        </p>
                        <p>
                            Caso a Nocaute Mídia não cumpra o prazo de entrega estabelecido, prejudicando o timing da sua postagem, o atleta poderá solicitar o cancelamento do serviço e o estorno do valor pago.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">5. Aprovação do Material (Edições e Highlights)</h3>
                        <p className="mb-2">
                            Para pacotes que envolvem edição personalizada (highlights focados no atleta):
                        </p>
                        <ul className="list-disc pl-6 space-y-1 mb-2">
                            <li>O arquivo final, já em alta resolução e sem marca d'água, será enviado diretamente para a sua avaliação e aprovação.</li>
                        </ul>
                        <p>
                            Por se tratar de um serviço audiovisual customizado e sob encomenda, após o atleta aprovar, baixar ou utilizar o material entregue em suas redes, não haverá estorno por motivo de insatisfação estética ou arrependimento, conforme as diretrizes de produtos personalizados.
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Contato e Suporte</h3>
                        <p>
                            Para dúvidas, solicitações de estorno ou acompanhamento do seu material, entre em contato diretamente com o nosso suporte oficial pelo WhatsApp:<br />
                            <a href="https://wa.me/5521960194354" target="_blank" rel="noopener noreferrer" className="font-bold text-green-600 hover:text-green-700 transition-colors">
                                (21) 96019-4354
                            </a>
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}
