import { apiClient } from "@/api/apiClient";
import type { Status } from "@/fetchs/fetchStatus";
import type { Membro } from "@/fetchs/fetchMembros";

//limite padrão da API (RF-12), que combina com o grid de 3 colunas (SPEC-005, D-3)
export const LIMITE_PROJETOS = 9;

//projeto como as 4 rotas devolvem (RF-51): status é o objeto do cadastro, membros são usuários, e o progresso
export interface Projeto {
    id: number;
    nome: string;
    descricao: string | null;
    idStatus: number;
    data_inicio: string | null;
    data_final: string | null;
    status: Status;
    membros: Membro[];
    //calculado no servidor: concluída = status isFinal (RF-49)
    progresso: { total: number; concluidas: number };
}

export interface PaginaProjetos {
    data: Projeto[];
    total: number;
    page: number;
    totalPages: number;
}

//o que o formulário guarda (tudo string, como vem dos inputs)
export interface CamposProjeto {
    nome: string;
    descricao: string;
    idStatus: string;
    dataInicio: string;
}

//corpo do POST /projetos; os membros vão junto e são gravados com o projeto, ou nada é gravado (RF-28)
export interface DadosProjeto {
    nome: string;
    descricao?: string;
    idStatus: number;
    data_inicio?: string;
    membros?: number[];
}

//campos opcionais em branco não vão no corpo; a data vai como AAAA-MM-DD
export const montarDadosProjeto = (campos: CamposProjeto): DadosProjeto => {
    const dados: DadosProjeto = { nome: campos.nome.trim(), idStatus: Number(campos.idStatus) };
    if (campos.descricao.trim()) dados.descricao = campos.descricao.trim();
    if (campos.dataInicio) dados.data_inicio = campos.dataInicio;
    return dados;
}

export const fetchProjetos = async (page: number, limit: number = LIMITE_PROJETOS) => {
    return apiClient<PaginaProjetos>(`/projetos?page=${page}&limit=${limit}`, {
        method: "GET",
    });
}

//um projeto, com status e membros (a página da tarefa lê daqui os membros: RF-26, SPEC-015 C-5)
export const fetchProjeto = async (id: number) => {
    return apiClient<Projeto>(`/projetos/${id}`, {
        method: "GET",
    });
}

//o retorno do POST tem o formato do GET /projetos/:id (RF-51)
export const createProjeto = async (dados: DadosProjeto) => {
    return apiClient<Projeto>(`/projetos`, {
        method: "POST",
        body: JSON.stringify(dados),
    });
}

//corpo do PATCH /projetos/:id: só o campo que mudou (RF-48); null limpa o valor gravado
export interface DadosEdicaoProjeto {
    nome?: string;
    descricao?: string | null;
    idStatus?: number;
    data_inicio?: string | null;
    data_final?: string | null;
}

//a resposta tem o formato único (RF-51): a página troca o seu estado por ela
export const updateProjeto = async (id: number, dados: DadosEdicaoProjeto) => {
    return apiClient<Projeto>(`/projetos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dados),
    });
}

//com tarefas a API recusa com 409 "Projeto em uso: …" (RF-50); quem chama mostra a mensagem
export const deleteProjeto = async (id: number) => {
    return apiClient<unknown>(`/projetos/${id}`, {
        method: "DELETE",
    });
}

//busca rápida (RF-58): projetos cujo nome contém o texto, até `limit`
export const buscarProjetos = async (busca: string, limit: number = 5) => {
    const params = new URLSearchParams({ busca, limit: String(limit) });
    return apiClient<PaginaProjetos>(`/projetos?${params.toString()}`, {
        method: "GET",
    });
}
