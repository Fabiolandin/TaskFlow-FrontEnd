import { lazy, Suspense, useState, type MouseEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

//o react-markdown só é baixado quando uma tela mostra descrição (RF-52, D-8: 1º code-splitting do app)
const Markdown = lazy(() => import("./Markdown"));

//texto renderizado; enquanto o chunk chega, o texto cru (mesmas palavras, sem quebrar a tela)
export const MarkdownTexto = ({ texto, className }: { texto: string; className?: string }) => (
    <div data-markdown className={className}>
        <Suspense fallback={<p className="whitespace-pre-wrap">{texto}</p>}>
            <Markdown texto={texto} />
        </Suspense>
    </div>
);

interface DescricaoMarkdownProps {
    valor: string | null;
    //grava a descrição nova (null = vazia); devolve se gravou
    onGravar: (novo: string | null) => Promise<boolean>;
}

//descrição da tarefa e do projeto (RF-52): clicar fora de um link edita o markdown cru; sair grava, só se mudou,
//com o texto como foi digitado (sem trim); vazia ou só espaços grava null; nada grava a cada tecla
const DescricaoMarkdown = ({ valor, onGravar }: DescricaoMarkdownProps) => {
    const [rascunho, setRascunho] = useState<string | null>(null);

    const editar = (e?: MouseEvent) => {
        if (e && (e.target as HTMLElement).closest("a")) return;
        setRascunho(valor ?? "");
    }

    const sair = async () => {
        if (rascunho === null) return;
        const novo = rascunho.trim() ? rascunho : null;
        if (novo !== (valor ?? null)) await onGravar(novo);
        setRascunho(null);
    }

    if (rascunho !== null) {
        return (
            <Textarea
                aria-label="Descrição"
                autoFocus
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                onBlur={sair}
                placeholder="Escreva em markdown: **negrito**, *itálico*, listas, [links](https://…), `código`"
                className="-mx-2 min-h-32 border-borda-media bg-hover px-2 font-mono text-[12.5px] leading-[1.6] text-texto-2 placeholder:text-placeholder focus-visible:ring-0"
            />
        );
    }

    if (!valor) {
        return (
            <button type="button" data-descricao-vazia onClick={() => editar()}
                className="-mx-2 rounded-md px-2 py-1.5 text-left text-[13px] text-placeholder hover:bg-hover hover:text-texto-fraco">
                Adicionar descrição…
            </button>
        );
    }

    return (
        <div
            data-descricao
            tabIndex={0}
            title="Clique para editar"
            onClick={editar}
            onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) editar(); }}
            className="-mx-2 cursor-text rounded-md px-2 py-1.5 text-[13px] leading-[1.6] text-texto-suave outline-none hover:bg-hover focus-visible:bg-hover"
        >
            <MarkdownTexto texto={valor} />
        </div>
    );
};

export default DescricaoMarkdown;
