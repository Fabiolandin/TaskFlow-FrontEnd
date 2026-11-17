import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import LinhaTarefa, { CabecalhoTarefas } from "./LinhaTarefa";
import NoTarefa from "./NoTarefa";
import { contarColunas } from "@/utils/colunasTarefa";
import type { Status } from "@/fetchs/fetchStatus";
import type { DadosEdicaoTarefa, Tarefa } from "@/fetchs/fetchTarefas";

interface ListaTarefasProps {
    tarefas: Tarefa[];
    pagina?: number;
    totalPaginas?: number;
    //sem onPagina, a lista não mostra a paginação (ex.: sub-tarefas)
    onPagina?: (pagina: number) => void;
    //cadastro de status de tarefa: ícones e menu da linha (RF-43, RF-44)
    statusOptions: Status[];
    onTrocar: (id: number, dados: DadosEdicaoTarefa) => void;
    //texto da linha quando não há tarefa
    vazio?: string;
    //false na página do projeto e nas sub-tarefas: a coluna Projeto sai
    mostrarProjeto?: boolean;
    //sem margem de cima (dentro de uma seção recolhível)
    className?: string;
    //árvore: cada tarefa mostra as sub-tarefas logo abaixo, com seta de abrir/fechar; recarga relê as filhas
    arvore?: boolean;
    recarga?: number;
}

//tabela de tarefas + paginação: Tarefas, Minhas Tarefas, página do projeto e sub-tarefas (SPEC-007); a linha é a do RF-44
const ListaTarefas = ({ tarefas, pagina = 1, totalPaginas = 1, onPagina, statusOptions, onTrocar, vazio = "Nenhuma tarefa encontrada", mostrarProjeto = true, className = "mt-4", arvore = false, recarga = 0 }: ListaTarefasProps) => {
    return (
        <>
                {/* abaixo de 768px a tabela rola de lado (o nome não espreme até uma letra); acima, o clip mantém o cabeçalho sticky */}
                <div className={`${className} overflow-x-auto rounded-cartao border border-borda bg-superficie md:overflow-clip`}>
                    <Table containerClassName="overflow-x-visible md:overflow-x-clip" className="min-w-[720px] md:min-w-0">
                        {/* cabeçalho preso no topo da área que rola (RF-72) */}
                        <TableHeader className="sticky -top-6 z-10 bg-cabecalho">
                            <CabecalhoTarefas mostrarProjeto={mostrarProjeto} />
                        </TableHeader>
                        <TableBody>
                            {tarefas.length === 0 && (
                                <TableRow className="border-divisoria hover:bg-transparent">
                                    <TableCell colSpan={contarColunas({ mostrarProjeto })} className="text-center text-texto-fraco">{vazio}</TableCell>
                                </TableRow>
                            )}
                            {tarefas.map((tarefa) => arvore ? (
                                <NoTarefa key={tarefa.id} tarefa={tarefa} nivel={0} statusOptions={statusOptions} onTrocar={onTrocar} mostrarProjeto={mostrarProjeto} recarga={recarga} />
                            ) : (
                                <LinhaTarefa key={tarefa.id} tarefa={tarefa} statusOptions={statusOptions} onTrocar={onTrocar} mostrarProjeto={mostrarProjeto} />
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {onPagina && (
                    <div className="flex flex-row items-center justify-center gap-4 mt-4">
                        <Button variant="ghost" className="text-texto-suave" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
                            Anterior
                        </Button>
                        <p className="text-sm text-texto-suave">Página {pagina} de {totalPaginas}</p>
                        <Button variant="ghost" className="text-texto-suave" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)}>
                            Próxima
                        </Button>
                    </div>
                )}
        </>
    );
};

export default ListaTarefas;
