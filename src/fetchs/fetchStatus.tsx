import { apiClient } from "@/api/apiClient";

//os dois cadastros de status têm o mesmo formato; muda só a rota (SPEC-003b)
export type TipoStatus = "projeto" | "tarefa";

export interface Status {
    id: number;
    nome: string;
    cor: string | null;
    ordem: number;
    isFinal: boolean;
}

export interface DadosStatus {
    nome: string;
    cor: string | null;
    ordem: number;
    isFinal: boolean;
}

const rotaDoTipo = (tipo: TipoStatus) => (tipo === "projeto" ? "/statusprojeto" : "/statustarefa");

//a API já devolve ordenado por `ordem`
export const fetchStatus = async (tipo: TipoStatus) => {
    return apiClient<Status[]>(rotaDoTipo(tipo), {
        method: "GET",
    });
}

export const createStatus = async (tipo: TipoStatus, dados: DadosStatus) => {
    return apiClient<Status>(rotaDoTipo(tipo), {
        method: "POST",
        body: JSON.stringify(dados),
    });
}

export const updateStatus = async (tipo: TipoStatus, id: number, dados: DadosStatus) => {
    return apiClient<Status>(`${rotaDoTipo(tipo)}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dados),
    });
}

export const deleteStatus = async (tipo: TipoStatus, id: number) => {
    return apiClient<Status>(`${rotaDoTipo(tipo)}/${id}`, {
        method: "DELETE",
    });
}
