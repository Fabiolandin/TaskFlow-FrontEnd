import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
    //árvore (projeto, sub-tarefas): profundidade da linha; sem ela, a lista é plana
    nivel?: number;
    //só na árvore, quando a tarefa tem sub-tarefas: seta de abrir/fechar
    aberta?: boolean;
    onAlternar?: () => void;
}

//recuo de cada nível da árvore e posição da linha guia (centro da seta)
const RECUO = 22;
const INICIO = 12;

//selo de progresso das sub-tarefas: anel que enche conforme as concluídas + "c/t"
const SeloSubtarefas = ({ concluidas, total }: { concluidas: number; total: number }) => {
    const raio = 4.5;
    const volta = 2 * Math.PI * raio;
    const completo = concluidas >= total;
    return (
        <span data-subtarefas title="Sub-tarefas concluídas"
            className="flex h-[22px] shrink-0 items-center gap-1.5 rounded-full border border-borda-forte px-2 font-mono text-[11px] text-texto-fraco">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className={completo ? "text-tom-verde-texto" : "text-tom-azul-texto"}>
                <circle cx="6" cy="6" r={raio} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.5" />
                <circle cx="6" cy="6" r={raio} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                    strokeDasharray={volta} strokeDashoffset={volta * (1 - concluidas / total)} transform="rotate(-90 6 6)" />
            </svg>
            {concluidas}/{total}
        </span>
    );
};

const LABELS_VISIVEIS = 2;
const estiloCabecalho = "h-9 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-texto-mudo";

//cabeçalho das colunas, preso no topo da área que rola (RF-72), na mesma ordem da linha
export const CabecalhoTarefas = ({ mostrarProjeto = true }: ColunasTarefa) => (
    <TableRow data-cabecalho-tarefas className="border-divisoria hover:bg-transparent">
        <TableHead className={`${estiloCabecalho} pl-11`}>Tarefa</TableHead>
        <TableHead className={estiloCabecalho}>Labels</TableHead>
        <TableHead className={estiloCabecalho}>Prioridade</TableHead>
        <TableHead className={estiloCabecalho}>Prazo</TableHead>
        {mostrarProjeto && <TableHead className={estiloCabecalho}>Projeto</TableHead>}
        <TableHead className={`${estiloCabecalho} pr-4 text-right`}>Resp.</TableHead>
    </TableRow>
);

//linha de tarefa (RF-44, RF-78): o clique fora dos campos abre a página; o nome é link (Ctrl+clique, teclado);
//status (a bolinha ao lado do nome), prioridade, responsável e prazo se editam na própria linha
const LinhaTarefa = ({ tarefa, statusOptions, onTrocar, mostrarProjeto = true, nivel, aberta, onAlternar }: LinhaTarefaProps) => {
    const arvore = nivel !== undefined;
    const navigate = useNavigate();
    const abrir = () => navigate(`/tarefas/${tarefa.id}`);
    const naoPropaga = (e: MouseEvent) => e.stopPropagation();
    const labels = tarefa.labels.slice(0, LABELS_VISIVEIS);
    const resto = tarefa.labels.length - labels.length;

    return (
        <TableRow data-tarefa-id={tarefa.id} onClick={abrir} className="cursor-pointer border-divisoria hover:bg-hover">
            <TableCell className="relative max-w-0 w-[48%] py-3 pl-3">
                {/* linhas guia: uma por nível acima desta linha */}
                {arvore && Array.from({ length: nivel }, (_, i) => (
                    <span key={i} aria-hidden="true" data-guia className="absolute inset-y-0 w-px bg-borda-forte" style={{ left: INICIO + i * RECUO + 10 }} />
                ))}
                <div className="flex min-w-0 items-center gap-2" style={arvore ? { paddingLeft: nivel * RECUO } : undefined}>
                {arvore && (onAlternar ? (
                    <button type="button" data-alternar aria-expanded={aberta} aria-label={aberta ? "Fechar sub-tarefas" : "Abrir sub-tarefas"}
                        onClick={(e) => { e.stopPropagation(); onAlternar(); }}
                        className="-mr-1 flex size-5 shrink-0 items-center justify-center rounded text-texto-mudo outline-none hover:bg-realce hover:text-texto focus-visible:ring-2 focus-visible:ring-foco">
                        <ChevronRight aria-hidden="true" className={`size-3.5 transition-transform ${aberta ? "rotate-90" : ""}`} />
                    </button>
                ) : <span aria-hidden="true" className="-mr-1 size-5 shrink-0" />)}
                <MenuStatus soIcone status={tarefa.status} statusOptions={statusOptions} onEscolher={(idStatus) => onTrocar(tarefa.id, { idStatus })} />
                <div className="flex min-w-0 flex-col gap-0.5">
                    {/* o #id fica ao lado do nome, antes dele; a contagem de sub-tarefas, depois (RF-78, emenda 1.1) */}
                    <span className="flex min-w-0 items-center gap-2">
                        <span data-id className="shrink-0 font-mono text-[11px] text-texto-mudo">#{tarefa.id}</span>
                        <Link to={`/tarefas/${tarefa.id}`} onClick={naoPropaga} className="min-w-0 truncate rounded-sm text-[13.5px] font-medium text-texto outline-none hover:underline focus-visible:ring-2 focus-visible:ring-foco">
                            {tarefa.nome}
                        </Link>
                        {tarefa.subtarefas.total > 0 && <SeloSubtarefas concluidas={tarefa.subtarefas.concluidas} total={tarefa.subtarefas.total} />}
                    </span>
                    {/* só em sub-tarefa da lista plana: de qual tarefa ela é (RF-67); na árvore a mãe está logo acima */}
                    {!arvore && tarefa.tarefaPai && (
                        <span data-secundaria className="truncate font-mono text-[10px] text-texto-mudo">
                            <span data-tarefa-pai>sub-tarefa de {tarefa.tarefaPai.nome}</span>
                        </span>
                    )}
                </div>
                </div>
            </TableCell>
            <TableCell className="max-w-0 w-[14%] py-3">
                <div data-labels className="flex min-w-0 items-center gap-1.5">
                    {labels.map((l) => <ChipLabel key={l.id} label={l} className="min-w-0" />)}
                    {resto > 0 && <span data-labels-resto title={tarefa.labels.slice(LABELS_VISIVEIS).map((l) => l.nome).join(", ")} className="shrink-0 font-mono text-[10.5px] text-texto-fraco">+{resto}</span>}
                </div>
            </TableCell>
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
