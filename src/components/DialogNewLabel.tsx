import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface DialogNewLabelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateLabel: (nome: string) => void;
}

const DialogNewLabel = ({ open, onOpenChange, onCreateLabel }: DialogNewLabelProps) => {

    //state para receber os dados da label
    const [nomeLabel, setNomeLabel] = useState("");

    const handleCreateLabel = async () => {
        if(!nomeLabel.trim()) return; //impede de criar uma label com nome vazio
        try{
            await onCreateLabel(nomeLabel);
            setNomeLabel("");
            onOpenChange(false)
        } catch(error){
            toast.error("Erro ao criar a label")
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">
                            Nova Label
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-gray-400 text-[13px]">Nome</p>
                    <Input 
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" 
                    type="text" 
                    placeholder="ex . performance" 
                    value={nomeLabel}
                    onChange={(e) => setNomeLabel(e.target.value)}
                    />

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button 
                        variant="destructive"
                        onClick={handleCreateLabel}
                        disabled={!nomeLabel.trim()}
                        >Criar Label</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewLabel;
