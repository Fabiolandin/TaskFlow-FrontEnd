import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Status } from "@/fetchs/fetchStatus";
import type { Projeto } from "@/fetchs/fetchProjetos";
import type { Label } from "@/pages/labels";
import { AVISO_PRAZO, CAMPOS_VAZIOS, montarDadosNovaTarefa, prazoAntesDoInicio, PRIORIDADES, type CamposTarefa, type DadosNovaTarefa } from "@/fetchs/fetchTarefas";

//opções vindas da página (carregadas uma vez do cadastro)
export interface OpcoesTarefa {
    projetos: Projeto[];
    statusOptions: Status[];
    labels: Label[];
}

const SEM_RESPONSAVEL = "sem-responsavel";
const estiloSelect = "w-full h-10! rounded-md bg-[#151A1E] border-[#333B44] text-white";
const estiloItem = "text-gray-400 focus:bg-[#333B44] focus:text-white";

interface FormularioTarefaProps extends OpcoesTarefa {
    campos: CamposTarefa;
    onChange: (parcial: Partial<CamposTarefa>) => void;
}

//campos do dialog de criar tarefa (a edição é na página da tarefa desde a SPEC-015)
export const FormularioTarefa = ({ campos, onChange, projetos, statusOptions, labels }: FormularioTarefaProps) => {
    //responsável só entre os membros do projeto escolhido (RF-26)
    const membros = projetos.find((p) => String(p.id) === campos.idProjeto)?.membros ?? [];

    const alternarLabel = (id: number) => {
        onChange({ labelIds: campos.labelIds.includes(id) ? campos.labelIds.filter((l) => l !== id) : [...campos.labelIds, id] });
    }

    return (
        <div className="flex flex-col gap-2 mt-2">
            <p className="text-gray-400 text-[13px]">Nome da tarefa</p>
            <Input
                aria-label="Nome da tarefa"
                className="text-white bg-[#151A1E] border-[#333B44] h-10"
                type="text"
                placeholder="ex. Ajustar tela de login"
                value={campos.nome}
                onChange={(e) => onChange({ nome: e.target.value })}
            />

            <p className="text-gray-400 text-[13px]">Descrição</p>
            <Textarea
                aria-label="Descrição"
                className="text-white bg-[#151A1E] border-[#333B44]"
                placeholder="Detalhes da tarefa"
                value={campos.descricao}
                onChange={(e) => onChange({ descricao: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Projeto</p>
                    <Select value={campos.idProjeto} onValueChange={(v) => onChange({ idProjeto: v, idUsuarioResponsavel: "" })}>
                        <SelectTrigger aria-label="Projeto" className={estiloSelect}>
                            <SelectValue placeholder="Selecione o projeto" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#151A1E] border border-[#333B44] text-white">
                            <SelectGroup>
                                {projetos.map((p) => (
                                    <SelectItem className={estiloItem} key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Responsável</p>
                    <Select
                        value={campos.idUsuarioResponsavel || SEM_RESPONSAVEL}
                        onValueChange={(v) => onChange({ idUsuarioResponsavel: v === SEM_RESPONSAVEL ? "" : v })}
                        disabled={!campos.idProjeto}
                    >
                        <SelectTrigger aria-label="Responsável" className={estiloSelect}>
                            <SelectValue placeholder="Sem responsável" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#151A1E] border border-[#333B44] text-white">
                            <SelectGroup>
                                <SelectItem className={estiloItem} value={SEM_RESPONSAVEL}>Sem responsável</SelectItem>
                                {membros.map((m) => (
                                    <SelectItem className={estiloItem} key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {campos.idProjeto && membros.length === 0 && (
                        <p className="text-[12px] text-zinc-500">Este projeto não tem membros</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Status</p>
                    <Select value={campos.idStatus} onValueChange={(v) => onChange({ idStatus: v })}>
                        <SelectTrigger aria-label="Status" className={estiloSelect}>
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#151A1E] border border-[#333B44] text-white">
                            <SelectGroup>
                                {statusOptions.map((s) => (
                                    <SelectItem className={estiloItem} key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Prioridade</p>
                    <Select value={campos.prioridade} onValueChange={(v) => onChange({ prioridade: v })}>
                        <SelectTrigger aria-label="Prioridade" className={estiloSelect}>
                            <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#151A1E] border border-[#333B44] text-white">
                            <SelectGroup>
                                {PRIORIDADES.map((p) => (
                                    <SelectItem className={estiloItem} key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Data de início</p>
                    <Input
                        aria-label="Data de início"
                        className="text-gray-400 bg-[#151A1E] border-[#333B44] h-10"
                        type="date"
                        value={campos.dataInicio}
                        onChange={(e) => onChange({ dataInicio: e.target.value })}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Prazo</p>
                    <Input
                        aria-label="Prazo"
                        className="text-gray-400 bg-[#151A1E] border-[#333B44] h-10"
                        type="date"
                        value={campos.dataFinal}
                        onChange={(e) => onChange({ dataFinal: e.target.value })}
                    />
                </div>
            </div>
            {prazoAntesDoInicio(campos.dataInicio, campos.dataFinal) && (
                <p className="text-red-400 text-[12px]">{AVISO_PRAZO}</p>
            )}

            <p className="text-gray-400 text-[13px]">Labels</p>
            <div className="flex flex-row flex-wrap gap-2">
                {labels.length === 0 && <span className="text-[12px] text-zinc-500">Nenhuma label cadastrada</span>}
                {labels.map((label) => {
                    const selecionada = campos.labelIds.includes(label.id);
                    return (
                        <button
                            key={label.id}
                            type="button"
                            aria-pressed={selecionada}
                            onClick={() => alternarLabel(label.id)}
                            className={`text-[11px] rounded-md border px-2 py-1 cursor-pointer ${selecionada ? "bg-[#333B44] border-white/40 text-white" : "bg-[#151A1E] border-[#333B44] text-gray-400"}`}
                        >
                            {label.nome}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface DialogNewTarefaProps extends OpcoesTarefa {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    //devolve se a tarefa foi gravada; os toasts são da página
    onCreateTarefa: (dados: DadosNovaTarefa) => Promise<boolean>;
}

//a página monta este dialog com `key` nova a cada abertura: cada abertura começa vazia
const DialogNewTarefa = ({ open, onOpenChange, onCreateTarefa, ...opcoes }: DialogNewTarefaProps) => {
    const [campos, setCampos] = useState<CamposTarefa>(CAMPOS_VAZIOS);
    const [salvando, setSalvando] = useState(false);

    //nome, projeto, status e prioridade são obrigatórios na API; prazo antes do início não vai (RF-34, L-1)
    const podeCriar = !!campos.nome.trim() && !!campos.idProjeto && !!campos.idStatus && !!campos.prioridade
        && !prazoAntesDoInicio(campos.dataInicio, campos.dataFinal) && !salvando;

    const handleCreate = async () => {
        if (!podeCriar) return;
        setSalvando(true);
        const gravou = await onCreateTarefa(montarDadosNovaTarefa(campos));
        setSalvando(false);
        //falhou: o dialog continua aberto com os campos preenchidos
        if (gravou) onOpenChange(false);
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[560px] max-h-[90vh] overflow-y-auto flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">Nova Tarefa</DialogTitle>
                        <hr className="border-gray-600" />
                    </DialogHeader>

                    <FormularioTarefa campos={campos} onChange={(p) => setCampos((c) => ({ ...c, ...p }))} {...opcoes} />

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleCreate} disabled={!podeCriar}>Criar Tarefa</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewTarefa;
