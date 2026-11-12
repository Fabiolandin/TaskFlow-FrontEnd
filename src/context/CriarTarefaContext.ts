import { createContext, useContext, useEffect, useRef } from "react";

//o que quem abre o dialog pode deixar preenchido (RF-61)
export interface InicioCriarTarefa {
    idProjeto?: number;
    //sub-tarefa (RF-67): a pai vai no POST e o projeto (o dela) fica fixo
    tarefaPai?: { id: number; nome: string };
}

//o dialog de criar tarefa é um só no app, hospedado pelo Layout (RF-57, D-13); quem está dentro dele o abre por aqui
export const CriarTarefaContext = createContext<((inicio?: InicioCriarTarefa) => void) | null>(null);

export const useAbrirCriarTarefa = () => {
    const abrir = useContext(CriarTarefaContext);
    if (!abrir) throw new Error("useAbrirCriarTarefa fora do Layout");
    return abrir;
};

//a página monta o próprio Layout, então não lê o contexto dele: o aviso de "tarefa criada" vai por evento da janela (RF-34)
const EVENTO_CRIADA = "taskflow:tarefa-criada";

export const avisarTarefaCriada = (id: number) => window.dispatchEvent(new CustomEvent(EVENTO_CRIADA, { detail: { id } }));

//chama `aoCriar` a cada tarefa criada pelo dialog, enquanto a tela estiver montada
export const useAoCriarTarefa = (aoCriar: (id: number) => void) => {
    const atual = useRef(aoCriar);
    useEffect(() => { atual.current = aoCriar; });
    useEffect(() => {
        const ouvir = (e: Event) => atual.current((e as CustomEvent<{ id: number }>).detail.id);
        window.addEventListener(EVENTO_CRIADA, ouvir);
        return () => window.removeEventListener(EVENTO_CRIADA, ouvir);
    }, []);
};
