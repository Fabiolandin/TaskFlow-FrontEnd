import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import ListaTarefas from "./ListaTarefas";
import SecaoRecolhivel from "./SecaoRecolhivel";
import { comMotivo } from "@/api/apiClient";
import { useAbrirCriarTarefa, useAoCriarTarefa } from "@/context/CriarTarefaContext";
import { fetchTarefas, updateTarefa, type DadosEdicaoTarefa, type Tarefa } from "@/fetchs/fetchTarefas";
import type { Status } from "@/fetchs/fetchStatus";

interface SubTarefasProps {
    tarefa: Tarefa;
    statusOptions: Status[];
}

//seção Sub-tarefas da página da tarefa (RF-67): accordion (começa aberto) com a tabela das filhas diretas; cria novas sem sair da página
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

    //troca na linha: um campo por PATCH, e a lista relê (RF-44)
    const trocar = async (id: number, dados: DadosEdicaoTarefa) => {
        try {
            await updateTarefa(id, dados);
        } catch (error) {
            toast.error(comMotivo("Erro ao atualizar a sub-tarefa", error));
            return;
        }
        setRecarga((n) => n + 1);
    }

    const concluidas = filhas?.filter((f) => f.status.isFinal).length ?? 0;

    return (
        <SecaoRecolhivel
            titulo="Sub-tarefas"
            className="mt-2 border-t border-borda pt-4"
            contagem={filhas && filhas.length > 0 ? `${concluidas}/${filhas.length}` : undefined}
            acao={
                <Button variant="ghost" size="sm" className="text-texto-fraco"
                    onClick={() => abrir({ idProjeto: tarefa.idProjeto, tarefaPai: { id: tarefa.id, nome: tarefa.nome } })}>
                    <Plus aria-hidden="true" />Adicionar sub-tarefa
                </Button>
            }
        >
            {filhas && (
                <div data-subtarefas-secao>
                    <ListaTarefas className="" tarefas={filhas} statusOptions={statusOptions} onTrocar={trocar} mostrarProjeto={false} arvore recarga={recarga} vazio="Nenhuma sub-tarefa" />
                </div>
            )}
        </SecaoRecolhivel>
    );
};

export default SubTarefas;
