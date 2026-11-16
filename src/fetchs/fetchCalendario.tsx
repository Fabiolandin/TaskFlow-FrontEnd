import { apiClient } from "@/api/apiClient";

//SPEC-023: datas vão como AAAA-MM-DD; voltam como ISO à meia-noite UTC (ler com dataParaInput/formatarDia)

export const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];
export const ROTULO_DIA: Record<DiaSemana, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };

export type MinutosDaSemana = Record<DiaSemana, number>;

export interface Jornada extends MinutosDaSemana {
    id: number;
    idUsuario: number;
    vigencia: string;
}

export interface Feriado {
    id: number;
    data: string;
    nome: string;
    //null = dia inteiro
    minutosDescontados: number | null;
}

export const TIPOS_AUSENCIA = ["Ferias", "Folga", "Atestado", "Outro"] as const;
export type TipoAusencia = (typeof TIPOS_AUSENCIA)[number];
export const ROTULO_TIPO: Record<TipoAusencia, string> = { Ferias: "Férias", Folga: "Folga", Atestado: "Atestado", Outro: "Outro" };

export interface Ausencia {
    id: number;
    idUsuario: number;
    tipo: TipoAusencia;
    dataInicio: string;
    dataFim: string;
    //null = dia inteiro
    minutosPorDia: number | null;
    observacao: string | null;
}

export interface DiaCapacidade {
    data: string;
    jornada: number;
    desconto: number;
    motivo: string | null;
    capacidade: number;
    util: boolean;
}

const json = (body: object) => JSON.stringify(body);

// RF-101
export const fetchJornadas = (idUsuario?: number) => apiClient<Jornada[]>(`/jornadas${idUsuario ? `?idUsuario=${idUsuario}` : ""}`);
export const createJornada = (dados: { idUsuario: number; vigencia: string } & MinutosDaSemana) => apiClient<Jornada>("/jornadas", { method: "POST", body: json(dados) });
export const updateJornada = (id: number, dados: { vigencia: string } & MinutosDaSemana) => apiClient<Jornada>(`/jornadas/${id}`, { method: "PATCH", body: json(dados) });
export const deleteJornada = (id: number) => apiClient(`/jornadas/${id}`, { method: "DELETE" });

// RF-102, RF-103
export const fetchFeriados = (ano: number) => apiClient<Feriado[]>(`/feriados?ano=${ano}`);
export const createFeriado = (dados: Omit<Feriado, "id">) => apiClient<Feriado>("/feriados", { method: "POST", body: json(dados) });
export const updateFeriado = (id: number, dados: Omit<Feriado, "id">) => apiClient<Feriado>(`/feriados/${id}`, { method: "PATCH", body: json(dados) });
export const deleteFeriado = (id: number) => apiClient(`/feriados/${id}`, { method: "DELETE" });
export const importarFeriados = (ano: number) => apiClient<{ criados: number; ignorados: number }>("/feriados/importar", { method: "POST", body: json({ ano }) });

// RF-104
export const fetchAusencias = (filtro: { idUsuario?: number; inicio?: string; fim?: string }) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtro)) if (valor !== undefined) params.set(chave, String(valor));
    return apiClient<Ausencia[]>(`/ausencias?${params.toString()}`);
};
export type DadosAusencia = Omit<Ausencia, "id">;
export const createAusencia = (dados: DadosAusencia) => apiClient<Ausencia>("/ausencias", { method: "POST", body: json(dados) });
export const updateAusencia = (id: number, dados: Omit<DadosAusencia, "idUsuario">) => apiClient<Ausencia>(`/ausencias/${id}`, { method: "PATCH", body: json(dados) });
export const deleteAusencia = (id: number) => apiClient(`/ausencias/${id}`, { method: "DELETE" });

// RF-106
export const fetchCapacidade = (idUsuario: number, inicio: string, fim: string) =>
    apiClient<{ dias: DiaCapacidade[]; total: number }>(`/capacidade?idUsuario=${idUsuario}&inicio=${inicio}&fim=${fim}`);
