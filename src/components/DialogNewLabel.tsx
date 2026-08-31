import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

interface DialogNewLabelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DialogNewLabel = ({ open, onOpenChange }: DialogNewLabelProps) => {
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
                    <Input className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" type="text" placeholder="ex . performance" />

                    <p className="text-gray-400 text-[13px]">Cor</p>
                    <Input className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" type="text" placeholder="ex. Taskflow Mobile" />

                    <Input className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" type="text" placeholder="Prévia" />

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button variant="destructive">Criar Projeto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewLabel;
