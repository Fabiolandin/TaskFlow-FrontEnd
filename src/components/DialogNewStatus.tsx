import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import type { DadosStatus } from "@/fetchs/fetchStatus";
import { corValida } from "@/fetchs/fetchStatus";
import SeletorCor from "./SeletorCor";

interface DialogNewStatusProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    titulo: string;
    onCreateStatus: (dados: DadosStatus) => Promise<void>;
}

const DialogNewStatus = ({ open, onOpenChange, titulo, onCreateStatus }: DialogNewStatusProps) => {

    //states com os campos do status
    const [nome, setNome] = useState("");
    const [cor, setCor] = useState("");
    const [isFinal, setIsFinal] = useState(false);

    //nome é obrigatório; cor é opcional, mas se vier é #RRGGBB; a ordem não é pedida (RF-63: novo vai para o fim, editar não muda)
    const valido = nome.trim() !== "" && corValida(cor);

    const handleCreateStatus = async () => {
        if (!valido) return;
        try {
            await onCreateStatus({ nome: nome.trim(), cor: cor.trim() || null, isFinal });
            setNome("");
            setCor("");
            setIsFinal(false);
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
                            {titulo}
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
                        onClick={handleCreateStatus}
                        disabled={!valido}
                        >Criar Status</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewStatus;
