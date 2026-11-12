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
import { ApiError } from "@/api/apiClient";
import { esquecerUsuarioLogado, useUsuarioLogado } from "@/utils/usuarioLogado";

export interface Usuario {
    id: number;
    nome: string;
    email: string;
    //papel (RF-81)
    isAdmin: boolean;
}

//mensagem da API quando ela explica a recusa (403, 409, 400: RF-82, RF-86); senão, o texto fixo
const motivo = (error: unknown, padrao: string) => (error instanceof ApiError && error.mensagemDaApi ? error.mensagemDaApi : padrao);

const Usuarios = () => {
    //o papel do logado decide o que a tela oferece (RF-86); enquanto não sabe, trata como comum
    const eu = useUsuarioLogado();
    const souAdmin = eu?.isAdmin === true;

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

    const criarUsuario = async (nome: string, email: string, senha: string, isAdmin?: boolean) => {
        try {
            await createUsuario(nome, email, senha, isAdmin)
            toast.success("Usuário criado com sucesso")
            await getDados() // Atualiza a lista de usuários após a criação
        } catch (error) {
            //409 (ex.: email já em uso): mostra o motivo vindo da API; qualquer outra falha, o texto fixo
            toast.error(motivo(error, "Erro ao criar usuário"))
            throw error
        }
    }

    const editarUsuario = async (id: number, nome: string, email: string, senha?: string, isAdmin?: boolean) => {
        try{
            await updateUsuario(id, nome, email, senha, isAdmin)
            //a própria conta mudou: o menu relê nome, email e papel
            if (id === eu?.id) esquecerUsuarioLogado(id)
            toast.success("Usuário atualizado com sucesso")
            await getDados() // Atualiza a lista de usuários após a atualização
        } catch(error){
            toast.error(motivo(error, "Erro ao atualizar usuário"))
            throw error
        }
    }

    const deletUsuario = async (id: number) => {
        try {
            await deleteUsuario(id)
            toast.success("Usuário deletado com sucesso")
            await getDados() // Atualiza a lista de usuários após a deleção
        } catch (error) {
            //409 (registro em uso): mostra o motivo vindo da API; qualquer outra falha, o texto fixo (SPEC-002)
            toast.error(motivo(error, "Usuário não foi deletado"))
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
                <h1 className="text-2xl font-bold text-texto">Usuarios</h1>
                <p className="text-sm text-texto-suave mt-2 ml-2"> {usuarios.length} cadastrados</p>
                {/* só admin cria usuário (RF-82, RF-86) */}
                {souAdmin && (
                    <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                        Novo Usuário
                    </Button>
                )}
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
                        {usuarios.map((usuario) => (
                            <TableRow key={usuario.id} className="border-texto/10 hover:bg-elevado">
                                <TableCell className="font-mono text-texto-fraco">#{usuario.id}</TableCell>
                                <TableCell className="font-medium text-texto">
                                    <span className="flex items-center gap-2">
                                        {usuario.nome}
                                        {usuario.isAdmin && <span data-selo-admin className="rounded-badge bg-tom-vermelho-fundo px-1.5 py-[3px] font-mono text-[10px] uppercase leading-none tracking-[.06em] text-tom-vermelho-texto">Admin</span>}
                                    </span>
                                </TableCell>
                                <TableCell className="font-mono text-texto-suave">{usuario.email}</TableCell>
                                <TableCell className="text-right">
                                    {/* admin edita todos; comum, só a própria linha (RF-86) */}
                                    {(souAdmin || usuario.id === eu?.id) && (
                                        <Button variant="ghost" size="icon-sm" aria-label={`Editar ${usuario.nome}`} className="text-texto-suave hover:text-texto" onClick={() => handleDialogOpen(usuario)}>
                                            <Pencil className="size-4"/>
                                        </Button>
                                    )}

                                    {/* só admin exclui, e não a própria conta */}
                                    {souAdmin && usuario.id !== eu?.id && <ConfirmDeleteDialog
                                        trigger={
                                            <Button variant="ghost" size="icon-sm" className="text-texto-suave hover:text-texto">
                                                <XIcon size={4} className="text-tom-vermelho-texto hover:text-marca transition-colors cursor-pointer" />
                                            </Button>
                                        }
                                        id={usuario.id}
                                        titulo={usuario.nome}
                                        descricao="Usuário"
                                        funcao={() => deletUsuario(usuario.id)}
                                    />}

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>



            <DialogUsuario open={open} onOpenChange={setOpen} onCreateUsuario={criarUsuario} mostrarAdmin={souAdmin} />
            <DialogDetailsUsuario open={openDetails} onOpenChange={setOpenDetails} usuarioSelecionado={usuarioSelecionado} onEditUsuario={editarUsuario} mostrarAdmin={souAdmin} />
        </Layout>
    );
};

export default Usuarios;