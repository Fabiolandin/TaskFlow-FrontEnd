//data relativa dos comentários (RF-37): "agora" com menos de um minuto; senão a maior unidade inteira
const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 3600],
    ["month", 30 * 24 * 3600],
    ["day", 24 * 3600],
    ["hour", 3600],
    ["minute", 60],
];

const formato = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function dataRelativa(data: string | Date, agora: Date = new Date()): string {
    const quando = typeof data === "string" ? new Date(data) : data;
    if (isNaN(quando.getTime())) return "-";

    const segundos = Math.floor((agora.getTime() - quando.getTime()) / 1000);
    //menos de um minuto, ou relógio do servidor um pouco à frente
    if (segundos < 60) return "agora";

    for (const [unidade, tamanho] of UNIDADES) {
        if (segundos >= tamanho) return formato.format(-Math.floor(segundos / tamanho), unidade);
    }
    return "agora";
}
