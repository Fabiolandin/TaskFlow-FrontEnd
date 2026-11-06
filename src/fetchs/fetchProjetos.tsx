import { apiClient } from "@/api/apiClient";
import type { Status } from "@/fetchs/fetchStatus";
import type { Membro } from "@/fetchs/fetchMembros";

//limite padrão da API (RF-12), que combina com o grid de 3 colunas (SPEC-005, D-3)
export const LIMITE_PROJETOS = 9;

//projeto como o GET /projetos devolve: status é o objeto do cadastro e membros são usuários
export interface Projeto {
    id: number;
    nome: string;
    descricao: string | null;
    idStatus: number;
    data_inicio: string | null;
    data_final: string | null;
    status: Status;
    membros: Membro[];
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

//corpo do POST /projetos
export interface DadosProjeto {
    nome: string;
    descricao?: string;
    idStatus: number;
    data_inicio?: string;
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

//o retorno do POST não traz status nem membros: a tela recarrega a lista depois
export const createProjeto = async (dados: DadosProjeto) => {
    return apiClient<{ id: number; nome: string }>(`/projetos`, {
        method: "POST",
        body: JSON.stringify(dados),
    });
}
