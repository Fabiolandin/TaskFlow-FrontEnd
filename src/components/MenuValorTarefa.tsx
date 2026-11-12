import { useRef, useState, type MouseEvent } from "react";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import StatusIcon from "./StatusIcon";
import BadgePrioridade from "./BadgePrioridade";
import Avatar from "./Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { comMotivo } from "@/api/apiClient";
import { ordenarStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchProjeto } from "@/fetchs/fetchProjetos";
import type { Membro } from "@/fetchs/fetchMembros";
import { AVISO_PRAZO, dataParaInput, PRIORIDADES, prazoAntesDoInicio, type Tarefa } from "@/fetchs/fetchTarefas";
import { formatarDia } from "@/utils/formaters/fdata";

//o clique no ícone (e no menu, que é portal mas propaga pela árvore do React) não abre a tarefa (RF-44)
const naoPropaga = (e: MouseEvent) => e.stopPropagation();
const estiloGatilho = "flex h-7 max-w-full items-center gap-2 rounded-md px-1.5 -mx-1.5 text-[13px] text-texto-suave outline-none hover:bg-realce hover:text-texto focus-visible:ring-2 focus-visible:ring-foco data-[state=open]:bg-realce";

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
                    {s.id === status.id && <CheckIcon aria-hidden="true" className="ml-auto size-4 text-texto-fraco" />}
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
                <BadgePrioridade prioridade={prioridade} />
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={naoPropaga}>
            {PRIORIDADES.map((p) => (
                <DropdownMenuItem key={p} onSelect={() => { if (p !== prioridade) onEscolher(p); }}>
                    <BadgePrioridade prioridade={p} />
                    {p === prioridade && <CheckIcon aria-hidden="true" className="ml-auto size-4 text-texto-fraco" />}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);

interface MenuResponsavelProps {
    idProjeto: number;
    responsavel: Tarefa["responsavel"];
    //null = sem responsável
    onEscolher: (idUsuario: number | null) => void;
    //só o avatar no gatilho, alinhado à direita (linha de tarefa, RF-78); o padrão mostra avatar e nome
    soAvatar?: boolean;
}

//responsável só pode ser membro do projeto da tarefa (RF-26): os membros são lidos ao abrir o menu
export const MenuResponsavel = ({ idProjeto, responsavel, onEscolher, soAvatar = false }: MenuResponsavelProps) => {
    const [membros, setMembros] = useState<Membro[] | null>(null);

    const aoAbrir = (aberto: boolean) => {
        if (!aberto) return;
        setMembros(null);
        fetchProjeto(idProjeto)
            .then((p) => setMembros(p.membros))
            .catch((error) => toast.error(comMotivo("Erro ao buscar os membros do projeto", error)));
    }
    const escolher = (id: number | null) => { if (id !== (responsavel?.id ?? null)) onEscolher(id); };

    return (
        <DropdownMenu onOpenChange={aoAbrir}>
            <DropdownMenuTrigger asChild>
                <button type="button" data-campo="responsavel" aria-label={`Responsável: ${responsavel?.nome ?? "sem responsável"}`}
                    title={soAvatar ? (responsavel?.nome ?? "Sem responsável") : undefined}
                    className={soAvatar ? "flex size-7 items-center justify-center rounded-full outline-none hover:bg-realce focus-visible:ring-2 focus-visible:ring-foco data-[state=open]:bg-realce" : estiloGatilho} onClick={naoPropaga}>
                    {responsavel
                        ? <Avatar usuario={responsavel} tamanho={soAvatar ? 24 : 20} />
                        : soAvatar && <span data-sem-responsavel className="size-6 rounded-full border border-dashed border-borda-forte" />}
                    {!soAvatar && <span className={`truncate ${responsavel ? "" : "text-texto-mudo"}`}>{responsavel?.nome ?? "Sem responsável"}</span>}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={naoPropaga}>
                <DropdownMenuItem onSelect={() => escolher(null)}>
                    <span className="text-texto-fraco">Sem responsável</span>
                    {!responsavel && <CheckIcon aria-hidden="true" className="ml-auto size-4 text-texto-fraco" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {membros === null && <DropdownMenuItem disabled>Carregando…</DropdownMenuItem>}
                {membros?.length === 0 && <DropdownMenuItem disabled>Projeto sem membros</DropdownMenuItem>}
                {membros?.map((m) => (
                    <DropdownMenuItem key={m.id} onSelect={() => escolher(m.id)}>
                        <Avatar usuario={m} tamanho={20} />
                        <span className="truncate">{m.nome}</span>
                        {m.id === responsavel?.id && <CheckIcon aria-hidden="true" className="ml-auto size-4 text-texto-fraco" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface CampoPrazoProps {
    tarefa: Pick<Tarefa, "data_inicio" | "data_final">;
    //AAAA-MM-DD, ou null para limpar
    onEscolher: (prazo: string | null) => void;
}

//prazo da linha: o texto abre o calendário nativo; "Limpar" do calendário tira o prazo; antes do início não grava (L-1)
export const CampoPrazo = ({ tarefa, onEscolher }: CampoPrazoProps) => {
    const entrada = useRef<HTMLInputElement>(null);
    const atual = dataParaInput(tarefa.data_final);

    const abrir = (e: MouseEvent) => {
        e.stopPropagation();
        const campo = entrada.current;
        if (!campo) return;
        try { campo.showPicker(); } catch { campo.focus(); }
    }
    const mudar = (valor: string) => {
        if (valor === atual) return;
        if (prazoAntesDoInicio(dataParaInput(tarefa.data_inicio), valor)) { toast.error(AVISO_PRAZO); return; }
        onEscolher(valor || null);
    }

    return (
        <span className="relative inline-flex">
            <button type="button" data-campo="prazo" aria-label={`Prazo: ${atual || "sem prazo"}`} onClick={abrir}
                className={`${estiloGatilho} font-mono text-[12px] text-texto-fraco`}>
                {formatarDia(tarefa.data_final)}
            </button>
            <input ref={entrada} type="date" tabIndex={-1} aria-hidden="true" value={atual}
                onClick={naoPropaga} onChange={(e) => mudar(e.target.value)}
                className="pointer-events-none absolute inset-0 opacity-0" />
        </span>
    );
}
