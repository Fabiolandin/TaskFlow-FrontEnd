import type { StatusSprint } from "@/fetchs/fetchSprints";

//status da sprint (RF-109): Planejamento azul, Ativa verde, Fechada neutro
const COR: Record<StatusSprint, string> = {
    Planejamento: "bg-tom-azul-fundo text-tom-azul-texto",
    Ativa: "bg-tom-verde-fundo text-tom-verde-texto",
    Fechada: "bg-tom-neutro-fundo text-tom-neutro-texto",
};

const SeloStatusSprint = ({ status }: { status: StatusSprint }) => (
    <span data-status-sprint={status} className={`rounded px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[.08em] ${COR[status]}`}>{status}</span>
);

export default SeloStatusSprint;
