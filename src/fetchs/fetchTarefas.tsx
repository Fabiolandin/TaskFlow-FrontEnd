import { apiClient } from "@/api/apiClient";
import type { Status } from "@/fetchs/fetchStatus";
import type { Membro } from "@/fetchs/fetchMembros";

//tamanho da página da lista de tarefas (SPEC-006, D-8)
export const LIMITE_TAREFAS = 10;

//prioridade é conjunto fixo da API (RF-22); o front só repete a constante (SPEC-006, D-7)
export const PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"] as const;

export interface LabelDaTarefa {
    id: number;
    nome: string;
}

//tarefa como as 4 rotas devolvem (RF-32): sem `senha`, labels achatadas, responsável pode ser null
export interface Tarefa {
    id: number;
    nome: string;
    descricao: string | null;
    idStatus: number;
    prioridade: string;
    data_inicio: string | null;
    data_final: string | null;
    createdAt: string;
    updatedAt: string;
    idUsuarioResponsavel: number | null;
    idUsuarioCriador: number;
    idProjeto: number;
    status: Status;
    projeto: { id: number; nome: string };
    responsavel: Membro | null;
    criador: Membro;
    labels: LabelDaTarefa[];
}

export interface PaginaTarefas {
    data: Tarefa[];
    total: number;
    page: number;
    totalPages: number;
}

//filtros da lista; ausente = sem filtro
export interface FiltrosTarefa {
    idProjeto?: number;
    idStatus?: number;
    idUsuarioResponsavel?: number;
    idLabel?: number;
}

//o que o formulário guarda (tudo string, como vem dos inputs; "" = não escolhido)
export interface CamposTarefa {
    nome: string;
    descricao: string;
    idStatus: string;
    prioridade: string;
    dataInicio: string;
    dataFinal: string;
    idProjeto: string;
    idUsuarioResponsavel: string;
    labelIds: number[];
}

export const CAMPOS_VAZIOS: CamposTarefa = {
    nome: "", descricao: "", idStatus: "", prioridade: "", dataInicio: "", dataFinal: "",
    idProjeto: "", idUsuarioResponsavel: "", labelIds: [],
};

//a API devolve a data como ISO (meia-noite UTC); o input type=date quer AAAA-MM-DD
export const dataParaInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

//campos do formulário de edição, a partir da tarefa (descricao incluída, para o PATCH não apagá-la)
export const camposDaTarefa = (t: Tarefa): CamposTarefa => ({
    nome: t.nome,
    descricao: t.descricao ?? "",
    idStatus: String(t.idStatus),
    prioridade: t.prioridade,
    dataInicio: dataParaInput(t.data_inicio),
    dataFinal: dataParaInput(t.data_final),
    idProjeto: String(t.idProjeto),
    idUsuarioResponsavel: t.idUsuarioResponsavel === null ? "" : String(t.idUsuarioResponsavel),
    labelIds: t.labels.map((l) => l.id),
});

//corpo do POST: opcionais em branco não vão; datas AAAA-MM-DD; nunca idUsuarioCriador (RF-08)
export interface DadosNovaTarefa {
    nome: string;
    descricao?: string;
    idStatus: number;
    prioridade: string;
    idProjeto: number;
    data_inicio?: string;
    data_final?: string;
    idUsuarioResponsavel?: number;
    labelIds: number[];
}

export const montarDadosNovaTarefa = (c: CamposTarefa): DadosNovaTarefa => {
    const dados: DadosNovaTarefa = {
        nome: c.nome.trim(),
        idStatus: Number(c.idStatus),
        prioridade: c.prioridade,
        idProjeto: Number(c.idProjeto),
        labelIds: c.labelIds,
    };
    if (c.descricao.trim()) dados.descricao = c.descricao.trim();
    if (c.dataInicio) dados.data_inicio = c.dataInicio;
    if (c.dataFinal) dados.data_final = c.dataFinal;
    if (c.idUsuarioResponsavel) dados.idUsuarioResponsavel = Number(c.idUsuarioResponsavel);
    return dados;
}

//corpo do PATCH: sem idProjeto (fixo na edição) e sem idUsuarioCriador (RF-08);
//campo esvaziado vai como null para limpar o valor gravado; labelIds substitui todas (RF-14)
export interface DadosEdicaoTarefa {
    nome: string;
    descricao: string;
    idStatus: number;
    prioridade: string;
    data_inicio: string | null;
    data_final: string | null;
    idUsuarioResponsavel: number | null;
    labelIds: number[];
}

export const montarDadosEdicaoTarefa = (c: CamposTarefa): DadosEdicaoTarefa => ({
    nome: c.nome.trim(),
    descricao: c.descricao,
    idStatus: Number(c.idStatus),
    prioridade: c.prioridade,
    data_inicio: c.dataInicio || null,
    data_final: c.dataFinal || null,
    idUsuarioResponsavel: c.idUsuarioResponsavel ? Number(c.idUsuarioResponsavel) : null,
    labelIds: c.labelIds,
});

export const fetchTarefas = async (page: number, filtros: FiltrosTarefa = {}, limit: number = LIMITE_TAREFAS) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const [chave, valor] of Object.entries(filtros)) {
        if (valor !== undefined) params.set(chave, String(valor));
    }
    return apiClient<PaginaTarefas>(`/tarefas?${params.toString()}`, {
        method: "GET",
    });
}

export const createTarefa = async (dados: DadosNovaTarefa) => {
    return apiClient<Tarefa>(`/tarefas`, {
        method: "POST",
        body: JSON.stringify(dados),
    });
}

export const updateTarefa = async (id: number, dados: DadosEdicaoTarefa) => {
    return apiClient<Tarefa>(`/tarefas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dados),
    });
}
