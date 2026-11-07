import { apiClient } from "@/api/apiClient";

//números gerais das tarefas, calculados no servidor (SPEC-009, RF-39)
export interface TotalPorStatus {
    id: number;
    nome: string;
    cor: string | null;
    isFinal: boolean;
    total: number;
}

export interface TotalPorProjeto {
    id: number;
    nome: string;
    total: number;
}

export interface Dashboard {
    tarefas: {
        total: number;
        abertas: number;
        concluidas: number;
        atrasadas: number;
        porStatus: TotalPorStatus[];
        porProjeto: TotalPorProjeto[];
    };
}

export const fetchDashboard = async () => {
    return apiClient<Dashboard>("/dashboard", {
        method: "GET",
    });
}
