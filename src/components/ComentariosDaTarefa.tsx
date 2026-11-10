import { useEffect, useState } from "react";
import { Pencil, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { Textarea } from "./ui/textarea";
import { comMotivo } from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import { createComentario, deleteComentario, fetchComentariosDaTarefa, foiEditado, updateComentario, type Comentario } from "@/fetchs/fetchComentarios";
import { formatarDataHora } from "@/utils/formaters/fdata";
import { dataRelativa } from "@/utils/dataRelativa";

//comentários da tarefa (SPEC-007; na página da tarefa desde a SPEC-015): lista crescente, composer no fim, ações próprias
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
        <section className="flex flex-col gap-4 border-t border-[#1C1F23] pt-5" aria-label="Comentários">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[.12em] text-[#6E7379]">Comentários</h2>

            {comentarios !== null && comentarios.length === 0 && (
                <p className="text-[12.5px] text-[#61666C]">Nenhum comentário ainda</p>
            )}

            {(comentarios ?? []).map((c) => (
                <div key={c.id} data-testid="comentario" className="group flex flex-row gap-3">
                    <span data-avatar aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#232B3B] font-mono text-[11px] font-medium text-[#9BB8F0]">
                        {c.autor.nome.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-row items-center gap-2">
                            <span data-autor className="text-[13px] font-medium text-[#E7E4DF]">{c.autor.nome}</span>
                            <time dateTime={c.createdAt} title={formatarDataHora(c.createdAt)} className="text-[12px] text-[#7C8189]">{dataRelativa(c.createdAt)}</time>
                            {foiEditado(c) && <span className="text-[12px] text-[#61666C]">editado</span>}
                            <span className="ml-auto flex flex-row opacity-60 group-hover:opacity-100">
                                {usuario?.id === c.idUsuario && (
                                    <Button variant="ghost" size="icon-sm" aria-label="Editar comentário" className="text-zinc-400 hover:text-white"
                                        onClick={() => { setEditandoId(c.id); setTextoEdicao(c.comentario); }}>
                                        <Pencil className="size-3.5" />
                                    </Button>
                                )}
                                <ConfirmDeleteDialog
                                    trigger={
                                        <Button variant="ghost" size="icon-sm" aria-label="Excluir comentário" className="text-zinc-400 hover:text-white">
                                            <XIcon className="size-3.5 text-red-400" />
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
                                <Textarea aria-label="Editar texto do comentário" value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} className="border-[#24272B] bg-[#121518] text-[12.5px] text-[#E7E4DF]" />
                                <div className="flex flex-row justify-end gap-2">
                                    <Button variant="ghost" className="text-gray-400" onClick={() => setEditandoId(null)}>Cancelar</Button>
                                    <Button variant="destructive" disabled={!textoEdicao.trim()} onClick={() => salvarEdicao(c.id)}>Salvar comentário</Button>
                                </div>
                            </div>
                        ) : (
                            <p data-texto className="mt-0.5 whitespace-pre-wrap break-words text-[12.5px] leading-[1.6] text-[#B8B4AD]">{c.comentario}</p>
                        )}
                    </div>
                </div>
            ))}

            <div className="flex flex-col gap-2">
                <Textarea aria-label="Novo comentário" placeholder="Escreva um comentário" value={novo} onChange={(e) => setNovo(e.target.value)} className="min-h-16 border-[#24272B] bg-[#121518] text-[12.5px] text-[#E7E4DF]" />
                <Button variant="destructive" className="self-end" disabled={!novo.trim() || enviando} onClick={comentar}>Comentar</Button>
            </div>
        </section>
    )
}

export default ComentariosDaTarefa;
