import { ApiError, apiClient } from "@/api/apiClient";

//membro do projeto, como a API devolve em `projeto.membros` (SPEC-010)
export interface Membro {
    id: number;
    nome: string;
    email: string;
}

export interface MembroNaoAdicionado {
    idUsuario: number;
    mensagem: string;
}

export const addMembro = async (idProjeto: number, idUsuario: number) => {
    return apiClient<Membro>(`/projetos/${idProjeto}/membros`, {
        method: "POST",
        body: JSON.stringify({ idUsuario }),
    });
}

//adiciona um por um; devolve os que a API recusou, com o motivo, para a tela avisar (SPEC-005)
export const addMembros = async (idProjeto: number, idsUsuarios: number[]) => {
    const naoAdicionados: MembroNaoAdicionado[] = [];
    for (const idUsuario of idsUsuarios) {
        try {
            await addMembro(idProjeto, idUsuario);
        } catch (error) {
            //a message da API quando é texto (ex.: 409 "já é membro"); senão só o status HTTP
            const mensagem = error instanceof ApiError ? (error.mensagemDaApi ?? `erro ${error.status}`) : String(error);
            naoAdicionados.push({ idUsuario, mensagem });
        }
    }
    return naoAdicionados;
}
