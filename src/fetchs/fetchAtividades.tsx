import { apiClient } from "@/api/apiClient";
import type { Membro } from "@/fetchs/fetchMembros";

//atividade do histórico da tarefa (RF-54): autor null quando o usuário foi excluído
export interface Atividade {
    id: number;
    idTarefa: number;
    campo: string;
    valorAnterior: string | null;
    valorNovo: string | null;
    idAnterior: number | null;
    idNovo: number | null;
    createdAt: string;
    idUsuario: number | null;
    nomeUsuario: string;
    autor: Membro | null;
}

//em ordem crescente de createdAt e id, sem paginação
export const fetchAtividades = async (idTarefa: number) => {
    return apiClient<Atividade[]>(`/tarefas/${idTarefa}/atividades`, {
        method: "GET",
    });
}

//AAAA-MM-DD → DD/MM/AAAA (o dia gravado, sem fuso)
const dataBR = (dia: string | null) => (dia ? dia.split("-").reverse().join("/") : "");

//nome do valor nas frases que admitem "definiu" e "removeu" (responsável e datas)
const NOMES: Record<string, string> = {
    responsavel: "o responsável",
    data_inicio: "a data de início",
    data_final: "o prazo",
};

//frase do RF-55; o autor é o nome atual, ou o gravado com "(excluído)"
export const fraseDaAtividade = (a: Atividade) => {
    const autor = a.autor ? a.autor.nome : `${a.nomeUsuario} (excluído)`;
    const data = a.campo === "data_inicio" || a.campo === "data_final";
    const antes = data ? dataBR(a.valorAnterior) : a.valorAnterior;
    const depois = data ? dataBR(a.valorNovo) : a.valorNovo;
    switch (a.campo) {
        case "status": return `${autor} mudou o status de ${antes} para ${depois}`;
        case "prioridade": return `${autor} mudou a prioridade de ${antes} para ${depois}`;
        case "projeto": return `${autor} mudou o projeto de ${antes} para ${depois}`;
        case "label": return a.valorNovo !== null ? `${autor} adicionou a label ${a.valorNovo}` : `${autor} removeu a label ${a.valorAnterior}`;
        case "nome": return `${autor} mudou o título`;
        case "descricao": return `${autor} mudou a descrição`;
        case "responsavel":
        case "data_inicio":
        case "data_final": {
            const nome = NOMES[a.campo];
            if (!a.valorAnterior) return `${autor} definiu ${nome} como ${depois}`;
            if (!a.valorNovo) return `${autor} removeu ${nome}`;
            return `${autor} mudou ${nome} de ${antes} para ${depois}`;
        }
        default: return `${autor} alterou a tarefa`;
    }
}
