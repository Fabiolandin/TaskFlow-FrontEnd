//avatar de usuário (RF-74): iniciais e tom fixo por id
const TONS = ["verde", "laranja", "azul", "rosa", "ambar", "vermelho"] as const;

//"Ana Ribeiro" → AR; "admin12" → AD; nome vazio → ?
export const iniciais = (nome: string) => {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

export const tomDoUsuario = (id: number) => TONS[((id % TONS.length) + TONS.length) % TONS.length];
