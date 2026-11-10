import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LinhaTarefa from "./LinhaTarefa";
import type { Status } from "@/fetchs/fetchStatus";
import type { DadosEdicaoTarefa, Tarefa } from "@/fetchs/fetchTarefas";

interface ListaTarefasProps {
    tarefas: Tarefa[];
    pagina: number;
    totalPaginas: number;
    onPagina: (pagina: number) => void;
    //cadastro de status de tarefa: ícones e menu da linha (RF-43, RF-44)
    statusOptions: Status[];
    onTrocar: (id: number, dados: DadosEdicaoTarefa) => void;
    //texto da linha quando não há tarefa
    vazio?: string;
}

const estiloCabecalho = "h-9 font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-[#6E7379]";

//tabela de tarefas + paginação, para a tela de Tarefas e a de Minhas Tarefas (SPEC-007); a linha é a do RF-44
const ListaTarefas = ({ tarefas, pagina, totalPaginas, onPagina, statusOptions, onTrocar, vazio = "Nenhuma tarefa encontrada" }: ListaTarefasProps) => {
    return (
        <>
                <div className="mt-4 rounded-lg border border-[#1C1F23] bg-[#0E1012] overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#14171A] bg-[#101316] hover:bg-[#101316]">
                                <TableHead className={estiloCabecalho}>Nome</TableHead>
                                <TableHead className={estiloCabecalho}>Status</TableHead>
                                <TableHead className={estiloCabecalho}>Prioridade</TableHead>
                                <TableHead className={estiloCabecalho}>Prazo</TableHead>
                                <TableHead className={estiloCabecalho}>Responsável</TableHead>
                                <TableHead className={estiloCabecalho}>Projeto</TableHead>
                                <TableHead className={estiloCabecalho}>Labels</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tarefas.length === 0 && (
                                <TableRow className="border-[#14171A] hover:bg-transparent">
                                    <TableCell colSpan={7} className="text-center text-zinc-500">{vazio}</TableCell>
                                </TableRow>
                            )}
                            {tarefas.map((tarefa) => (
                                <LinhaTarefa key={tarefa.id} tarefa={tarefa} statusOptions={statusOptions} onTrocar={onTrocar} />
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-row items-center justify-center gap-4 mt-4">
                    <Button variant="ghost" className="text-gray-400" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
                        Anterior
                    </Button>
                    <p className="text-sm text-zinc-400">Página {pagina} de {totalPaginas}</p>
                    <Button variant="ghost" className="text-gray-400" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)}>
                        Próxima
                    </Button>
                </div>
        </>
    );
};

export default ListaTarefas;
