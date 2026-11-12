import { COR_RESERVA, ordenarStatus, type Status } from "@/fetchs/fetchStatus";

interface StatusIconProps {
    //o status da tarefa (a tarefa traz só id, nome, cor e isFinal)
    status: Pick<Status, "id" | "nome" | "cor" | "isFinal">;
    //o cadastro de status de tarefa inteiro: decide quem é o primeiro na ordem
    todos: Status[];
    tamanho?: number;
    className?: string;
}

//ícone de status (RF-43): check quando isFinal (mesmo sendo o primeiro), vazio no primeiro da ordem, metade nos demais
const StatusIcon = ({ status, todos, tamanho = 14, className = "" }: StatusIconProps) => {
    const primeiro = ordenarStatus(todos)[0]?.id === status.id;
    const forma = status.isFinal ? "check" : primeiro ? "vazio" : "metade";

    return (
        <svg
            role="img"
            aria-label={status.nome}
            data-forma={forma}
            width={tamanho}
            height={tamanho}
            viewBox="0 0 14 14"
            className={`shrink-0 ${className}`}
            style={{ color: status.cor ?? COR_RESERVA }}
        >
            <title>{status.nome}</title>
            {forma === "check" ? (
                <>
                    <circle cx="7" cy="7" r="6.25" fill="currentColor" />
                    <path d="M4.3 7.2 6.2 9.1 9.8 5" fill="none" style={{ stroke: "var(--tf-fundo)" }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </>
            ) : (
                <>
                    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    {forma === "metade" && <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />}
                </>
            )}
        </svg>
    );
};

export default StatusIcon;
