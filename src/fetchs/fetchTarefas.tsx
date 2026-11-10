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
    //responsável OU criador (RF-38)
    idUsuarioEnvolvido?: number;
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

//filtros e página na query string (RF-44): só inteiro positivo vale; o resto é ignorado, sem erro
const inteiroPositivo = (valor: string | null) => (valor && /^[1-9]\d*$/.test(valor) ? Number(valor) : undefined);

export const lerConsultaDaUrl = (params: URLSearchParams, chaves: readonly (keyof FiltrosTarefa)[]) => {
    const filtros: FiltrosTarefa = {};
    for (const chave of chaves) {
        const valor = inteiroPositivo(params.get(chave));
        if (valor !== undefined) filtros[chave] = valor;
    }
    return { pagina: inteiroPositivo(params.get("page")) ?? 1, filtros };
}

//a página 1 não vai na URL
export const consultaParaUrl = (pagina: number, filtros: FiltrosTarefa) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) {
        if (valor !== undefined) params.set(chave, String(valor));
    }
    if (pagina > 1) params.set("page", String(pagina));
    return params;
}

//a API devolve a data como ISO (meia-noite UTC); o input type=date quer AAAA-MM-DD
export const dataParaInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

//prazo anterior à data de início não é gravado pela tela; o back aceita (RF-13, L-1). Datas AAAA-MM-DD
export const AVISO_PRAZO = "O prazo não pode ser anterior à data de início";
export const prazoAntesDoInicio = (inicio: string, prazo: string) => !!inicio && !!prazo && prazo < inicio;

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

//corpo do PATCH: só o campo que mudou (RF-44, RF-47); nunca idUsuarioCriador (RF-08);
//null limpa o valor gravado; labelIds substitui todas (RF-14)
export interface DadosEdicaoTarefa {
    nome?: string;
    descricao?: string | null;
    idStatus?: number;
    prioridade?: string;
    data_inicio?: string | null;
    data_final?: string | null;
    idUsuarioResponsavel?: number | null;
    idProjeto?: number;
    labelIds?: number[];
}

export const fetchTarefas = async (page: number, filtros: FiltrosTarefa = {}, limit: number = LIMITE_TAREFAS) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const [chave, valor] of Object.entries(filtros)) {
        if (valor !== undefined) params.set(chave, String(valor));
    }
    return apiClient<PaginaTarefas>(`/tarefas?${params.toString()}`, {
        method: "GET",
    });
}

//uma tarefa, no mesmo formato da lista (RF-32); a página da tarefa lê daqui (RF-46)
export const fetchTarefa = async (id: number) => {
    return apiClient<Tarefa>(`/tarefas/${id}`, {
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
