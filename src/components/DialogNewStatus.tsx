import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import type { DadosStatus } from "@/fetchs/fetchStatus";

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
    const [ordem, setOrdem] = useState("");
    const [isFinal, setIsFinal] = useState(false);

    //nome e ordem (inteiro) são obrigatórios na API; cor e isFinal não
    const valido = nome.trim() !== "" && ordem.trim() !== "" && Number.isInteger(Number(ordem));

    const handleCreateStatus = async () => {
        if (!valido) return;
        try {
            await onCreateStatus({ nome: nome.trim(), cor: cor.trim() || null, ordem: Number(ordem), isFinal });
            setNome("");
            setCor("");
            setOrdem("");
            setIsFinal(false);
            onOpenChange(false);
        } catch {
            //a página já mostrou o toast de erro; o dialog fica aberto para corrigir
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">
                            {titulo}
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-gray-400 text-[13px]">Nome</p>
                    <Input
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10"
                    type="text"
                    placeholder="ex . Em andamento"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    />

                    <p className="text-gray-400 text-[13px]">Cor (hex, opcional)</p>
                    <Input
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10"
                    type="text"
                    placeholder="ex . #E5484D"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    />

                    <p className="text-gray-400 text-[13px]">Ordem</p>
                    <Input
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10"
                    type="number"
                    step={1}
                    placeholder="ex . 1"
                    value={ordem}
                    onChange={(e) => setOrdem(e.target.value)}
                    />

                    <label className="flex items-center gap-2 text-gray-400 text-[13px] mb-2">
                        <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
                        Encerrado (isFinal): conta como concluído
                    </label>

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
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
