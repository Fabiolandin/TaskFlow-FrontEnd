import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import UsuariosMock, { type UsuarioMock } from "@/usuarios";
import DialogUsuario from "@/components/DialogNewUsuario";

const Usuarios = () => {

    //state para abrir dialog de criação
    const [open, setOpen] = useState(false)

   const [usuarios, setUsuarios] = useState<UsuarioMock[]>(UsuariosMock)

    const deletUsuario = async (id) => {
        try {
            toast.success("Usuário deletado com sucesso")
        } catch (error) {
            toast.error("Usuário não foi deletado")
        }
    }
    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-white">Labels</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2"> cadastradas</p>
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
                        {usuarios.map((usuario) => (
                            <TableRow key={usuario.id} className="border-white/10 hover:bg-[#151A1E]">
                                <TableCell className="font-mono text-zinc-500">#{usuario.id}</TableCell>
                                <TableCell className="font-medium text-white">{usuario.nome}</TableCell>
                                <TableCell className="font-mono text-zinc-400">{usuario.email}</TableCell>
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
                                        id={usuario.id}
                                        titulo={usuario.nome}
                                        descricao="Label de projetos"
                                        funcao={() => deletUsuario(usuario.id)}
                                    />

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>



            <DialogUsuario open={open} onOpenChange={setOpen} />
        </Layout>
    );
};

export default Usuarios;