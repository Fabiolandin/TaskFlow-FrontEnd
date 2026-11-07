import { apiClient } from "@/api/apiClient";
import type { Membro } from "@/fetchs/fetchMembros";

//comentário como as rotas de /comentariostarefas devolvem (RF-35): autor sem `senha`
export interface Comentario {
    id: number;
    comentario: string;
    createdAt: string;
    updatedAt: string;
    idTarefa: number;
    idUsuario: number;
    autor: Membro;
}

//a lista já vem em ordem crescente de criação, sem paginação
export const fetchComentariosDaTarefa = async (idTarefa: number) => {
    return apiClient<Comentario[]>(`/comentariostarefas/tarefas/${idTarefa}`, {
        method: "GET",
    });
}

//o autor vem do token no servidor: o corpo nunca leva idUsuario (RF-08)
export const createComentario = async (idTarefa: number, comentario: string) => {
    return apiClient<Comentario>(`/comentariostarefas`, {
        method: "POST",
        body: JSON.stringify({ comentario, idTarefa }),
    });
}

export const updateComentario = async (id: number, comentario: string) => {
    return apiClient<Comentario>(`/comentariostarefas/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ comentario }),
    });
}

export const deleteComentario = async (id: number) => {
    return apiClient<Comentario>(`/comentariostarefas/${id}`, {
        method: "DELETE",
    });
}

//"editado" só quando o texto foi alterado depois de criado
export const foiEditado = (c: Comentario) => c.updatedAt !== c.createdAt;
