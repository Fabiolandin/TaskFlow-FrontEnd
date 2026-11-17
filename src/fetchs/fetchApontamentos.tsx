import { apiClient } from "@/api/apiClient";

//SPEC-026: data AAAA-MM-DD; horas HH:MM; minutos inteiros

export interface Apontamento {
    id: number;
    idUsuario: number;
    data: string;
    inicio: string;
    fim: string;
    minutos: number;
    idItemSprint: number | null;
    //trilha e projeto vêm na leitura do dia (GET /apontamentos); nas respostas de escrita, trilha vazia
    item: ItemApontavel | null;
    observacao: string | null;
    foraDaSprint: boolean;
    alerta?: string;
}

export interface DiaDeApontamentos {
    data: string;
    sprint: { id: number; nome: string; status: "Planejamento" | "Ativa" | "Fechada" } | null;
    apontamentos: Apontamento[];
    totalMinutos: number;
    sugestaoInicio: string | null;
}

export interface ItemApontavel {
    id: number;
    nome: string | null;
    idTarefa: number | null;
    //nomes das tarefas mãe, da raiz até a mãe direta; vazio em avulsa ou tarefa sem mãe
    trilha?: string[];
    projeto?: { id: number; nome: string } | null;
    sprint: { id: number; nome: string };
}

export type DadosApontamento = {
    data: string;
    inicio: string;
    fim: string;
    idItemSprint: number | null;
    observacao: string | null;
    foraDaSprint?: boolean;
    idUsuario?: number;
};

const json = (body: object) => JSON.stringify(body);
const comDev = (idUsuario?: number) => (idUsuario ? `&idUsuario=${idUsuario}` : "");

export const fetchDia = (data: string, idUsuario?: number) => apiClient<DiaDeApontamentos>(`/apontamentos?data=${data}${comDev(idUsuario)}`);
export const fetchItensApontaveis = (data: string, todas: boolean, idUsuario?: number) =>
    apiClient<ItemApontavel[]>(`/apontamentos/itens?data=${data}&todas=${todas}${comDev(idUsuario)}`);
export const createApontamento = (dados: DadosApontamento) => apiClient<Apontamento>("/apontamentos", { method: "POST", body: json(dados) });
export const updateApontamento = (id: number, dados: Partial<Omit<DadosApontamento, "idUsuario">>) => apiClient<Apontamento>(`/apontamentos/${id}`, { method: "PATCH", body: json(dados) });
export const deleteApontamento = (id: number) => apiClient(`/apontamentos/${id}`, { method: "DELETE" });
export const converterApontamento = (id: number, idProjeto: number) => apiClient<Apontamento>(`/apontamentos/${id}/converter`, { method: "POST", body: json({ idProjeto }) });

//80 → "1,33h" (RF-128)
export const horasDecimais = (minutos: number) => `${(minutos / 60).toFixed(2).replace(".", ",")}h`;
