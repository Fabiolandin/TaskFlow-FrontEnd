// Formata datas vindas do back (ISO string do Prisma) para o padrão brasileiro

export function formatarData(data: string | Date | null | undefined): string {
    if (!data) return "-";

    const date = typeof data === "string" ? new Date(data) : data;

    if (isNaN(date.getTime())) return "-"; // data inválida

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function formatarDataHora(data: string | Date | null | undefined): string {
    if (!data) return "-";

    const date = typeof data === "string" ? new Date(data) : data;

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
