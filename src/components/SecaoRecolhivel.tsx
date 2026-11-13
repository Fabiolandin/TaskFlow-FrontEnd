import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface SecaoRecolhivelProps {
    titulo: string;
    //contagem ao lado do título (ex.: 2/5)
    contagem?: ReactNode;
    //botão à direita do cabeçalho (ex.: Nova tarefa); não abre/fecha a seção
    acao?: ReactNode;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
}

//seção com accordion de abrir e fechar (tarefas do projeto, sub-tarefas da tarefa); sempre começa aberta
const SecaoRecolhivel = ({ titulo, contagem, acao, children, className = "", "aria-label": rotulo }: SecaoRecolhivelProps) => {
    const [aberta, setAberta] = useState(true);

    return (
        <Collapsible asChild open={aberta} onOpenChange={setAberta}>
            <section aria-label={rotulo ?? titulo} data-secao-recolhivel data-aberta={aberta} className={className}>
                <div className="flex items-center gap-2">
                    <CollapsibleTrigger className="-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-1.5 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-foco">
                        <ChevronRight aria-hidden="true" className={`size-3.5 text-texto-mudo transition-transform ${aberta ? "rotate-90" : ""}`} />
                        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[.12em] text-texto-mudo">{titulo}</h2>
                        {contagem !== undefined && <span data-contagem className="font-mono text-[11px] text-texto-fraco">{contagem}</span>}
                    </CollapsibleTrigger>
                    {acao && <div className="ml-auto">{acao}</div>}
                </div>
                <CollapsibleContent className="mt-2">{children}</CollapsibleContent>
            </section>
        </Collapsible>
    );
};

export default SecaoRecolhivel;
