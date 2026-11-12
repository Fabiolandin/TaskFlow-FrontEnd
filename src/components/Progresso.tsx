import type { Projeto } from "@/fetchs/fetchProjetos";

//progresso do projeto (RF-49), calculado no servidor: "X de Y concluídas", ou "Sem tarefas" com total 0
const Progresso = ({ progresso }: { progresso: Projeto["progresso"] }) => {
    const { total, concluidas } = progresso;
    const pct = total ? Math.round((concluidas / total) * 100) : 0;
    return (
        <div data-progresso className="flex flex-col gap-1.5">
            <span data-progresso-texto className="font-mono text-[12px] text-texto-fraco">
                {total === 0 ? "Sem tarefas" : `${concluidas} de ${total} concluídas`}
            </span>
            {total > 0 && (
                <span aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-realce">
                    <span className="block h-full rounded-full bg-tom-verde-texto" style={{ width: `${pct}%` }} />
                </span>
            )}
        </div>
    );
};

export default Progresso;
