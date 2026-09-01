import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

interface DialogNewUsuarioProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DialogUsuario = ({ open, onOpenChange }: DialogNewUsuarioProps) => {
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
                    <Input className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" type="text" placeholder="Nome completo " />

                    <p className="text-gray-400 text-[13px]">E-mail</p>
                    <Input className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" type="text" placeholder="nome@taskflow.app" />

                    <p className="text-gray-400 text-[13px]">Senha</p>
                    <Input className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" type="password" placeholder="nome@taskflow.app" />

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button variant="destructive">Cadastrar usuário</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogUsuario;
