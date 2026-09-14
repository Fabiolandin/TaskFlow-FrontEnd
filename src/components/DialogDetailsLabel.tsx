import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface DialogDetailsLabelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    labelSelecionada: {id: number; nome: string;} | null;
    onEditLabel: (id: number, nome: string) => void;
}

const DialogDetailsLabel = ({ open, onOpenChange, labelSelecionada, onEditLabel }: DialogDetailsLabelProps) => {

    //state para receber os dados
    const [nomeEdit, setNomeEdit] = useState("");

    const handleSubmit = async () => {
        if(!labelSelecionada) return;
        if (!nomeEdit.trim()) return; // Evita editar label com campo vazio
        try{
            await onEditLabel( labelSelecionada.id, nomeEdit);
            setNomeEdit("");
            onOpenChange(false); // Fecha o diálogo após a criação
        } catch(error){
            toast.error("Erro ao editar Label");
        }
    }

    //useEffetc para carregar os dados da label selecionada
    useEffect(() => {
        if(labelSelecionada){
            setNomeEdit(labelSelecionada.nome);
        }
    }, [labelSelecionada]);

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">
                            {labelSelecionada?.nome}
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-gray-400 text-[13px]">Nome</p>
                    <Input 
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" 
                    type="text" 
                    placeholder="Nome completo " 
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                    />

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button 
                        variant="destructive" 
                        onClick={handleSubmit}
                        disabled={!nomeEdit.trim()}
                        >
                            Editar label
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogDetailsLabel;
