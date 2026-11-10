import ReactMarkdown, { type Components } from "react-markdown";

//só CommonMark (sem remark-gfm): tabela, riscado e lista de tarefas ficam texto (RF-52).
//O react-markdown não transforma HTML cru em elemento, e a urlTransform padrão tira o `javascript:`.
//Este módulo é carregado por `lazy` (DescricaoMarkdown): fica fora do chunk principal.

//o react-markdown passa o nó da árvore em `node`; ele não vai para o DOM
function semNode<T extends { node?: unknown }>(props: T) {
    const copia = { ...props };
    delete copia.node;
    return copia;
}

const COMPONENTES: Components = {
    //todo link abre em nova aba; o clique não chega a quem está em volta (não edita, não abre o cartão)
    a: (props) => (
        <a {...semNode(props)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="text-[#9BB8F0] underline underline-offset-2 hover:text-[#C4D6F7]" />
    ),
    p: (props) => <p {...semNode(props)} className="my-1.5 first:mt-0 last:mb-0" />,
    ul: (props) => <ul {...semNode(props)} className="my-1.5 list-disc pl-5" />,
    ol: (props) => <ol {...semNode(props)} className="my-1.5 list-decimal pl-5" />,
    li: (props) => <li {...semNode(props)} className="my-0.5" />,
    strong: (props) => <strong {...semNode(props)} className="font-semibold text-[#E7E4DF]" />,
    code: (props) => <code {...semNode(props)} className="rounded bg-[#1B1F23] px-1 py-0.5 font-mono text-[12px] text-[#E7E4DF]" />,
    pre: (props) => <pre {...semNode(props)} className="my-2 overflow-x-auto rounded-md border border-[#1C1F23] bg-[#0E1012] p-3 [&>code]:bg-transparent [&>code]:p-0" />,
    h1: (props) => <h1 {...semNode(props)} className="mt-3 mb-1.5 font-heading text-[17px] font-semibold text-[#E7E4DF]" />,
    h2: (props) => <h2 {...semNode(props)} className="mt-3 mb-1.5 font-heading text-[15px] font-semibold text-[#E7E4DF]" />,
    h3: (props) => <h3 {...semNode(props)} className="mt-2 mb-1 text-[14px] font-semibold text-[#E7E4DF]" />,
    blockquote: (props) => <blockquote {...semNode(props)} className="my-1.5 border-l-2 border-[#333B44] pl-3 text-[#8A9098]" />,
};

const Markdown = ({ texto }: { texto: string }) => <ReactMarkdown components={COMPONENTES}>{texto}</ReactMarkdown>;

export default Markdown;
