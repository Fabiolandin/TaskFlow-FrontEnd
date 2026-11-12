import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

//preferências de tela salvas no navegador, por usuário (RF-59, RF-60); localStorage indisponível = valor padrão
const chaveDe = (idUsuario: number | undefined, nome: string) => `taskflow:${idUsuario ?? "anonimo"}:${nome}`;

const ler = (chave: string, padrao: boolean) => {
    try {
        const salvo = localStorage.getItem(chave);
        return salvo === null ? padrao : salvo === "1";
    } catch {
        return padrao;
    }
};

const gravar = (chave: string, valor: boolean) => {
    try {
        localStorage.setItem(chave, valor ? "1" : "0");
    } catch {
        //sem localStorage: a escolha vale só até recarregar
    }
};

//liga/desliga salvo por usuário; cada tela que usa lê o valor ao montar
export const usePreferencia = (nome: string, padrao: boolean): [boolean, (valor: boolean) => void] => {
    const { usuario } = useAuth();
    const chave = chaveDe(usuario?.id, nome);
    const [valor, setValor] = useState(() => ler(chave, padrao));
    const mudar = (novo: boolean) => {
        setValor(novo);
        gravar(chave, novo);
    };
    return [valor, mudar];
};

export const PREF_MENU_RECOLHIDO = "menu-recolhido";
export const PREF_PAINEL_RECOLHIDO = "painel-recolhido";
