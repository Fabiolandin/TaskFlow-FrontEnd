import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, XIcon } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { toast } from "sonner";
import { createStatus, deleteStatus, fetchStatus, updateStatus } from "@/fetchs/fetchStatus";
import type { DadosStatus, Status as StatusItem, TipoStatus } from "@/fetchs/fetchStatus";
import DialogNewStatus from "@/components/DialogNewStatus";
import DialogDetailsStatus from "@/components/DialogDetailsStatus";
import { ApiError } from "@/api/apiClient";

const ABAS: { tipo: TipoStatus; rotulo: string }[] = [
    { tipo: "projeto", rotulo: "Projeto" },
    { tipo: "tarefa", rotulo: "Tarefa" },
];

const Status = () => {

    //aba ativa: status de projeto ou de tarefa (SPEC-003b, D-1)
    const [aba, setAba] = useState<TipoStatus>("projeto")

    //states para abrir os dialogs
    const [open, setOpen] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    //muda a cada abertura do dialog de edição, para ele recarregar os campos
    const [aberturaDetalhes, setAberturaDetalhes] = useState(0)

    //listas dos dois cadastros, na ordem que a API devolve (por `ordem`)
    const [listas, setListas] = useState<Record<TipoStatus, StatusItem[]>>({ projeto: [], tarefa: [] })
    const [statusSelecionado, setStatusSelecionado] = useState<StatusItem | null>(null)

    const statusDaAba = listas[aba]
    const rotuloDaAba = aba === "projeto" ? "de projeto" : "de tarefa"

    const getDados = async (tipo: TipoStatus) => {
        try {
            const resposta = await fetchStatus(tipo)
            setListas((atual) => ({ ...atual, [tipo]: resposta }))
        } catch {
            toast.error("Erro ao buscar status")
        }
    }

    const criarStatus = async (dados: DadosStatus) => {
        try {
            await createStatus(aba, dados)
            toast.success("Status criado com sucesso!")
            await getDados(aba)
        } catch (error) {
            toast.error("Erro ao criar status")
            throw error
        }
    }

    const editarStatus = async (id: number, dados: DadosStatus) => {
        try {
            await updateStatus(aba, id, dados)
            toast.success("Status editado com sucesso")
            await getDados(aba)
        } catch (error) {
            toast.error("Erro ao editar status")
            throw error
        }
    }

    const deletStatus = async (id: number) => {
        try {
            await deleteStatus(aba, id)
            toast.success("Status deletado com sucesso")
            await getDados(aba)
        } catch (error) {
            //409 (status em uso): mostra o motivo vindo da API; qualquer outra falha, o texto fixo
            toast.error(error instanceof ApiError && error.status === 409 && error.mensagemDaApi ? error.mensagemDaApi : "Status não foi deletado")
        }
    }

    //funcao para abrir o dialog de edição com o status selecionado
    const handleDialogOpen = (status: StatusItem) => {
        setStatusSelecionado(status)
        setAberturaDetalhes((n) => n + 1)
        setOpenDetails(true)
    }

    //carrega os dois cadastros no mount
    useEffect(() => {
        let ativo = true
        Promise.all([fetchStatus("projeto"), fetchStatus("tarefa")])
            .then(([projeto, tarefa]) => {
                if (ativo) setListas({ projeto, tarefa })
            })
            .catch(() => toast.error("Erro ao buscar status"))
        return () => { ativo = false }
    }, [])

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-white">Status</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2"> {statusDaAba.length} cadastrados</p>
                <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                    Novo Status
                </Button>
            </div>

            <div className="mt-4 flex flex-row gap-2">
                {ABAS.map(({ tipo, rotulo }) => (
                    <Button
                        key={tipo}
                        variant="ghost"
                        className={aba === tipo ? "bg-[#151A1E] text-white" : "text-zinc-400 hover:text-white"}
                        onClick={() => setAba(tipo)}
                    >
                        {rotulo} ({listas[tipo].length})
                    </Button>
                ))}
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-[#0E1012] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="w-[100px] font-mono text-xs uppercase tracking-wide text-zinc-400">Ordem</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Nome</TableHead>
                            <TableHead className="font-mono text-xs uppercase tracking-wide text-zinc-400">Cor</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Encerrado</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide text-zinc-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {statusDaAba.map((status) => (
                            <TableRow key={status.id} className="border-white/10 hover:bg-[#151A1E]">
                                <TableCell className="font-mono text-zinc-500">{status.ordem}</TableCell>
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
