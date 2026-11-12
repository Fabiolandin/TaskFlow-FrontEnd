import { iniciais, tomDoUsuario } from "@/utils/avatar";

//avatar de usuário (RF-74): duas iniciais em mono, cor fixa por id (id % 6) num par de tom do tema
interface AvatarProps {
    usuario: { id: number; nome: string };
    tamanho?: number;
    //quadrado com raio de 8px (cartão do menu); o padrão é redondo
    quadrado?: boolean;
    className?: string;
}

const Avatar = ({ usuario, tamanho = 24, quadrado = false, className = "" }: AvatarProps) => {
    const tom = tomDoUsuario(usuario.id);
    return (
        <span
            role="img"
            data-avatar={usuario.id}
            title={usuario.nome}
            aria-label={usuario.nome}
            className={`flex shrink-0 select-none items-center justify-center font-mono font-medium ${quadrado ? "rounded-controle" : "rounded-full"} ${className}`}
            style={{
                width: tamanho, height: tamanho, fontSize: Math.max(9, Math.round(tamanho * 0.4)),
                color: `var(--tf-tom-${tom}-texto)`, background: `var(--tf-tom-${tom}-fundo)`,
            }}
        >
            {iniciais(usuario.nome)}
        </span>
    );
};

export default Avatar;
