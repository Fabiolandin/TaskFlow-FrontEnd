import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { MenuPrioridade, MenuStatus } from "./MenuValorTarefa";
import type { Status } from "@/fetchs/fetchStatus";
import type { DadosEdicaoTarefa, Tarefa } from "@/fetchs/fetchTarefas";
import { formatarDia } from "@/utils/formaters/fdata";

export interface LinhaTarefaProps {
    tarefa: Tarefa;
    statusOptions: Status[];
    //grava um campo da tarefa (PATCH parcial); quem chama relê a lista
    onTrocar: (id: number, dados: DadosEdicaoTarefa) => void;
}

//linha de tarefa (RF-44): o clique fora dos ícones abre a página; o nome é link (Ctrl+clique, teclado)
const LinhaTarefa = ({ tarefa, statusOptions, onTrocar }: LinhaTarefaProps) => {
    const navigate = useNavigate();
    const abrir = () => navigate(`/tarefas/${tarefa.id}`);
    const naoPropaga = (e: MouseEvent) => e.stopPropagation();

    return (
        <TableRow data-tarefa-id={tarefa.id} onClick={abrir} className="h-10 cursor-pointer border-[#14171A] hover:bg-[#131619]">
            <TableCell className="max-w-0 w-[32%] py-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                    {/* sub-tarefa: o nome da pai antes, mais discreto (RF-67) */}
                    {tarefa.tarefaPai && (
                        <span data-tarefa-pai className="max-w-[40%] shrink-0 truncate text-[12px] text-[#61666C]">{tarefa.tarefaPai.nome} ›</span>
                    )}
                    <Link to={`/tarefas/${tarefa.id}`} onClick={naoPropaga} className="min-w-0 truncate rounded-sm text-[13.5px] font-medium text-[#E7E4DF] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#3A3F45]">
                        {tarefa.nome}
                    </Link>
                    {tarefa.subtarefas.total > 0 && (
                        <span data-subtarefas title="Sub-tarefas concluídas" className="shrink-0 rounded border border-[#24272B] px-1 font-mono text-[10.5px] text-[#8A9098]">
                            {tarefa.subtarefas.concluidas}/{tarefa.subtarefas.total}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="py-1.5">
                <MenuStatus status={tarefa.status} statusOptions={statusOptions} onEscolher={(idStatus) => onTrocar(tarefa.id, { idStatus })} />
            </TableCell>
            <TableCell className="py-1.5">
                <MenuPrioridade prioridade={tarefa.prioridade} onEscolher={(prioridade) => onTrocar(tarefa.id, { prioridade })} />
            </TableCell>
            <TableCell className="py-1.5 text-[13px] text-[#A9AEB4]">
                <span className="flex items-center gap-2">
                    {tarefa.responsavel && (
                        <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#232B3B] font-mono text-[10px] font-medium text-[#9BB8F0]">
                            {tarefa.responsavel.nome.trim().charAt(0).toUpperCase()}
                        </span>
                    )}
                    <span className={`truncate ${tarefa.responsavel ? "" : "text-[#61666C]"}`}>{tarefa.responsavel?.nome ?? "Sem responsável"}</span>
                </span>
            </TableCell>
            <TableCell className="py-1.5 text-[13px] text-[#8A9098]">{tarefa.projeto.nome}</TableCell>
            <TableCell className="py-1.5 font-mono text-[12px] text-[#7C8189]">{formatarDia(tarefa.data_final)}</TableCell>
        </TableRow>
    );
};

export default LinhaTarefa;
