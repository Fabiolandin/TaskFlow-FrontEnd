import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tarefa } from "@/fetchs/fetchTarefas";
import { formatarDia } from "@/utils/formaters/fdata";

interface ListaTarefasProps {
    tarefas: Tarefa[];
    pagina: number;
    totalPaginas: number;
    onPagina: (pagina: number) => void;
    onAbrir: (tarefa: Tarefa) => void;
    //texto da linha quando não há tarefa
    vazio?: string;
}

//tabela de tarefas + paginação, extraídas de pages/tarefas.tsx para a tela de Tarefas e a de Minhas Tarefas (SPEC-007)
const ListaTarefas = ({ tarefas, pagina, totalPaginas, onPagina, onAbrir, vazio = "Nenhuma tarefa encontrada" }: ListaTarefasProps) => {
    return (
        <>
                <div className="mt-4 rounded-lg border border-white/10 bg-[#0E1012] overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Nome</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Status</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Prioridade</TableHead>
                                <TableHead className="font-mono text-xs uppercase tracking-wide text-zinc-400">Prazo</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Responsável</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Projeto</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Labels</TableHead>
                                <TableHead className="text-right text-xs uppercase tracking-wide text-zinc-400">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tarefas.length === 0 && (
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableCell colSpan={8} className="text-center text-zinc-500">{vazio}</TableCell>
                                </TableRow>
                            )}
                            {tarefas.map((tarefa) => (
                                <TableRow key={tarefa.id} className="border-white/10 hover:bg-[#151A1E]">
                                    <TableCell className="font-medium text-white">{tarefa.nome}</TableCell>
                                    <TableCell className="text-gray-300">
                                        <span className="flex items-center gap-1">
                                            {tarefa.status.cor && <span className="inline-block size-2 rounded-full" style={{ backgroundColor: tarefa.status.cor }} />}
                                            {tarefa.status.nome}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-300">{tarefa.prioridade}</TableCell>
                                    <TableCell className="font-mono text-zinc-400">{formatarDia(tarefa.data_final)}</TableCell>
                                    <TableCell className="text-gray-300">{tarefa.responsavel?.nome ?? "Sem responsável"}</TableCell>
                                    <TableCell className="text-gray-300">{tarefa.projeto.nome}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-row flex-wrap gap-1">
                                            {tarefa.labels.map((label) => (
                                                <span key={label.id} className="text-[11px] text-gray-400 rounded-md bg-[#151A1E] border border-[#333B44] px-2 py-0.5">{label.nome}</span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon-sm" aria-label={`Abrir ${tarefa.nome}`} className="text-zinc-400 hover:text-white" onClick={() => onAbrir(tarefa)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
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
