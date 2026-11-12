import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { toast } from "sonner";
import SeletorCor from "./SeletorCor";
import { corValida } from "@/fetchs/fetchStatus";

interface DialogNewLabelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateLabel: (nome: string, cor: string) => void;
}

const DialogNewLabel = ({ open, onOpenChange, onCreateLabel }: DialogNewLabelProps) => {

    //state para receber os dados da label
    const [nomeLabel, setNomeLabel] = useState("");
    //cor no painel dos status (RF-76); "" = sem cor
    const [cor, setCor] = useState("");

    const handleCreateLabel = async () => {
        if(!nomeLabel.trim() || !corValida(cor)) return; //impede nome vazio e cor fora do formato
        try{
            await onCreateLabel(nomeLabel, cor.trim());
            setNomeLabel("");
            setCor("");
            onOpenChange(false)
        } catch(error){
            toast.error("Erro ao criar a label")
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-superficie w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-texto text-[17px]">
                            Nova Label
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-texto-suave text-[13px]">Nome</p>
                    <Input 
                    className="text-texto bg-elevado border-borda-forte mb-2 h-10" 
                    type="text" 
                    placeholder="ex . performance" 
                    value={nomeLabel}
                    onChange={(e) => setNomeLabel(e.target.value)}
                    />

                    <p className="text-texto-suave text-[13px]">Cor</p>
                    <SeletorCor valor={cor} onChange={setCor} />

                    <DialogFooter className="bg-superficie">
                        <Button variant="ghost" className="text-texto-suave" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button 
                        variant="destructive"
                        onClick={handleCreateLabel}
                        disabled={!nomeLabel.trim() || !corValida(cor)}
                        >Criar Label</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewLabel;
