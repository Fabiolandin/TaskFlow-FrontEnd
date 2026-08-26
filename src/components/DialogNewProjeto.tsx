import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const DialogNewProjeto = ({ open, onOpenChange}) => {
    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-[#0E1012] w-[500px] flex-col flex p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-[17px]">Novo Projeto</DialogTitle>
                        <hr className="border-gray-600" />
                    </DialogHeader>
                    <div className="flex flex-col mt-2">
                    <p className="text-gray-400 text-[13px]">Nome do projeto</p>
                    <Input className="text-white bg-[#151A1E] mb-2" type="text" placeholder="Digite o nome do projeto" />

                    <p className="text-gray-400 mt-2 text-[13px]">Descrição</p>
                    <Input className="text-white bg-[#151A1E]" type="text" placeholder="Digite a descrição do projeto" />
                    </div>

                    <div className="flex flex-row gap-10">

                    <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Status</p>
                    <Input className="text-white bg-[#151A1E]" size={25} type="text" placeholder="Digite o status do projeto" />
                    </div>

                    <div className="flex flex-col gap-2">
                    <p className="text-gray-400 text-[13px]">Data de início</p>
                    <Input className="text-gray-400 bg-[#151A1E]" type="date"/>
                    </div>

                    </div>
                    <p className="text-gray-400">Membros</p>

                    <DialogFooter className="bg-[#0E1012]">
                        <Button variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button variant="destructive">Criar Projeto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DialogNewProjeto;