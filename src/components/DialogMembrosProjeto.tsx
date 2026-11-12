import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { ApiError } from "@/api/apiClient";
import { fetchUsuarios } from "@/fetchs/fetchUsuarios";
import { addMembro, listarMembros, removeMembro } from "@/fetchs/fetchMembros";
import type { Projeto } from "@/fetchs/fetchProjetos";
import type { Usuario } from "@/pages/usuarios";

interface DialogMembrosProjetoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    //projeto do cartão que abriu o dialog
    projeto: Projeto | null;
}

//a recusa da API mostra a message dela quando é texto; senão, o texto fixo (RF-29)
const motivo = (error: unknown, textoFixo: string) =>
    error instanceof ApiError && error.mensagemDaApi ? error.mensagemDaApi : textoFixo;

//edita os membros de um projeto existente: cada clique grava na hora (SPEC-013, D-4)
const DialogMembrosProjeto = ({ open, onOpenChange, projeto }: DialogMembrosProjetoProps) => {

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [membros, setMembros] = useState<number[]>([]);
    const [carregado, setCarregado] = useState(false);
    //usuários com POST/DELETE em andamento: o chip fica desabilitado até a API responder
    const [pendentes, setPendentes] = useState<number[]>([]);

    //cada abertura começa sem dados, até a API responder (mesmo padrão de DialogNewProjeto)
    const [abertoAntes, setAbertoAntes] = useState(open);
    if (open !== abertoAntes) {
        setAbertoAntes(open);
        if (open) {
            setUsuarios([]);
            setMembros([]);
            setCarregado(false);
            setPendentes([]);
        }
    }

    //usuários e membros atuais lidos a cada abertura, não do cartão, que pode estar velho (D-5)
    const idProjeto = projeto?.id;
    useEffect(() => {
        if (!open || idProjeto === undefined) return;
        let ativo = true;
        Promise.all([fetchUsuarios(), listarMembros(idProjeto)])
            .then(([listaUsuarios, listaMembros]) => {
                if (!ativo) return;
                setUsuarios(listaUsuarios);
                setMembros(listaMembros.map((m) => m.id));
                setCarregado(true);
            })
            .catch(() => { if (ativo) toast.error("Erro ao buscar usuários e membros") });
        return () => { ativo = false };
    }, [open, idProjeto]);

    //o estado do chip só muda se a API aceitou
    const alternarMembro = async (idUsuario: number) => {
        if (idProjeto === undefined || pendentes.includes(idUsuario)) return;
        const eraMembro = membros.includes(idUsuario);
        setPendentes((atual) => [...atual, idUsuario]);
        try {
            if (eraMembro) {
                await removeMembro(idProjeto, idUsuario);
                setMembros((atual) => atual.filter((m) => m !== idUsuario));
                toast.success("Membro removido");
            } else {
                await addMembro(idProjeto, idUsuario);
                setMembros((atual) => [...atual, idUsuario]);
                toast.success("Membro adicionado");
            }
        } catch (error) {
            toast.error(motivo(error, eraMembro ? "Membro não foi removido" : "Membro não foi adicionado"));
        } finally {
            setPendentes((atual) => atual.filter((p) => p !== idUsuario));
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-superficie w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-texto text-[17px]">Membros — {projeto?.nome}</DialogTitle>
                        <DialogDescription className="text-texto-suave text-[13px]">
                            Clique num usuário para adicionar ou remover. Cada clique é gravado na hora.
                        </DialogDescription>
                        <hr className="border-texto-mudo" />
                    </DialogHeader>
                    <div className="flex flex-row flex-wrap gap-2">
                        {!carregado && <span className="text-[11px] text-texto-fraco">Carregando…</span>}
                        {carregado && usuarios.map((usuario) => {
                            const selecionado = membros.includes(usuario.id);
                            const pendente = pendentes.includes(usuario.id);
                            return (
                                <button
                                    key={usuario.id}
                                    type="button"
                                    aria-pressed={selecionado}
                                    disabled={pendente}
                                    onClick={() => alternarMembro(usuario.id)}
                                    className={`text-[11px] rounded-md border px-2 py-1 cursor-pointer disabled:opacity-50 disabled:cursor-wait ${selecionado ? "bg-borda-forte border-texto/40 text-texto" : "bg-elevado border-borda-forte text-texto-suave"}`}
                                >
                                    {usuario.nome}
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter className="bg-superficie">
                        <Button variant="ghost" className="text-texto-suave" onClick={() => onOpenChange(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogMembrosProjeto;
