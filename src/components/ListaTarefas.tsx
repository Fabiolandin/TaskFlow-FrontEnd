import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import LinhaTarefa, { CabecalhoTarefas } from "./LinhaTarefa";
import { contarColunas } from "@/utils/colunasTarefa";
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

//tabela de tarefas + paginação, para a tela de Tarefas e a de Minhas Tarefas (SPEC-007); a linha é a do RF-44
const ListaTarefas = ({ tarefas, pagina, totalPaginas, onPagina, statusOptions, onTrocar, vazio = "Nenhuma tarefa encontrada" }: ListaTarefasProps) => {
    return (
        <>
                <div className="mt-4 overflow-clip rounded-cartao border border-borda bg-superficie">
                    <Table containerClassName="overflow-x-clip">
                        {/* cabeçalho preso no topo da área que rola (RF-72) */}
                        <TableHeader className="sticky -top-6 z-10 bg-cabecalho">
                            <CabecalhoTarefas />
                        </TableHeader>
                        <TableBody>
                            {tarefas.length === 0 && (
                                <TableRow className="border-divisoria hover:bg-transparent">
                                    <TableCell colSpan={contarColunas({})} className="text-center text-texto-fraco">{vazio}</TableCell>
                                </TableRow>
                            )}
                            {tarefas.map((tarefa) => (
                                <LinhaTarefa key={tarefa.id} tarefa={tarefa} statusOptions={statusOptions} onTrocar={onTrocar} />
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-row items-center justify-center gap-4 mt-4">
                    <Button variant="ghost" className="text-texto-suave" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
                        Anterior
                    </Button>
                    <p className="text-sm text-texto-suave">Página {pagina} de {totalPaginas}</p>
                    <Button variant="ghost" className="text-texto-suave" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)}>
                        Próxima
                    </Button>
                </div>
        </>
    );
};

export default ListaTarefas;
