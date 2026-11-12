import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import type { DadosStatus, Status } from "@/fetchs/fetchStatus";
import { corValida } from "@/fetchs/fetchStatus";
import SeletorCor from "./SeletorCor";

interface DialogDetailsStatusProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    statusSelecionado: Status | null;
    onEditStatus: (id: number, dados: DadosStatus) => Promise<void>;
}

//a página monta este dialog com `key` nova a cada abertura: os campos nascem do status selecionado
const DialogDetailsStatus = ({ open, onOpenChange, statusSelecionado, onEditStatus }: DialogDetailsStatusProps) => {

    //states com os campos, carregados do status selecionado
    const [nome, setNome] = useState(statusSelecionado?.nome ?? "");
    const [cor, setCor] = useState(statusSelecionado?.cor ?? "");
    const [isFinal, setIsFinal] = useState(statusSelecionado?.isFinal ?? false);

    //nome é obrigatório; cor é opcional, mas se vier é #RRGGBB; a ordem não é pedida (RF-63: novo vai para o fim, editar não muda)
    const valido = nome.trim() !== "" && corValida(cor);

    const handleSubmit = async () => {
        if (!statusSelecionado || !valido) return;
        try {
            //cor vazia vai como null: limpa a cor gravada
            await onEditStatus(statusSelecionado.id, { nome: nome.trim(), cor: cor.trim() || null, isFinal });
            onOpenChange(false);
        } catch {
            //a página já mostrou o toast de erro; o dialog fica aberto para corrigir
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-superficie w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-texto text-[17px]">
                            {statusSelecionado?.nome}
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-texto-suave text-[13px]">Nome</p>
                    <Input
                    className="text-texto bg-elevado border-borda-forte mb-2 h-10"
                    type="text"
                    placeholder="ex . Em andamento"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    />

                    <p className="text-texto-suave text-[13px]">Cor</p>
                    <SeletorCor valor={cor} onChange={setCor} />

                    <label className="flex items-center gap-2 text-texto-suave text-[13px] mb-2">
                        <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
                        Encerrado (isFinal): conta como concluído
                    </label>

                    <DialogFooter className="bg-superficie">
                        <Button variant="ghost" className="text-texto-suave" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!valido}
                        >
                            Editar status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogDetailsStatus;
