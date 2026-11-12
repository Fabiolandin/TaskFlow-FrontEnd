import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { toast } from "sonner";
import SeletorCor from "./SeletorCor";
import { corValida } from "@/fetchs/fetchStatus";

interface DialogDetailsLabelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    labelSelecionada: {id: number; nome: string; cor: string | null} | null;
    onEditLabel: (id: number, nome: string, cor: string) => void;
}

const DialogDetailsLabel = ({ open, onOpenChange, labelSelecionada, onEditLabel }: DialogDetailsLabelProps) => {

    //state para receber os dados
    const [nomeEdit, setNomeEdit] = useState("");
    const [cor, setCor] = useState("");

    const handleSubmit = async () => {
        if(!labelSelecionada) return;
        if (!nomeEdit.trim() || !corValida(cor)) return; // Evita nome vazio e cor fora do formato
        try{
            await onEditLabel( labelSelecionada.id, nomeEdit, cor.trim());
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
            setCor(labelSelecionada.cor ?? "");
        }
    }, [labelSelecionada]);

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-superficie w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-texto text-[17px]">
                            {labelSelecionada?.nome}
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-texto-suave text-[13px]">Nome</p>
                    <Input 
                    className="text-texto bg-elevado border-borda-forte mb-2 h-10" 
                    type="text" 
                    placeholder="Nome completo " 
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                    />

                    <p className="text-texto-suave text-[13px]">Cor</p>
                    <SeletorCor valor={cor} onChange={setCor} />

                    <DialogFooter className="bg-superficie">
                        <Button variant="ghost" className="text-texto-suave" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button 
                        variant="destructive" 
                        onClick={handleSubmit}
                        disabled={!nomeEdit.trim() || !corValida(cor)}
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
