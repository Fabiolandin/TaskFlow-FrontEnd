import { useEffect, useState } from "react";

//tema do app (RF-69): escuro é o padrão; "sistema" segue o prefers-color-scheme
export type Tema = "escuro" | "claro" | "sistema";
export const TEMAS: { valor: Tema; rotulo: string }[] = [
    { valor: "escuro", rotulo: "Escuro" },
    { valor: "claro", rotulo: "Claro" },
    { valor: "sistema", rotulo: "Seguir o sistema" },
];

//por navegador, não por usuário: o tema vale também no login e é lido pelo index.html antes do React
//(a mesma chave aparece no script do index.html)
export const CHAVE_TEMA = "taskflow:tema";
export const EVENTO_TEMA = "taskflow:tema";

const midiaClara = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null);

export const lerTema = (): Tema => {
    try {
        const salvo = localStorage.getItem(CHAVE_TEMA);
        return salvo === "claro" || salvo === "sistema" ? salvo : "escuro";
    } catch {
        return "escuro";
    }
};

//o tema efetivo: "sistema" vira claro ou escuro pelo sistema operacional
export const resolverTema = (tema: Tema): "escuro" | "claro" => (tema === "sistema" ? (midiaClara()?.matches ? "claro" : "escuro") : tema);

//aplica no <html> e avisa quem lê token por JS (os gráficos)
export const aplicarTema = (tema: Tema) => {
    const raiz = document.documentElement;
    if (resolverTema(tema) === "claro") raiz.setAttribute("data-theme", "light");
    else raiz.removeAttribute("data-theme");
    window.dispatchEvent(new Event(EVENTO_TEMA));
};

//chamado uma vez no main.tsx: aplica o salvo e acompanha o sistema quando a escolha é "sistema"
export const iniciarTema = () => {
    aplicarTema(lerTema());
    midiaClara()?.addEventListener("change", () => { if (lerTema() === "sistema") aplicarTema("sistema"); });
};

export const useTema = (): [Tema, (tema: Tema) => void] => {
    const [tema, setTema] = useState<Tema>(lerTema);
    useEffect(() => {
        const reler = () => setTema(lerTema());
        window.addEventListener(EVENTO_TEMA, reler);
        return () => window.removeEventListener(EVENTO_TEMA, reler);
    }, []);
    const mudar = (novo: Tema) => {
        try {
            localStorage.setItem(CHAVE_TEMA, novo);
        } catch {
            //sem localStorage: vale até recarregar
        }
        setTema(novo);
        aplicarTema(novo);
    };
    return [tema, mudar];
};
