import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUsuario } from "@/fetchs/fetchUsuarios";
import type { Usuario } from "@/pages/usuarios";

//o usuário logado (nome, email e papel), lido de GET /usuarios/:id com o id do token (RF-73, RF-86).
//Cache por id no módulo: cada tela monta o próprio menu, e a leitura acontece uma vez
const cache = new Map<number, Usuario>();
const EVENTO = "taskflow:usuario-logado";

//depois de editar a própria conta: relê na próxima montagem e avisa quem está na tela
export const esquecerUsuarioLogado = (id: number) => {
    cache.delete(id);
    window.dispatchEvent(new Event(EVENTO));
};

//null enquanto carrega ou se a leitura falhou (o menu mostra só o Sair; a tela de Usuários trata como comum)
export const useUsuarioLogado = (): Usuario | null => {
    const { usuario } = useAuth();
    const id = usuario?.id;
    //lido: o que a última leitura trouxe; o cache vale primeiro (outra tela já leu)
    const [lido, setLido] = useState<Usuario | null>(null);
    const [versao, setVersao] = useState(0);

    useEffect(() => {
        const reler = () => setVersao((v) => v + 1);
        window.addEventListener(EVENTO, reler);
        return () => window.removeEventListener(EVENTO, reler);
    }, []);

    useEffect(() => {
        if (!id || cache.has(id)) return;
        let ativo = true;
        fetchUsuario(id)
            .then((u) => { cache.set(id, u); if (ativo) setLido(u); })
            .catch(() => { /* sem o usuário: quem usa trata como ausente */ });
        return () => { ativo = false };
    }, [id, versao]);

    if (!id) return null;
    return cache.get(id) ?? (lido?.id === id ? lido : null);
};
