import { useEffect, useRef, useState } from "react";
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

//null enquanto carrega ou se a leitura falhou (o menu mostra só o Sair; a tela de Usuários trata como comum).
//Relê quando a janela volta ao foco e, com relerAoMontar, ao montar: o papel pode ter mudado por outro admin (RF-97).
//Durante a releitura, devolve o valor anterior (sem piscar)
export const useUsuarioLogado = ({ relerAoMontar = false }: { relerAoMontar?: boolean } = {}): Usuario | null => {
    const { usuario } = useAuth();
    const id = usuario?.id;
    //lido: o que a última leitura trouxe; o cache vale primeiro (outra tela já leu)
    const [lido, setLido] = useState<Usuario | null>(null);
    const [versao, setVersao] = useState(0);

    useEffect(() => {
        const reler = () => setVersao((v) => v + 1);
        const aoFocar = () => { if (id) cache.delete(id); reler(); };
        window.addEventListener(EVENTO, reler);
        window.addEventListener("focus", aoFocar);
        return () => { window.removeEventListener(EVENTO, reler); window.removeEventListener("focus", aoFocar); };
    }, [id]);

    //na primeira execução, com relerAoMontar, ignora o cache e busca de novo
    const primeira = useRef(relerAoMontar);
    useEffect(() => {
        const forcar = primeira.current;
        primeira.current = false;
        if (!id || (cache.has(id) && !forcar)) return;
        let ativo = true;
        fetchUsuario(id)
            .then((u) => { cache.set(id, u); if (ativo) setLido(u); })
            .catch(() => { /* sem o usuário: quem usa trata como ausente */ });
        return () => { ativo = false };
    }, [id, versao]);

    if (!id) return null;
    return cache.get(id) ?? (lido?.id === id ? lido : null);
};
