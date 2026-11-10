import { createContext, useContext } from "react";

//o dialog de criar tarefa é um só no app, hospedado pelo Layout (RF-57, D-13); quem está dentro dele o abre por aqui
export const CriarTarefaContext = createContext<(() => void) | null>(null);

export const useAbrirCriarTarefa = () => {
    const abrir = useContext(CriarTarefaContext);
    if (!abrir) throw new Error("useAbrirCriarTarefa fora do Layout");
    return abrir;
};
