import { useEffect, useState } from "react";
import { toast } from "sonner";
import LinhaTarefa from "./LinhaTarefa";
import { comMotivo } from "@/api/apiClient";
import { fetchTarefas, type DadosEdicaoTarefa, type Tarefa } from "@/fetchs/fetchTarefas";
import type { Status } from "@/fetchs/fetchStatus";

interface NoTarefaProps {
    tarefa: Tarefa;
    nivel: number;
    statusOptions: Status[];
    onTrocar: (id: number, dados: DadosEdicaoTarefa) => void;
    mostrarProjeto?: boolean;
    //muda depois de uma troca ou de uma tarefa criada: as filhas abertas são relidas
    recarga: number;
}

//uma tarefa da árvore e, logo abaixo, as sub-tarefas dela (recursivo); começa aberta, a seta fecha e abre
const NoTarefa = ({ tarefa, nivel, statusOptions, onTrocar, mostrarProjeto, recarga }: NoTarefaProps) => {
    const [aberta, setAberta] = useState(true);
    const [filhas, setFilhas] = useState<Tarefa[]>([]);
    const temFilhas = tarefa.subtarefas.total > 0;

    useEffect(() => {
        if (!temFilhas || !aberta) return;
        let ativo = true;
        fetchTarefas(1, { idTarefaPai: tarefa.id }, 100)
            .then((pagina) => { if (ativo) setFilhas(pagina.data) })
            .catch((error) => toast.error(comMotivo("Erro ao buscar as sub-tarefas", error)));
        return () => { ativo = false };
    }, [tarefa.id, temFilhas, aberta, recarga]);

    return (
        <>
            <LinhaTarefa tarefa={tarefa} statusOptions={statusOptions} onTrocar={onTrocar} mostrarProjeto={mostrarProjeto}
                nivel={nivel} aberta={aberta} onAlternar={temFilhas ? () => setAberta((a) => !a) : undefined} />
            {aberta && temFilhas && filhas.map((f) => (
                <NoTarefa key={f.id} tarefa={f} nivel={nivel + 1} statusOptions={statusOptions} onTrocar={onTrocar} mostrarProjeto={mostrarProjeto} recarga={recarga} />
            ))}
        </>
    );
};

export default NoTarefa;
