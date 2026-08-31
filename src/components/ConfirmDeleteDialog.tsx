import type { ReactElement } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
    trigger: ReactElement;
    id: number;
    titulo : string;
    descricao : string;
    funcao : () => void;
}

const ConfirmDeleteDialog = ({ trigger, id, titulo, descricao, funcao}: ConfirmDeleteDialogProps) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0E1012] p-5">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white text-[17px]">Tem certeza que deseja deletar #{id} {titulo}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ao clicar em deletar o {descricao} será excluido permanentemente
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="bg-[#0E1012]">
                    <AlertDialogCancel className="text-gray-400 ">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-400 hover:bg-red-500"
                        onClick={funcao}
                    >Deletar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    )
}

export default ConfirmDeleteDialog;
