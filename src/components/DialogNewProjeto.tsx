import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const DialogNewProjeto = ({ open, onOpenChange}) => {
    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Projeto</DialogTitle>
                    </DialogHeader>
                    <p>Nome do projeto:</p>
                    <Input type="text" placeholder="Digite o nome do projeto" />
                    <p>Descrição:</p>
                    <Input type="text" placeholder="Digite a descrição do projeto" />
                    <p>Status:</p>
                    <Input type="text" placeholder="Digite o status do projeto" />
                    <p>Data de Início:</p>
                    <Input type="date" />
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button>Criar Projeto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewProjeto;