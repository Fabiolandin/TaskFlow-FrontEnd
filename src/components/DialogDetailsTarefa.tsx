import { useEffect, useState } from "react";
import { Pencil, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { FormularioTarefa, type OpcoesTarefa } from "./DialogNewTarefa";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { Textarea } from "./ui/textarea";
import { comMotivo } from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import { createComentario, deleteComentario, fetchComentariosDaTarefa, foiEditado, updateComentario, type Comentario } from "@/fetchs/fetchComentarios";
import { formatarDataHora } from "@/utils/formaters/fdata";
import { camposDaTarefa, montarDadosEdicaoTarefa, type CamposTarefa, type DadosEdicaoTarefa, type Tarefa } from "@/fetchs/fetchTarefas";

interface DialogDetailsTarefaProps extends OpcoesTarefa {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tarefaSelecionada: Tarefa | null;
    //devolve se gravou; os toasts são da página
    onEditTarefa: (id: number, dados: DadosEdicaoTarefa) => Promise<boolean>;
}

//seção de comentários da tarefa (SPEC-007): lista crescente, composer no fim, ações próprias; não mexe no Salvar da tarefa
const ComentariosDaTarefa = ({ idTarefa }: { idTarefa: number }) => {
    const { usuario } = useAuth();
    const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
    const [novo, setNovo] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [textoEdicao, setTextoEdicao] = useState("");

    useEffect(() => {
        let ativo = true;
        fetchComentariosDaTarefa(idTarefa)
            .then((lista) => { if (ativo) setComentarios(lista) })
            .catch((error) => {
                if (ativo) setComentarios([]);
                toast.error(comMotivo("Erro ao buscar comentários", error));
            });
        return () => { ativo = false };
    }, [idTarefa]);

    const comentar = async () => {
        const texto = novo.trim();
        if (!texto || enviando) return;
        setEnviando(true);
        try {
            const criado = await createComentario(idTarefa, texto);
            setComentarios((lista) => [...(lista ?? []), criado]);
            setNovo("");
        } catch (error) {
            toast.error(comMotivo("Erro ao comentar", error));
        }
        setEnviando(false);
    }

    const salvarEdicao = async (id: number) => {
        const texto = textoEdicao.trim();
        if (!texto) return;
        try {
            const editado = await updateComentario(id, texto);
            setComentarios((lista) => (lista ?? []).map((c) => (c.id === id ? editado : c)));
            setEditandoId(null);
        } catch (error) {
            toast.error(comMotivo("Erro ao editar comentário", error));
        }
    }

    const excluir = async (id: number) => {
        try {
            await deleteComentario(id);
            setComentarios((lista) => (lista ?? []).filter((c) => c.id !== id));
        } catch (error) {
            toast.error(comMotivo("Erro ao excluir comentário", error));
        }
    }

    return (
        <section className="flex flex-col gap-3" aria-label="Comentários">
            <hr className="border-gray-600" />
            <h2 className="text-white text-[15px] font-semibold">Comentários</h2>

            {comentarios !== null && comentarios.length === 0 && (
                <p className="text-sm text-zinc-500">Nenhum comentário ainda</p>
            )}

            {(comentarios ?? []).map((c) => (
                <div key={c.id} data-testid="comentario" className="flex flex-row gap-3">
                    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#333B44] text-sm font-semibold text-white">
                        {c.autor.nome.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-row items-center gap-2">
                            <span className="text-sm font-medium text-white">{c.autor.nome}</span>
                            <span className="text-xs text-zinc-500">{formatarDataHora(c.createdAt)}</span>
                            {foiEditado(c) && <span className="text-xs text-zinc-500">editado</span>}
                            <span className="ml-auto flex flex-row">
                                {usuario?.id === c.idUsuario && (
                                    <Button variant="ghost" size="icon-sm" aria-label="Editar comentário" className="text-zinc-400 hover:text-white"
                                        onClick={() => { setEditandoId(c.id); setTextoEdicao(c.comentario); }}>
                                        <Pencil className="size-4" />
                                    </Button>
                                )}
                                <ConfirmDeleteDialog
                                    trigger={
                                        <Button variant="ghost" size="icon-sm" aria-label="Excluir comentário" className="text-zinc-400 hover:text-white">
                                            <XIcon className="size-4 text-red-400" />
                                        </Button>
                                    }
                                    id={c.id}
                                    titulo={`comentário de ${c.autor.nome}`}
                                    descricao="comentário"
                                    funcao={() => excluir(c.id)}
                                />
                            </span>
                        </div>
                        {editandoId === c.id ? (
                            <div className="mt-1 flex flex-col gap-2">
                                <Textarea aria-label="Editar texto do comentário" value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} className="bg-[#151A1E] border-[#333B44] text-white" />
                                <div className="flex flex-row justify-end gap-2">
                                    <Button variant="ghost" className="text-gray-400" onClick={() => setEditandoId(null)}>Cancelar</Button>
                                    <Button variant="destructive" disabled={!textoEdicao.trim()} onClick={() => salvarEdicao(c.id)}>Salvar comentário</Button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-300">{c.comentario}</p>
                        )}
                    </div>
                </div>
            ))}

            <div className="flex flex-col gap-2">
                <Textarea aria-label="Novo comentário" placeholder="Escreva um comentário" value={novo} onChange={(e) => setNovo(e.target.value)} className="bg-[#151A1E] border-[#333B44] text-white" />
                <Button variant="destructive" className="self-end" disabled={!novo.trim() || enviando} onClick={comentar}>Comentar</Button>
            </div>
        </section>
    )
}

//a página monta este dialog com `key` nova a cada abertura: os campos nascem da tarefa selecionada
const DialogDetailsTarefa = ({ open, onOpenChange, tarefaSelecionada, onEditTarefa, ...opcoes }: DialogDetailsTarefaProps) => {
    const [campos, setCampos] = useState<CamposTarefa | null>(tarefaSelecionada ? camposDaTarefa(tarefaSelecionada) : null);
    const [salvando, setSalvando] = useState(false);

    //nome, status e prioridade são obrigatórios; o projeto já vem da tarefa
    const valido = !!campos && !!campos.nome.trim() && !!campos.idStatus && !!campos.prioridade && !salvando;

    const handleSubmit = async () => {
        if (!tarefaSelecionada || !campos || !valido) return;
        setSalvando(true);
        const gravou = await onEditTarefa(tarefaSelecionada.id, montarDadosEdicaoTarefa(campos));
        setSalvando(false);
        //falhou: o dialog continua aberto para corrigir
        if (gravou) onOpenChange(false);
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[560px] max-h-[90vh] overflow-y-auto flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">{tarefaSelecionada?.nome}</DialogTitle>
                        <hr className="border-gray-600" />
                    </DialogHeader>

                    {campos && (
                        <FormularioTarefa campos={campos} onChange={(p) => setCampos((c) => (c ? { ...c, ...p } : c))} projetoFixo {...opcoes} />
                    )}

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleSubmit} disabled={!valido}>Salvar</Button>
                    </DialogFooter>

                    {tarefaSelecionada && <ComentariosDaTarefa idTarefa={tarefaSelecionada.id} />}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogDetailsTarefa;
