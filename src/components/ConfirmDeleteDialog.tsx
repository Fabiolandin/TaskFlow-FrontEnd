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
            <AlertDialogContent className="bg-superficie p-5">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-texto text-[17px]">Tem certeza que deseja deletar #{id} {titulo}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ao clicar em deletar o {descricao} será excluido permanentemente
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="bg-superficie">
                    <AlertDialogCancel className="text-texto-suave ">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-tom-vermelho-texto hover:bg-tom-vermelho-texto"
                        onClick={funcao}
                    >Deletar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    )
}

export default ConfirmDeleteDialog;
