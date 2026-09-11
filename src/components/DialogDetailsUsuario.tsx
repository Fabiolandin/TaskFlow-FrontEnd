import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface DialogDetailsUsuarioProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usuarioSelecionado: {id: number; nome: string; email: string;} | null;
    onEditUsuario: (id: number, nome: string, email: string, senha: string) => void;
}

const DialogDetailsUsuario = ({ open, onOpenChange, usuarioSelecionado, onEditUsuario }: DialogDetailsUsuarioProps) => {

    //state para receber os dados
    const [nomeEdit, setNomeEdit] = useState("");
    const [emailEdit, setEmailEdit] = useState("");
    const [senhaEdit, setSenhaEdit] = useState("");

    const handleSubmit = async () => {
        if(!usuarioSelecionado) return;
        if (!nomeEdit.trim() || !emailEdit.trim()) return; // Evita editar usuário com campos vazios
        try{
            await onEditUsuario( usuarioSelecionado.id, nomeEdit, emailEdit, senhaEdit);
            setNomeEdit("");
            setEmailEdit("");
            setSenhaEdit("");
            onOpenChange(false); // Fecha o diálogo após a criação
        } catch(error){
            toast.error("Erro ao criar usuário");
        }
    }

    //useEffetc para carregar os dados do usuario selecionado nos inputs
    useEffect(() => {
        if(usuarioSelecionado){
            setNomeEdit(usuarioSelecionado.nome);
            setEmailEdit(usuarioSelecionado.email);
            setSenhaEdit("");
        }
    }, [usuarioSelecionado]);

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">
                            {usuarioSelecionado?.nome}
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

                    <p className="text-gray-400 text-[13px]">E-mail</p>
                    <Input 
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" 
                    type="text" 
                    placeholder="nome@taskflow.app" 
                    value={emailEdit}
                    onChange={(e) => setEmailEdit(e.target.value)}
                    />

                    <p className="text-gray-400 text-[13px]">Senha</p>
                    <Input 
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" 
                    type="password" 
                    placeholder="********" 
                    value={senhaEdit}
                    onChange={(e) => setSenhaEdit(e.target.value)}
                    />

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button 
                        variant="destructive" 
                        onClick={handleSubmit}
                        disabled={!nomeEdit.trim() || !emailEdit.trim()}
                        >
                            Editar usuário
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogDetailsUsuario;
