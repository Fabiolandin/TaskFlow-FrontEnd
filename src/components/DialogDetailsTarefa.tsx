import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { FormularioTarefa, type OpcoesTarefa } from "./DialogNewTarefa";
import { camposDaTarefa, montarDadosEdicaoTarefa, type CamposTarefa, type DadosEdicaoTarefa, type Tarefa } from "@/fetchs/fetchTarefas";

interface DialogDetailsTarefaProps extends OpcoesTarefa {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tarefaSelecionada: Tarefa | null;
    //devolve se gravou; os toasts são da página
    onEditTarefa: (id: number, dados: DadosEdicaoTarefa) => Promise<boolean>;
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
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogDetailsTarefa;
