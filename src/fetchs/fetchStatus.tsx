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
    //ausente no POST: vai para o fim (RF-21); a tela não envia, a ordem muda por arrastar (RF-63)
    ordem?: number;
    isFinal: boolean;
}

//cor do status: vazia (sem cor) ou #RRGGBB, como a API exige (RF-21, SPEC-014)
export const AVISO_COR = "Use o formato #RRGGBB (ex.: #E5484D)";
export const corValida = (cor: string) => {
    const valor = cor.trim();
    return valor === "" || /^#[0-9A-Fa-f]{6}$/.test(valor);
}

//cor de reserva de status sem cor (a mesma do Dashboard, RF-40/RF-43)
export const COR_RESERVA = "#6E7379";

//ordem do cadastro no front: `ordem` crescente, empate por `id` (a API não desempata; RF-43, D-10)
export const ordenarStatus = <T extends { id: number; ordem: number }>(lista: T[]): T[] =>
    [...lista].sort((a, b) => a.ordem - b.ordem || a.id - b.id);

const rotaDoTipo =(tipo: TipoStatus) => (tipo === "projeto" ? "/statusprojeto" : "/statustarefa");

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

//grava a ordem do cadastro inteiro: ids na ordem nova (RF-62); devolve a lista já ordenada
export const reordenarStatus = async (tipo: TipoStatus, ids: number[]) => {
    return apiClient<Status[]>(`${rotaDoTipo(tipo)}/ordem`, {
        method: "PUT",
        body: JSON.stringify({ ids }),
    });
}
