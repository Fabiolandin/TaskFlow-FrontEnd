//barras cheias por prioridade; Urgente é o ícone de alerta (RF-43)
const BARRAS: Record<string, number> = { Baixa: 1, "Média": 2, Alta: 3 };
//tons do tema (SPEC-020): Baixa neutro, Média azul, Alta âmbar, Urgente vermelho
const CORES: Record<string, string> = { Baixa: "var(--tf-tom-neutro-texto)", "Média": "var(--tf-tom-azul-texto)", Alta: "var(--tf-tom-ambar-texto)", Urgente: "var(--tf-tom-vermelho-texto)" };

interface PrioridadeIconProps {
    prioridade: string;
    tamanho?: number;
    className?: string;
}

const PrioridadeIcon = ({ prioridade, tamanho = 14, className = "" }: PrioridadeIconProps) => {
    const urgente = prioridade === "Urgente";
    const cheias = BARRAS[prioridade] ?? 0;

    return (
        <svg
            role="img"
            aria-label={prioridade}
            data-forma={urgente ? "alerta" : "barras"}
            width={tamanho}
            height={tamanho}
            viewBox="0 0 14 14"
            className={`shrink-0 ${className}`}
            style={{ color: CORES[prioridade] ?? "var(--tf-tom-neutro-texto)" }}
        >
            <title>{prioridade}</title>
            {urgente ? (
                <>
                    <rect x="1" y="1" width="12" height="12" rx="3" fill="currentColor" />
                    <rect x="6.25" y="3.4" width="1.5" height="4.8" rx="0.75" style={{ fill: "var(--tf-fundo)" }} />
                    <circle cx="7" cy="10.2" r="0.95" style={{ fill: "var(--tf-fundo)" }} />
                </>
            ) : (
                [4, 7, 10].map((altura, i) => (
                    <rect
                        key={altura}
                        x={1.5 + i * 4}
                        y={12.5 - altura}
                        width="3"
                        height={altura}
                        rx="0.75"
                        fill="currentColor"
                        opacity={i < cheias ? 1 : 0.25}
                        data-cheia={i < cheias ? "true" : "false"}
                    />
                ))
            )}
        </svg>
    );
};

export default PrioridadeIcon;
