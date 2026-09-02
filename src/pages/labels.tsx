import DialogNewLabel from "@/components/DialogNewLabel";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import LabelsMock, { type LabelMock } from "@/labels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, PinIcon, XIcon } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { toast } from "sonner";

const Labels = () => {

    //state para abrir dialog de criação
    const [open, setOpen] = useState(false)

    const [labels, setLabels] = useState<LabelMock[]>(LabelsMock)

    const deletLabel = async (id) => {
        try {
            toast.success("Label deletada com sucesso")
        } catch (error) {
            toast.error("Label não foi deletada")
        }
    }

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
                                <TableCell className="font-mono text-zinc-400">{label.createdAt}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white">
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



            <DialogNewLabel open={open} onOpenChange={setOpen} />
        </Layout>
    );
};

export default Labels;