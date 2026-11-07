//id do usuário logado, lido do `sub` do token (SPEC-007, RF-38); o servidor segue sendo quem valida
export interface UsuarioLogado {
    id: number;
}

//lê o `sub` do payload do JWT (base64url, sem biblioteca); null se o token estiver ausente ou ilegível
export const lerUsuarioDoToken = (token: string | null): UsuarioLogado | null => {
    if (!token) return null;
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
        const id = Number(JSON.parse(json)?.sub);
        return Number.isInteger(id) && id > 0 ? { id } : null;
    } catch {
        return null;
    }
};
