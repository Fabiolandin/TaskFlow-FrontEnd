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
    onCreateProjeto: (dados: DadosProjeto, idsMembros: number[]) => Promise<boolean>;
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
        const gravou = await onCreateProjeto(montarDadosProjeto({ nome, descricao, idStatus: status, dataInicio }), membrosSelecionados);
        setSalvando(false);
        //falhou: o dialog continua aberto com os campos preenchidos
        if (!gravou) return;
        setNome("");
        setDescricao("");
        setStatus("");
        setDataInicio("");
        setMembrosSelecionados([]);
        onOpenChange(false);
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">Novo Projeto</DialogTitle>
                        <hr className="border-gray-600" />
                    </DialogHeader>
                    <div className="flex flex-col mt-2">
                        <p className="text-gray-400 text-[13px]">Nome do projeto</p>
                        <Input
                            className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10"
                            type="text"
                            placeholder="ex. Taskflow Mobile"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />

                        <p className="text-gray-400 mt-2 text-[13px]">Descrição</p>
                        <Textarea
                            className="text-white bg-[#151A1E] border-[#333B44]"
                            placeholder="Objetivo do projeto"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-row gap-10">

                        <div className="flex flex-col gap-2">
                            <p className="text-gray-400 text-[13px]">Status</p>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-52 h-10! rounded-md bg-[#151A1E] border-[#333B44] text-white">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151A1E] border border-[#333B44] text-white">
                                    <SelectGroup>
                                        {statusOptions.map((item) => (
                                            <SelectItem className="text-gray-400 focus:bg-[#333B44] focus:text-white" key={item.id} value={String(item.id)}>
                                                {item.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-gray-400 text-[13px]">Data de início</p>
                            <Input
                                className="text-gray-400 bg-[#151A1E] border-[#333B44] w-52 h-10"
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                            />
                        </div>

                    </div>
                    <p className="text-gray-400 text-[13px]">Membros</p>
                    <div className="flex flex-row flex-wrap gap-2">
                        {usuarios.map((usuario) => {
                            const selecionado = membrosSelecionados.includes(usuario.id);
                            return (
                                <button
                                    key={usuario.id}
                                    type="button"
                                    aria-pressed={selecionado}
                                    onClick={() => alternarMembro(usuario.id)}
                                    className={`text-[11px] rounded-md border px-2 py-1 cursor-pointer ${selecionado ? "bg-[#333B44] border-white/40 text-white" : "bg-[#151A1E] border-[#333B44] text-gray-400"}`}
                                >
                                    {usuario.nome}
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleCreateProjeto} disabled={!podeCriar}>Criar Projeto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewProjeto;
