import type { Tarefa } from "@/fetchs/fetchTarefas";
import { corDoTema, idDoTema } from "@/utils/temaTarefa";

//trilha e faixa do tema da tarefa (backlog, filas e cronograma da sprint)

//faixa vertical na cor do tema, na borda esquerda do cartão/linha
export const FaixaTema = ({ tarefa, className = "" }: { tarefa: Tarefa; className?: string }) => {
    const tema = idDoTema(tarefa);
    return <span aria-hidden="true" data-tema={tema} className={`w-[3px] shrink-0 self-stretch rounded-full ${className}`} style={{ background: corDoTema(tema) }} />;
};

//"Projeto · #12 Refatoração › #15 Login ›"; o caminho completo fica no title
export const Trilha = ({ tarefa, comProjeto = true, className = "" }: { tarefa: Tarefa; comProjeto?: boolean; className?: string }) => {
    const passos = tarefa.ancestrais.map((a) => `#${a.id} ${a.nome}`);
    const partes = [...(comProjeto ? [tarefa.projeto.nome] : []), ...(passos.length ? [passos.join(" › ") + " ›"] : [])];
    if (partes.length === 0) return null;
    const texto = partes.join(" · ");
    return <span data-trilha className={`block truncate text-[11px] leading-tight text-texto-mudo ${className}`} title={texto}>{texto}</span>;
};

export const IdTarefa = ({ id }: { id: number }) => <span className="mr-1 font-mono text-[11px] text-texto-fraco">#{id}</span>;
