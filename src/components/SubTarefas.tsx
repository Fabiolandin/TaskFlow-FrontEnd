import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import StatusIcon from "./StatusIcon";
import { comMotivo } from "@/api/apiClient";
import { useAbrirCriarTarefa, useAoCriarTarefa } from "@/context/CriarTarefaContext";
import { fetchTarefas, type Tarefa } from "@/fetchs/fetchTarefas";
import type { Status } from "@/fetchs/fetchStatus";

interface SubTarefasProps {
    tarefa: Tarefa;
    statusOptions: Status[];
}

//seção Sub-tarefas da página da tarefa (RF-67): lista as filhas diretas e cria novas sem sair da página
const SubTarefas = ({ tarefa, statusOptions }: SubTarefasProps) => {
    const abrir = useAbrirCriarTarefa();
    const [filhas, setFilhas] = useState<Tarefa[] | null>(null);
    const [recarga, setRecarga] = useState(0);
    useAoCriarTarefa(() => setRecarga((n) => n + 1));

    useEffect(() => {
        let ativo = true;
        fetchTarefas(1, { idTarefaPai: tarefa.id }, 100)
            .then((pagina) => { if (ativo) setFilhas(pagina.data) })
            .catch((error) => toast.error(comMotivo("Erro ao buscar as sub-tarefas", error)));
        return () => { ativo = false };
    }, [tarefa.id, recarga]);

    const concluidas = filhas?.filter((f) => f.status.isFinal).length ?? 0;

    return (
        <section aria-label="Sub-tarefas" data-subtarefas-secao className="mt-2 border-t border-borda pt-4">
            <div className="flex items-center gap-2">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[.12em] text-texto-mudo">Sub-tarefas</h2>
                {filhas && filhas.length > 0 && (
                    <span data-contagem className="font-mono text-[11px] text-texto-fraco">{concluidas}/{filhas.length}</span>
                )}
                <Button variant="ghost" size="sm" className="ml-auto text-texto-fraco"
                    onClick={() => abrir({ idProjeto: tarefa.idProjeto, tarefaPai: { id: tarefa.id, nome: tarefa.nome } })}>
                    <Plus aria-hidden="true" />Adicionar sub-tarefa
                </Button>
            </div>
            {filhas && filhas.length > 0 && (
                <ul className="mt-2 flex flex-col rounded-lg border border-borda bg-superficie">
                    {filhas.map((f) => (
                        <li key={f.id} data-subtarefa-id={f.id} className="flex h-9 items-center gap-2 border-b border-divisoria px-3 last:border-b-0">
                            <StatusIcon status={f.status} todos={statusOptions} />
                            <Link to={`/tarefas/${f.id}`} className="min-w-0 flex-1 truncate text-[13px] text-texto hover:underline">{f.nome}</Link>
                            {f.subtarefas.total > 0 && (
                                <span className="font-mono text-[10.5px] text-texto-fraco">{f.subtarefas.concluidas}/{f.subtarefas.total}</span>
                            )}
                            <span className="shrink-0 text-[12px] text-texto-fraco">{f.responsavel?.nome ?? "Sem responsável"}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default SubTarefas;
