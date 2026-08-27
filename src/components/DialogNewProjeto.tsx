import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import Membros, { type Membro } from "@/membros";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface DialogNewProjetoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface StatusOption {
    label: string;
    value: string;
}

const DialogNewProjeto = ({ open, onOpenChange }: DialogNewProjetoProps) => {

    // lista de  status para select
    const statusOptions: StatusOption[] = [
        { label: "Mapeando", value: "1" },
        { label: "Em andamento", value: "2" },
        { label: "Concluído", value: "3" },
        { label: "Pausado", value: "4" },
        { label: "Cancelado", value: "5" },
    ]

    //State para receber lista de membros
    const [membros, setMembros] = useState<Membro[]>(Membros);

    //State para controlar o status selecionado no Select
    const [status, setStatus] = useState<string>("");

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
                        <Input className="text-white bg-[#151A1E] border-[#333B44] mb-2 h-10" type="text" placeholder="ex. Taskflow Mobile" />

                        <p className="text-gray-400 mt-2 text-[13px]">Descrição</p>
                        <Textarea className="text-white bg-[#151A1E] border-[#333B44]" placeholder="Objetivo do projeto" />
                    </div>

                    <div className="flex flex-row gap-10">

                        <div className="flex flex-col gap-2">
                            <p className="text-gray-400 text-[13px]">Status</p>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-52 h-10! rounded-md bg-[#151A1E] border-[#333B44] text-white">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151A1E] border border-[#333B44] text-white">
                                    <SelectGroup>
                                        {statusOptions.map((item) => (
                                            <SelectItem className="text-gray-400 focus:bg-[#333B44] focus:text-white" key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-gray-400 text-[13px]">Data de início</p>
                            <Input className="text-gray-400 bg-[#151A1E] border-[#333B44] w-52 h-10" type="date" />
                        </div>

                    </div>
                    <p className="text-gray-400 text-[13px]">Membros</p>
                    <div className="flex flex-row gap-4">
                        {membros.map((membro) => (
                            <div key={membro.id}>
                                <div className="text-[11px] text-gray-400 rounded-md bg-[#151A1E] border border-[#333B44] px-2 py-1">{membro.nome}</div>
                            </div>
                        ))}
                    </div>

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