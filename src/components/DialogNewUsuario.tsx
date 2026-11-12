import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

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
        } catch {
            // o toast de erro já é mostrado pela página; aqui só mantém o diálogo aberto
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-superficie w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-texto text-[17px]">
                            Novo usuário
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-texto-suave text-[13px]">Nome</p>
                    <Input 
                    className="text-texto bg-elevado border-borda-forte mb-2 h-10" 
                    type="text" 
                    placeholder="Nome completo " 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    />

                    <p className="text-texto-suave text-[13px]">E-mail</p>
                    <Input 
                    className="text-texto bg-elevado border-borda-forte mb-2 h-10" 
                    type="email" 
                    placeholder="nome@taskflow.app" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />

                    <p className="text-texto-suave text-[13px]">Senha</p>
                    <Input 
                    className="text-texto bg-elevado border-borda-forte mb-2 h-10" 
                    type="password" 
                    placeholder="********" 
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    />

                    <DialogFooter className="bg-superficie">
                        <Button variant="ghost" className="text-texto-suave" onClick={() => onOpenChange(false)}>Cancelar</Button>
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
