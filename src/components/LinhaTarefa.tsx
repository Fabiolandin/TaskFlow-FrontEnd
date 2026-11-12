import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { CampoPrazo, MenuPrioridade, MenuResponsavel, MenuStatus } from "./MenuValorTarefa";
import ChipLabel from "./ChipLabel";
import type { Status } from "@/fetchs/fetchStatus";
import type { DadosEdicaoTarefa, Tarefa } from "@/fetchs/fetchTarefas";
import type { ColunasTarefa } from "@/utils/colunasTarefa";

export interface LinhaTarefaProps extends ColunasTarefa {
    tarefa: Tarefa;
    statusOptions: Status[];
    //grava um campo da tarefa (PATCH parcial); quem chama relê a lista
    onTrocar: (id: number, dados: DadosEdicaoTarefa) => void;
}

const LABELS_VISIVEIS = 2;
const estiloCabecalho = "h-9 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-texto-mudo";

//cabeçalho das colunas, preso no topo da área que rola (RF-72), na mesma ordem da linha
export const CabecalhoTarefas = ({ mostrarStatus = true, mostrarProjeto = true }: ColunasTarefa) => (
    <TableRow data-cabecalho-tarefas className="border-divisoria hover:bg-transparent">
        <TableHead className={`${estiloCabecalho} pl-4`}>Tarefa</TableHead>
        <TableHead className={estiloCabecalho}>Labels</TableHead>
        {mostrarStatus && <TableHead className={estiloCabecalho}>Status</TableHead>}
        <TableHead className={estiloCabecalho}>Prioridade</TableHead>
        <TableHead className={estiloCabecalho}>Prazo</TableHead>
        {mostrarProjeto && <TableHead className={estiloCabecalho}>Projeto</TableHead>}
        <TableHead className={`${estiloCabecalho} pr-4 text-right`}>Resp.</TableHead>
    </TableRow>
);

//linha de tarefa (RF-44, RF-78): o clique fora dos campos abre a página; o nome é link (Ctrl+clique, teclado);
//status, prioridade, responsável e prazo se editam na própria linha
const LinhaTarefa = ({ tarefa, statusOptions, onTrocar, mostrarStatus = true, mostrarProjeto = true }: LinhaTarefaProps) => {
    const navigate = useNavigate();
    const abrir = () => navigate(`/tarefas/${tarefa.id}`);
    const naoPropaga = (e: MouseEvent) => e.stopPropagation();
    const labels = tarefa.labels.slice(0, LABELS_VISIVEIS);
    const resto = tarefa.labels.length - labels.length;

    return (
        <TableRow data-tarefa-id={tarefa.id} onClick={abrir} className="cursor-pointer border-divisoria hover:bg-hover">
            <TableCell className="max-w-0 w-[34%] py-3 pl-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                    {/* o #id fica ao lado do nome, antes dele; a contagem de sub-tarefas, depois (RF-78, emenda 1.1) */}
                    <span className="flex min-w-0 items-baseline gap-2">
                        <span data-id className="shrink-0 font-mono text-[11px] text-texto-mudo">#{tarefa.id}</span>
                        <Link to={`/tarefas/${tarefa.id}`} onClick={naoPropaga} className="min-w-0 truncate rounded-sm text-[13.5px] font-medium text-texto outline-none hover:underline focus-visible:ring-2 focus-visible:ring-foco">
                            {tarefa.nome}
                        </Link>
                        {tarefa.subtarefas.total > 0 && (
                            <span data-subtarefas title="Sub-tarefas concluídas" className="shrink-0 font-mono text-[10.5px] text-texto-fraco">{tarefa.subtarefas.concluidas}/{tarefa.subtarefas.total}</span>
                        )}
                    </span>
                    {/* só em sub-tarefa: de qual tarefa ela é (RF-67) */}
                    {tarefa.tarefaPai && (
                        <span data-secundaria className="truncate font-mono text-[10px] text-texto-mudo">
                            <span data-tarefa-pai>sub-tarefa de {tarefa.tarefaPai.nome}</span>
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="max-w-0 w-[18%] py-3">
                <div data-labels className="flex min-w-0 items-center gap-1.5">
                    {labels.map((l) => <ChipLabel key={l.id} label={l} className="min-w-0" />)}
                    {resto > 0 && <span data-labels-resto title={tarefa.labels.slice(LABELS_VISIVEIS).map((l) => l.nome).join(", ")} className="shrink-0 font-mono text-[10.5px] text-texto-fraco">+{resto}</span>}
                </div>
            </TableCell>
            {mostrarStatus && (
                <TableCell className="py-3">
                    <MenuStatus status={tarefa.status} statusOptions={statusOptions} onEscolher={(idStatus) => onTrocar(tarefa.id, { idStatus })} />
                </TableCell>
            )}
            <TableCell className="py-3">
                <MenuPrioridade prioridade={tarefa.prioridade} onEscolher={(prioridade) => onTrocar(tarefa.id, { prioridade })} />
            </TableCell>
            <TableCell className="py-3">
                <CampoPrazo tarefa={tarefa} onEscolher={(data_final) => onTrocar(tarefa.id, { data_final })} />
            </TableCell>
            {mostrarProjeto && <TableCell className="max-w-0 truncate py-3 text-[13px] text-texto-fraco">{tarefa.projeto.nome}</TableCell>}
            <TableCell className="py-3 pr-4">
                <div className="flex justify-end">
                    <MenuResponsavel soAvatar idProjeto={tarefa.idProjeto} responsavel={tarefa.responsavel} onEscolher={(idUsuarioResponsavel) => onTrocar(tarefa.id, { idUsuarioResponsavel })} />
                </div>
            </TableCell>
        </TableRow>
    );
};

export default LinhaTarefa;
