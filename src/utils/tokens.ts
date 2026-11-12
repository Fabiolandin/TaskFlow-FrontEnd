import { useEffect, useState } from "react";
import { EVENTO_TEMA } from "./tema";

//valor atual de um token do tema (RF-68), para quem não aceita var() (ex.: atributos do recharts)
export const lerToken = (nome: string) => getComputedStyle(document.documentElement).getPropertyValue(`--tf-${nome}`).trim();

//lê vários tokens e relê quando o tema muda
export const useTokens = <T extends string>(nomes: readonly T[]): Record<T, string> => {
    const ler = () => Object.fromEntries(nomes.map((n) => [n, lerToken(n)])) as Record<T, string>;
    const [valores, setValores] = useState(ler);
    useEffect(() => {
        const reler = () => setValores(ler());
        window.addEventListener(EVENTO_TEMA, reler);
        return () => window.removeEventListener(EVENTO_TEMA, reler);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return valores;
};
