import { apiClient } from "@/api/apiClient";
import type { Tarefa } from "@/fetchs/fetchTarefas";
import type { Membro } from "@/fetchs/fetchMembros";

//SPEC-024: datas vão como AAAA-MM-DD; o planejamento devolve datas AAAA-MM-DD e horas em minutos

export type StatusSprint = "Planejamento" | "Ativa" | "Fechada";

export interface Sprint {
    id: number;
    nome: string;
    dataInicio: string;
    dataFim: string;
    status: StatusSprint;
}

export interface ItemDaFila {
    id: number;
    ordem: number;
    tipo: "tarefa" | "avulso";
    tarefa: Tarefa | null;
    avulso: { nome: string; recorrente: boolean } | null;
    planejadas: number;
    semEstimativa: boolean;
    naoPrevista: boolean;
    evolucao: number;
    inicioPrevisto: string | null;
    entregaPrevista: string | null;
    inicioProjetado: string | null;
    entregaProjetada: string | null;
    transborda: { minutos: number; sprint: { id: number | null; nome: string } } | null;
    idItemOrigem: number | null;
    //"veio de <sprint>" (RF-117)
    origem: { id: number; nome: string } | null;
}

export interface FilaDoDev {
    usuario: Membro;
    capacidade: number;
    planejadas: number;
    //% inteiro; null quando não há capacidade
    ocupacao: number | null;
    semCapacidade: boolean;
    itens: ItemDaFila[];
}

export interface Planejamento {
    sprint: Sprint;
    proxima: { id: number | null; nome: string };
    devs: FilaDoDev[];
}

const json = (body: object) => JSON.stringify(body);

// RF-109
export const fetchSprints = () => apiClient<Sprint[]>("/sprints");
export const createSprint = (dados: { nome: string; dataInicio: string; dataFim: string }) => apiClient<Sprint>("/sprints", { method: "POST", body: json(dados) });
export const updateSprint = (id: number, dados: Partial<{ nome: string; dataInicio: string; dataFim: string }>) => apiClient<Sprint>(`/sprints/${id}`, { method: "PATCH", body: json(dados) });
export const deleteSprint = (id: number) => apiClient(`/sprints/${id}`, { method: "DELETE" });
export const ativarSprint = (id: number) => apiClient<Sprint>(`/sprints/${id}/ativar`, { method: "POST" });

// RF-115
export const fetchPlanejamento = (id: number) => apiClient<Planejamento>(`/sprints/${id}/planejamento`);

// RF-110, RF-111
export type NovoItem = { idUsuario: number; posicao?: number } & ({ idTarefa: number } | { nome: string; minutosAvulsos: number; recorrente: boolean });
export const createItem = (idSprint: number, dados: NovoItem) =>
    apiClient<{ id: number; membroAdicionado: { idProjeto: number; nomeProjeto: string } | null }>(`/sprints/${idSprint}/itens`, { method: "POST", body: json(dados) });
export const updateItem = (id: number, dados: Partial<{ idUsuario: number; posicao: number; nome: string; minutosAvulsos: number; recorrente: boolean }>) =>
    apiClient(`/itens/${id}`, { method: "PATCH", body: json(dados) });
export const reordenarFila = (idSprint: number, idUsuario: number, ids: number[]) => apiClient(`/sprints/${idSprint}/fila/${idUsuario}`, { method: "PUT", body: json({ ids }) });
export const deleteItem = (id: number) => apiClient(`/itens/${id}`, { method: "DELETE" });

// ---------- SPEC-025: cronograma e acompanhamento ----------

export type StatusItem = "Concluída" | "Bloqueada" | "Em andamento" | "Não iniciada";

export interface LinhaCronograma {
    id: number;
    tipo: "tarefa" | "avulso";
    tarefa: Tarefa | null;
    avulso: { nome: string; recorrente: boolean } | null;
    usuario: Membro;
    projeto: { id: number; nome: string } | null;
    naoPrevista: boolean;
    planejadas: number;
    apontadas: number;
    consumo: number | null;
    restantes: number;
    evolucao: number;
    status: StatusItem;
    bloqueio: string | null;
    observacao: string | null;
    dataEntregaReal: string | null;
    inicioPrevisto: string | null;
    entregaPrevista: string | null;
    diasUteis: number | null;
    inicioProjetado: string | null;
    entregaProjetada: string | null;
    atraso: number | null;
    risco: boolean;
    transborda: { minutos: number; sprint: { id: number | null; nome: string } } | null;
    origem: { id: number; nome: string } | null;
}

export interface Cronograma {
    sprint: Sprint;
    evolucao: { sprint: number | null; porDev: { usuario: Membro; evolucao: number | null }[]; porProjeto: { projeto: { id: number; nome: string }; evolucao: number | null }[] };
    itens: LinhaCronograma[];
}

export const fetchCronograma = (id: number, filtros: { idProjeto?: number; idUsuario?: number } = {}) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) if (valor !== undefined) params.set(chave, String(valor));
    return apiClient<Cronograma>(`/sprints/${id}/cronograma?${params.toString()}`);
};

export type DadosAcompanhamento = Partial<{ evolucao: number; bloqueio: string | null; observacao: string | null; dataEntregaReal: string | null }>;
export const acompanhar = (idItem: number, dados: DadosAcompanhamento) => apiClient(`/itens/${idItem}/acompanhamento`, { method: "PATCH", body: JSON.stringify(dados) });

// ---------- SPEC-027: fechamento ----------

export interface PreviaFechamento {
    sprint: Sprint;
    proxima: { id: number | null; nome: string };
    itens: { id: number; tarefa: Tarefa; usuario: Membro; evolucao: number; restantes: number }[];
}
export type DestinoFechamento = "proxima" | "backlog";

export const fetchPreviaFechamento = (id: number) => apiClient<PreviaFechamento>(`/sprints/${id}/fechamento`);
export const fecharSprint = (id: number, itens: { id: number; destino: DestinoFechamento }[]) =>
    apiClient<{ sprint: Sprint; proxima: { id: number; nome: string } | null }>(`/sprints/${id}/fechar`, { method: "POST", body: JSON.stringify({ itens }) });
