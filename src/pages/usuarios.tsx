import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DialogUsuario from "@/components/DialogNewUsuario";
import { createUsuario, deleteUsuario, fetchUsuarios, updateUsuario } from "@/fetchs/fetchUsuarios";
import DialogDetailsUsuario from "@/components/DialogDetailsUsuario";

export interface Usuario {
    id: number;
    nome: string;
    email: string;
}

const Usuarios = () => {


    //state para abrir dialog de criação
    const [open, setOpen] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)

    //State para receber usuários
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)

    const getDados = async () => {
        try {
            const resposta = await fetchUsuarios()
            setUsuarios(resposta)
        } catch (error) {
            toast.error("Erro ao buscar usuários")
        }
    }

    const criarUsuario = async (nome: string, email: string, senha: string) => {
        try {
            await createUsuario(nome, email, senha)
            toast.success("Usuário criado com sucesso")
            await getDados() // Atualiza a lista de usuários após a criação
        } catch (error) {
            toast.error("Erro ao criar usuário")
            throw error
        }
    }

    const editarUsuario = async (id: number, nome: string, email: string, senha?: string) => {
        try{
            await updateUsuario(id, nome, email, senha)
            toast.success("Usuário atualizado com sucesso")
            await getDados() // Atualiza a lista de usuários após a atualização
        } catch(error){
            toast.error("Erro ao atualizar usuário")
            throw error
        }
    }

    const deletUsuario = async (id: number) => {
        try {
            await deleteUsuario(id)
            toast.success("Usuário deletado com sucesso")
            await getDados() // Atualiza a lista de usuários após a deleção
        } catch (error) {
            toast.error("Usuário não foi deletado")
        }
    }

    //funcao para abrir dialog e mandar usuario selecionado
    const handleDialogOpen = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario);
        setOpenDetails(true);
    }

    useEffect(() => {
        getDados()
    }, [])

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-white">Usuarios</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2"> {usuarios.length} cadastrados</p>
                <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                    Novo Usuário
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
                                    <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white" onClick={() => handleDialogOpen(usuario)}>
                                        <Pencil className="size-4"/>
                                    </Button>

                                    <ConfirmDeleteDialog
                                        trigger={
                                            <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white">
                                                <XIcon size={4} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer" />
                                            </Button>
                                        }
                                        id={usuario.id}
                                        titulo={usuario.nome}
                                        descricao="Usuário"
                                        funcao={() => deletUsuario(usuario.id)}
                                    />

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>



            <DialogUsuario open={open} onOpenChange={setOpen} onCreateUsuario={criarUsuario} />
            <DialogDetailsUsuario open={openDetails} onOpenChange={setOpenDetails} usuarioSelecionado={usuarioSelecionado} onEditUsuario={editarUsuario} />
        </Layout>
    );
};

export default Usuarios;