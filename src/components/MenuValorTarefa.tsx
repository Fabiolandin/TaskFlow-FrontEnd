import type { MouseEvent } from "react";
import { CheckIcon } from "lucide-react";
import StatusIcon from "./StatusIcon";
import PrioridadeIcon from "./PrioridadeIcon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ordenarStatus, type Status } from "@/fetchs/fetchStatus";
import { PRIORIDADES, type Tarefa } from "@/fetchs/fetchTarefas";

//o clique no ícone (e no menu, que é portal mas propaga pela árvore do React) não abre a tarefa (RF-44)
const naoPropaga = (e: MouseEvent) => e.stopPropagation();
const estiloGatilho = "flex h-7 max-w-full items-center gap-2 rounded-md px-1.5 -mx-1.5 text-[13px] text-[#A9AEB4] outline-none hover:bg-[#1B1F23] hover:text-[#E7E4DF] focus-visible:ring-2 focus-visible:ring-[#3A3F45] data-[state=open]:bg-[#1B1F23]";

interface MenuStatusProps {
    status: Tarefa["status"];
    //cadastro de status de tarefa, na ordem do RF-43
    statusOptions: Status[];
    onEscolher: (idStatus: number) => void;
}

//ícone de status da linha, que abre o menu com os status; escolher o atual não grava
export const MenuStatus = ({ status, statusOptions, onEscolher }: MenuStatusProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button type="button" data-campo="status" aria-label={`Status: ${status.nome}`} className={estiloGatilho} onClick={naoPropaga}>
                <StatusIcon status={status} todos={statusOptions} />
                <span className="truncate">{status.nome}</span>
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={naoPropaga}>
            {ordenarStatus(statusOptions).map((s) => (
                <DropdownMenuItem key={s.id} onSelect={() => { if (s.id !== status.id) onEscolher(s.id); }}>
                    <StatusIcon status={s} todos={statusOptions} />
                    <span className="truncate">{s.nome}</span>
                    {s.id === status.id && <CheckIcon aria-hidden="true" className="ml-auto size-4 text-[#7C8189]" />}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);

interface MenuPrioridadeProps {
    prioridade: string;
    onEscolher: (prioridade: string) => void;
}

export const MenuPrioridade = ({ prioridade, onEscolher }: MenuPrioridadeProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button type="button" data-campo="prioridade" aria-label={`Prioridade: ${prioridade}`} className={estiloGatilho} onClick={naoPropaga}>
                <PrioridadeIcon prioridade={prioridade} />
                <span className="truncate">{prioridade}</span>
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={naoPropaga}>
            {PRIORIDADES.map((p) => (
                <DropdownMenuItem key={p} onSelect={() => { if (p !== prioridade) onEscolher(p); }}>
                    <PrioridadeIcon prioridade={p} />
                    <span>{p}</span>
                    {p === prioridade && <CheckIcon aria-hidden="true" className="ml-auto size-4 text-[#7C8189]" />}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);
