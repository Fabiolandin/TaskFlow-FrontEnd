//campo de data: o max com ano de 4 dígitos impede o navegador de aceitar anos como 202222 (a API também recusa)
export const DATA_MIN = "2000-01-01";
export const DATA_MAX = "2099-12-31";

//dia de hoje AAAA-MM-DD no relógio do usuário; toISOString daria o dia UTC (depois das 21h em Brasília, amanhã)
export const hojeLocal = () => {
    const d = new Date();
    const dois = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
};
