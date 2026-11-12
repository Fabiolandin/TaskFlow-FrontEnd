//prioridade em badge (RF-75): tom do tema por prioridade
const TOM: Record<string, string> = { Urgente: "vermelho", Alta: "ambar", "Média": "azul", Baixa: "neutro" };

interface BadgePrioridadeProps {
    prioridade: string;
    className?: string;
}

const BadgePrioridade = ({ prioridade, className = "" }: BadgePrioridadeProps) => {
    const tom = TOM[prioridade] ?? "neutro";
    return (
        <span
            data-prioridade={prioridade}
            className={`inline-flex shrink-0 items-center rounded-badge px-1.5 py-[3px] font-mono text-[10px] uppercase leading-none tracking-[.06em] ${className}`}
            style={{ color: `var(--tf-tom-${tom}-texto)`, background: `var(--tf-tom-${tom}-fundo)` }}
        >
            {prioridade}
        </span>
    );
};

export default BadgePrioridade;
