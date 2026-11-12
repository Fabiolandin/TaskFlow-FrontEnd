import DialogNewLabel from "@/components/DialogNewLabel";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, XIcon } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { toast } from "sonner";
import { createLabel, deleteLabel, fetchLabels, updateLabel } from "@/fetchs/fetchLabel";
import DialogDetailsLabel from "@/components/DialogDetailsLabel";
import ChipLabel from "@/components/ChipLabel";
import { formatarData } from "@/utils/formaters/fdata";
import { ApiError } from "@/api/apiClient";

export interface Label {
    id: number;
    nome: string;
    //#RRGGBB ou null (RF-76)
    cor: string | null;
    createdAt: string;
}

const Labels = () => {

    //state para abrir dialog de criação
    const [open, setOpen] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)

    //state para receber as labels
    const [labels, setLabels] = useState<Label[]>([])
    const [labelSelecionada, setLabelSelecionada] = useState<Label | null>(null)

    const getDados = async () => {
        try{
            const resposta = await fetchLabels()
            setLabels(resposta)
            console.log(resposta)
        }catch (error) {
            toast.error("Erro ao buscar Labels")
        }
    }

    const criarLabel = async (nome: string, cor: string) => {
        try{
            await createLabel(nome, cor)
            toast.success("Label criada com sucesso!")
            await getDados()
        } catch(error) {
            toast.error("Erro ao criar label")
            throw error
        }
    }

    const editarLabel = async (id: number, nome: string, cor: string) => {
        try{
            await updateLabel(id, nome, cor)
            toast.success("Label editada com sucesso")
            await getDados()
        } catch(error) {
            toast.error("Erro ao editar label")
            throw error
        }
    }

    const deletLabel = async (id: number) => {
        try {
            await deleteLabel(id)
            toast.success("Label deletada com sucesso")
            await getDados() // atualiza a lista após deleção
        } catch (error) {
            //409 (registro em uso): mostra o motivo vindo da API; qualquer outra falha, o texto fixo (SPEC-002)
            toast.error(error instanceof ApiError && error.status === 409 && error.mensagemDaApi ? error.mensagemDaApi : "Label não foi deletada")
        }
    }

    //funcao para abrir o dialog e mandar label selecionada
    const handleDialogOpen = (label: Label) => {
        setLabelSelecionada(label);
        setOpenDetails(true)
    }

    useEffect(() => {
        getDados()
    }, [])

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-texto">Labels</h1>
                <p className="text-sm text-texto-suave mt-2 ml-2"> {labels.length} cadastrados</p>
                <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                    Nova Label
                </Button>
            </div>
            <div className="mt-4 rounded-lg border border-texto/10 bg-superficie overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-texto/10 hover:bg-transparent">
                            <TableHead className="w-[100px] font-mono text-xs uppercase tracking-wide text-texto-suave">ID</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-texto-suave">Nome</TableHead>
                            <TableHead className="font-mono text-xs uppercase tracking-wide text-texto-suave">Criada em</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide text-texto-suave">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {labels.map((label) => (
                            <TableRow key={label.id} className="border-texto/10 hover:bg-elevado">
                                <TableCell className="font-mono text-texto-fraco">#{label.id}</TableCell>
                                <TableCell className="font-medium text-texto">
                                    <span className="flex items-center gap-2">
                                        {/* amostra da cor (RF-76); sem cor, o anel tracejado */}
                                        <span data-amostra className={`size-3 shrink-0 rounded-full ${label.cor ? "" : "border border-dashed border-borda-forte"}`} style={label.cor ? { background: label.cor } : undefined} title={label.cor ?? "Sem cor"} />
                                        <ChipLabel label={label} />
                                    </span>
                                </TableCell>
                                <TableCell className="font-mono text-texto-suave">{formatarData(label.createdAt)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon-sm" className="text-texto-suave hover:text-texto" onClick={() => handleDialogOpen(label)}>
                                        <Pencil className="size-4" />
                                    </Button>

                                    <ConfirmDeleteDialog
                                        trigger={
                                            <Button variant="ghost" size="icon-sm" className="text-texto-suave hover:text-texto">
                                                <XIcon size={4} className="text-tom-vermelho-texto hover:text-marca transition-colors cursor-pointer" />
                                            </Button>
                                        }
                                        id={label.id}
                                        titulo={label.nome}
                                        descricao="Label de projetos"
                                        funcao={() => deletLabel(label.id)}
                                    />

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>



            <DialogNewLabel open={open} onOpenChange={setOpen} onCreateLabel={criarLabel}/>
            <DialogDetailsLabel open={openDetails} onOpenChange={setOpenDetails} labelSelecionada={labelSelecionada} onEditLabel={editarLabel}/>
        </Layout>
    );
};

export default Labels;