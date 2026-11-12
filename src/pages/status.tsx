import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type DragEvent, type KeyboardEvent } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GripVertical, Pencil, XIcon } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { toast } from "sonner";
import { createStatus, deleteStatus, fetchStatus, reordenarStatus, updateStatus } from "@/fetchs/fetchStatus";
import type { DadosStatus, Status as StatusItem, TipoStatus } from "@/fetchs/fetchStatus";
import DialogNewStatus from "@/components/DialogNewStatus";
import DialogDetailsStatus from "@/components/DialogDetailsStatus";
import { ApiError, comMotivo } from "@/api/apiClient";

//move o item `de` para a posição `para`, sem mexer na lista original
const mover = <T,>(lista: T[], de: number, para: number) => {
    const nova = [...lista];
    const [item] = nova.splice(de, 1);
    nova.splice(para, 0, item);
    return nova;
};
const mesmaOrdem = (a: StatusItem[], b: StatusItem[]) => a.length === b.length && a.every((s, i) => s.id === b[i].id);

//o tipo vem da rota: /status/tarefa ou /status/projeto, sem abas (RF-42, SPEC-015)
const Status = ({ tipo }: { tipo: TipoStatus }) => {

    //states para abrir os dialogs
    const [open, setOpen] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    //muda a cada abertura do dialog de edição, para ele recarregar os campos
    const [aberturaDetalhes, setAberturaDetalhes] = useState(0)

    //lista do cadastro da rota, na ordem que a API devolve (por `ordem`)
    const [statusDaAba, setStatusDaAba] = useState<StatusItem[]>([])
    const [statusSelecionado, setStatusSelecionado] = useState<StatusItem | null>(null)
    //arrastar (RF-63): a lista na tela muda enquanto arrasta; ao soltar, compara com a gravada e grava
    const [arrastando, setArrastando] = useState<number | null>(null)
    const [gravada, setGravada] = useState<StatusItem[]>([])

    const rotuloDaAba = tipo === "projeto" ? "de projeto" : "de tarefa"

    const getDados = async () => {
        try {
            const resposta = await fetchStatus(tipo)
            setStatusDaAba(resposta)
            setGravada(resposta)
        } catch {
            toast.error("Erro ao buscar status")
        }
    }

    const criarStatus = async (dados: DadosStatus) => {
        try {
            await createStatus(tipo, dados)
            toast.success("Status criado com sucesso!")
            await getDados()
        } catch (error) {
            toast.error("Erro ao criar status")
            throw error
        }
    }

    const editarStatus = async (id: number, dados: DadosStatus) => {
        try {
            await updateStatus(tipo, id, dados)
            toast.success("Status editado com sucesso")
            await getDados()
        } catch (error) {
            toast.error("Erro ao editar status")
            throw error
        }
    }

    const deletStatus = async (id: number) => {
        try {
            await deleteStatus(tipo, id)
            toast.success("Status deletado com sucesso")
            await getDados()
        } catch (error) {
            //409 (status em uso): mostra o motivo vindo da API; qualquer outra falha, o texto fixo
            toast.error(error instanceof ApiError && error.status === 409 && error.mensagemDaApi ? error.mensagemDaApi : "Status não foi deletado")
        }
    }

    //grava a ordem inteira (RF-62); a falha avisa e a lista volta à ordem gravada
    const gravarOrdem = async (nova: StatusItem[]) => {
        if (mesmaOrdem(nova, gravada)) return
        setStatusDaAba(nova)
        try {
            const resposta = await reordenarStatus(tipo, nova.map((s) => s.id))
            setStatusDaAba(resposta)
            setGravada(resposta)
        } catch (error) {
            toast.error(comMotivo("Não foi possível salvar a ordem", error))
            setStatusDaAba(gravada)
        }
    }

    const comecarArrastar = (e: DragEvent, id: number) => {
        setArrastando(id)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", String(id))
        const linha = (e.currentTarget as HTMLElement).closest("tr")
        if (linha) e.dataTransfer.setDragImage(linha, 16, 16)
    }

    //passando sobre outra linha, a arrastada toma o lugar dela na tela
    const passarSobre = (e: DragEvent, alvo: number) => {
        if (arrastando === null) return
        e.preventDefault()
        if (alvo === arrastando) return
        const de = statusDaAba.findIndex((s) => s.id === arrastando)
        const para = statusDaAba.findIndex((s) => s.id === alvo)
        setStatusDaAba(mover(statusDaAba, de, para))
    }

    const soltar = () => {
        if (arrastando === null) return
        setArrastando(null)
        gravarOrdem(statusDaAba)
    }

    //teclado na alça: ↑/↓ move uma posição e grava; o foco segue a alça
    const teclarNaAlca = async (e: KeyboardEvent, id: number) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
        e.preventDefault()
        const de = statusDaAba.findIndex((s) => s.id === id)
        const para = e.key === "ArrowUp" ? de - 1 : de + 1
        if (para < 0 || para >= statusDaAba.length) return
        await gravarOrdem(mover(statusDaAba, de, para))
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-alca="${id}"]`)?.focus())
    }

    //funcao para abrir o dialog de edição com o status selecionado
    const handleDialogOpen = (status: StatusItem) => {
        setStatusSelecionado(status)
        setAberturaDetalhes((n) => n + 1)
        setOpenDetails(true)
    }

    //carrega o cadastro da rota no mount
    useEffect(() => {
        let ativo = true
        fetchStatus(tipo)
            .then((lista) => {
                if (ativo) {
                    setStatusDaAba(lista)
                    setGravada(lista)
                }
            })
            .catch(() => toast.error("Erro ao buscar status"))
        return () => { ativo = false }
    }, [tipo])

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-white">Status {rotuloDaAba}</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2"> {statusDaAba.length} cadastrados</p>
                <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                    Novo Status
                </Button>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-[#0E1012] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="w-10"><span className="sr-only">Reordenar</span></TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Nome</TableHead>
                            <TableHead className="font-mono text-xs uppercase tracking-wide text-zinc-400">Cor</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Encerrado</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide text-zinc-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {statusDaAba.map((status) => (
                            <TableRow key={status.id} data-status-id={status.id}
                                onDragOver={(e) => passarSobre(e, status.id)} onDrop={(e) => { e.preventDefault(); soltar() }}
                                className={`border-white/10 hover:bg-[#151A1E] ${arrastando === status.id ? "opacity-50" : ""}`}>
                                <TableCell className="w-10 py-1">
                                    <button type="button" draggable data-alca={status.id}
                                        aria-label="Arrastar para reordenar" title="Arraste, ou use ↑/↓"
                                        onDragStart={(e) => comecarArrastar(e, status.id)} onDragEnd={soltar}
                                        onKeyDown={(e) => teclarNaAlca(e, status.id)}
                                        className="flex size-7 cursor-grab items-center justify-center rounded text-zinc-500 outline-none hover:bg-white/5 hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-[#3A3F45] active:cursor-grabbing">
                                        <GripVertical aria-hidden="true" className="size-4" />
                                    </button>
                                </TableCell>
                                <TableCell className="font-medium text-white">{status.nome}</TableCell>
                                <TableCell className="font-mono text-zinc-400">
                                    {status.cor ? (
                                        <span className="flex items-center gap-2">
                                            <span className="inline-block size-3 rounded-full border border-white/10" style={{ backgroundColor: status.cor }} />
                                            {status.cor}
                                        </span>
                                    ) : "—"}
                                </TableCell>
                                <TableCell className="text-zinc-400">{status.isFinal ? "Sim" : "—"}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white" onClick={() => handleDialogOpen(status)}>
                                        <Pencil className="size-4" />
                                    </Button>

                                    <ConfirmDeleteDialog
                                        trigger={
                                            <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white">
                                                <XIcon size={4} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer" />
                                            </Button>
                                        }
                                        id={status.id}
                                        titulo={status.nome}
                                        descricao={`status ${rotuloDaAba}`}
                                        funcao={() => deletStatus(status.id)}
                                    />

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <DialogNewStatus open={open} onOpenChange={setOpen} titulo={`Novo status ${rotuloDaAba}`} onCreateStatus={criarStatus}/>
            <DialogDetailsStatus key={aberturaDetalhes} open={openDetails} onOpenChange={setOpenDetails} statusSelecionado={statusSelecionado} onEditStatus={editarStatus}/>
        </Layout>
    );
};

export default Status;
