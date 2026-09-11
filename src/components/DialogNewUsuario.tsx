import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface DialogNewUsuarioProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateUsuario: (nome: string, email: string, senha: string) => void;
}

const DialogUsuario = ({ open, onOpenChange, onCreateUsuario }: DialogNewUsuarioProps) => {

    //state para receber os dados
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const handleCreateUsuario = async () => {
        if (!nome.trim() || !email.trim() || !senha.trim()) return; // Evita criar usuário com campos vazios
        try{
            await onCreateUsuario(nome, email, senha);
            setNome("");
            setEmail("");
            setSenha("");
            onOpenChange(false); // Fecha o diálogo após a criação
        } catch(error){
            toast.error("Erro ao criar usuário");
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">
                            Novo usuário
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-gray-400 text-[13px]">Nome</p>
                    <Input 
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" 
                    type="text" 
                    placeholder="Nome completo " 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    />

                    <p className="text-gray-400 text-[13px]">E-mail</p>
                    <Input 
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" 
                    type="email" 
                    placeholder="nome@taskflow.app" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />

                    <p className="text-gray-400 text-[13px]">Senha</p>
                    <Input 
                    className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" 
                    type="password" 
                    placeholder="********" 
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    />

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button 
                        variant="destructive" 
                        onClick={handleCreateUsuario}
                        disabled={!nome.trim() || !email.trim() || !senha.trim()}
                        >
                            Cadastrar usuário
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogUsuario;
