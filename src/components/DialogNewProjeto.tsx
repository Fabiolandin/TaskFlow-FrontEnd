import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { fetchStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchUsuarios } from "@/fetchs/fetchUsuarios";
import { montarDadosProjeto, type DadosProjeto } from "@/fetchs/fetchProjetos";
import type { Usuario } from "@/pages/usuarios";

interface DialogNewProjetoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    //devolve se o projeto foi gravado; os toasts são da página
    onCreateProjeto: (dados: DadosProjeto) => Promise<boolean>;
}

const DialogNewProjeto = ({ open, onOpenChange, onCreateProjeto }: DialogNewProjetoProps) => {

    //opções vindas da API: status do cadastro e usuários para escolher como membros
    const [statusOptions, setStatusOptions] = useState<Status[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    //campos do formulário
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [status, setStatus] = useState<string>("");
    const [dataInicio, setDataInicio] = useState("");
    const [membrosSelecionados, setMembrosSelecionados] = useState<number[]>([]);
    const [salvando, setSalvando] = useState(false);

    //cada abertura começa vazia (RF-23): zera ao abrir, e não ao fechar, para que Cancelar, ESC e
    //clique fora descartem a seleção, e uma falha ao gravar mantenha os campos com o dialog aberto.
    //Ajuste de estado durante o render (padrão do React para reagir a mudança de prop), não useEffect.
    const [abertoAntes, setAbertoAntes] = useState(open);
    if (open !== abertoAntes) {
        setAbertoAntes(open);
        if (open) {
            setNome("");
            setDescricao("");
            setStatus("");
            setDataInicio("");
            setMembrosSelecionados([]);
        }
    }

    //busca as opções a cada abertura, para refletir status e usuários novos
    useEffect(() => {
        if (!open) return;
        let ativo = true;
        Promise.all([fetchStatus("projeto"), fetchUsuarios()])
            .then(([listaStatus, listaUsuarios]) => {
                if (!ativo) return;
                setStatusOptions(listaStatus);
                setUsuarios(listaUsuarios);
            })
            .catch(() => toast.error("Erro ao buscar status e usuários"));
        return () => { ativo = false };
    }, [open]);

    const alternarMembro = (id: number) => {
        setMembrosSelecionados((atual) => (atual.includes(id) ? atual.filter((m) => m !== id) : [...atual, id]));
    }

    //nome e status são obrigatórios na API; descrição, data e membros, não
    const podeCriar = !!nome.trim() && !!status && !salvando;

    const handleCreateProjeto = async () => {
        if (!podeCriar) return;
        setSalvando(true);
        const dados = montarDadosProjeto({ nome, descricao, idStatus: status, dataInicio });
        if (membrosSelecionados.length) dados.membros = membrosSelecionados;
        const gravou = await onCreateProjeto(dados);
        setSalvando(false);
        //falhou: o dialog continua aberto com os campos preenchidos
        if (gravou) onOpenChange(false);
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-superficie w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-texto text-[17px]">Novo Projeto</DialogTitle>
                        <hr className="border-texto-mudo" />
                    </DialogHeader>
                    <div className="flex flex-col mt-2">
                        <p className="text-texto-suave text-[13px]">Nome do projeto</p>
                        <Input
                            className="text-texto bg-elevado border-borda-forte mb-2 h-10"
                            type="text"
                            placeholder="ex. Taskflow Mobile"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />

                        <p className="text-texto-suave mt-2 text-[13px]">Descrição</p>
                        <Textarea
                            className="text-texto bg-elevado border-borda-forte"
                            placeholder="Objetivo do projeto"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-row gap-10">

                        <div className="flex flex-col gap-2">
                            <p className="text-texto-suave text-[13px]">Status</p>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-52 h-10! rounded-md bg-elevado border-borda-forte text-texto">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent className="bg-elevado border border-borda-forte text-texto">
                                    <SelectGroup>
                                        {statusOptions.map((item) => (
                                            <SelectItem className="text-texto-suave focus:bg-realce focus:text-texto" key={item.id} value={String(item.id)}>
                                                {item.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-texto-suave text-[13px]">Data de início</p>
                            <Input
                                className="text-texto-suave bg-elevado border-borda-forte w-52 h-10"
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                            />
                        </div>

                    </div>
                    <p className="text-texto-suave text-[13px]">Membros</p>
                    <div className="flex flex-row flex-wrap gap-2">
                        {usuarios.map((usuario) => {
                            const selecionado = membrosSelecionados.includes(usuario.id);
                            return (
                                <button
                                    key={usuario.id}
                                    type="button"
                                    aria-pressed={selecionado}
                                    onClick={() => alternarMembro(usuario.id)}
                                    className={`text-[11px] rounded-md border px-2 py-1 cursor-pointer ${selecionado ? "bg-borda-forte border-texto/40 text-texto" : "bg-elevado border-borda-forte text-texto-suave"}`}
                                >
                                    {usuario.nome}
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter className="bg-superficie">
                        <Button variant="ghost" className="text-texto-suave" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleCreateProjeto} disabled={!podeCriar}>Criar Projeto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewProjeto;
