import { apiClient } from "@/api/apiClient";

//membro do projeto, como a API devolve em `projeto.membros` (SPEC-010)
export interface Membro {
    id: number;
    nome: string;
    email: string;
}

export const addMembro = async (idProjeto: number, idUsuario: number) => {
    return apiClient<Membro>(`/projetos/${idProjeto}/membros`, {
        method: "POST",
        body: JSON.stringify({ idUsuario }),
    });
}

//membros atuais do projeto, em ordem de entrada (SPEC-013)
export const listarMembros = async (idProjeto: number) => {
    return apiClient<Membro[]>(`/projetos/${idProjeto}/membros`);
}

//desfaz o vínculo; a API recusa com 409 se o usuário é responsável por tarefa do projeto (RF-27)
export const removeMembro = async (idProjeto: number, idUsuario: number) => {
    return apiClient<Membro>(`/projetos/${idProjeto}/membros/${idUsuario}`, { method: "DELETE" });
}
