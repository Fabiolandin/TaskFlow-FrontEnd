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
import { formatarData } from "@/utils/formaters/fdata";

export interface Label {
    id: number;
    nome: string;
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

    const criarLabel = async (nome: string) => {
        try{
            await createLabel(nome)
            toast.success("Label criada com sucesso!")
            await getDados()
        } catch(error) {
            toast.error("Erro ao criar label")
            throw error
        }
    }

    const editarLabel = async (id: number, nome: string) => {
        try{
            await updateLabel(id, nome)
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
            toast.error("Label não foi deletada")
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
                <h1 className="text-2xl font-bold text-white">Labels</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2"> {labels.length} cadastrados</p>
                <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                    Nova Label
                </Button>
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-[#0E1012] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="w-[100px] font-mono text-xs uppercase tracking-wide text-zinc-400">ID</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-zinc-400">Nome</TableHead>
                            <TableHead className="font-mono text-xs uppercase tracking-wide text-zinc-400">Criada em</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide text-zinc-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {labels.map((label) => (
                            <TableRow key={label.id} className="border-white/10 hover:bg-[#151A1E]">
                                <TableCell className="font-mono text-zinc-500">#{label.id}</TableCell>
                                <TableCell className="font-medium text-white">{label.nome}</TableCell>
                                <TableCell className="font-mono text-zinc-400">{formatarData(label.createdAt)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white" onClick={() => handleDialogOpen(label)}>
                                        <Pencil className="size-4" />
                                    </Button>

                                    <ConfirmDeleteDialog
                                        trigger={
                                            <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white">
                                                <XIcon size={4} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer" />
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