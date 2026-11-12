import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FolderKanban, Search, SquareCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { comMotivo } from "@/api/apiClient";
import { buscarTarefas } from "@/fetchs/fetchTarefas";
import { buscarProjetos } from "@/fetchs/fetchProjetos";

interface Resultado {
    tipo: "tarefa" | "projeto";
    id: number;
    nome: string;
    rota: string;
}

//resultados de um texto; só aparecem enquanto o campo mostra esse mesmo texto
interface Resultados {
    texto: string;
    itens: Resultado[];
}

const ESPERA_MS = 250;

interface BuscaRapidaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

//Ctrl+K (RF-58): debounce de ~250 ms, 5 tarefas + 5 projetos em paralelo, setas + Enter, "Nada encontrado".
//O Layout monta com `key` nova a cada abertura: o campo começa vazio.
const BuscaRapida = ({ open, onOpenChange }: BuscaRapidaProps) => {
    const navigate = useNavigate();
    const [texto, setTexto] = useState("");
    const [resultados, setResultados] = useState<Resultados | null>(null);
    const [selecionado, setSelecionado] = useState(0);
    //cada pedido ganha um número; a resposta de um texto antigo nunca substitui a do atual
    const ultimo = useRef(0);

    useEffect(() => {
        const alvo = texto.trim();
        if (!alvo) return;
        const timer = setTimeout(async () => {
            const meu = ++ultimo.current;
            try {
                const [tarefas, projetos] = await Promise.all([buscarTarefas(alvo), buscarProjetos(alvo)]);
                if (meu !== ultimo.current) return;
                setResultados({
                    texto: alvo,
                    itens: [
                        ...tarefas.data.map((t): Resultado => ({ tipo: "tarefa", id: t.id, nome: t.nome, rota: `/tarefas/${t.id}` })),
                        ...projetos.data.map((p): Resultado => ({ tipo: "projeto", id: p.id, nome: p.nome, rota: `/projetos/${p.id}` })),
                    ],
                });
                setSelecionado(0);
            } catch (error) {
                if (meu === ultimo.current) toast.error(comMotivo("Erro na busca", error));
            }
        }, ESPERA_MS);
        return () => clearTimeout(timer);
    }, [texto]);

    const atuais = resultados && resultados.texto === texto.trim() ? resultados.itens : null;

    const abrir = (r: Resultado) => {
        onOpenChange(false);
        navigate(r.rota);
    }

    const teclas = (e: KeyboardEvent) => {
        if (!atuais || atuais.length === 0) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setSelecionado((i) => (i + 1) % atuais.length); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setSelecionado((i) => (i - 1 + atuais.length) % atuais.length); }
        else if (e.key === "Enter") { e.preventDefault(); abrir(atuais[Math.min(selecionado, atuais.length - 1)]); }
    }

    const grupo = (tipo: Resultado["tipo"], titulo: string) => {
        const itens = (atuais ?? []).map((r, i) => ({ r, i })).filter(({ r }) => r.tipo === tipo);
        if (itens.length === 0) return null;
        return (
            <div data-grupo-busca={tipo} className="py-1">
                <p className="px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-texto-mudo">{titulo}</p>
                {itens.map(({ r, i }) => (
                    <button
                        key={`${r.tipo}-${r.id}`}
                        type="button"
                        role="option"
                        aria-selected={i === selecionado}
                        data-resultado={r.rota}
                        onMouseMove={() => setSelecionado(i)}
                        onClick={() => abrir(r)}
                        className={`flex h-8 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13px] ${i === selecionado ? "bg-realce text-texto" : "text-texto-suave"}`}
                    >
                        {tipo === "tarefa"
                            ? <SquareCheck aria-hidden="true" className="size-3.5 shrink-0 text-texto-mudo" />
                            : <FolderKanban aria-hidden="true" className="size-3.5 shrink-0 text-texto-mudo" />}
                        <span className="truncate">{r.nome}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} data-busca-rapida className="top-[20%] w-[560px] translate-y-0 gap-0 overflow-hidden border border-borda-media bg-superficie p-0">
                <DialogTitle className="sr-only">Busca rápida</DialogTitle>
                <DialogDescription className="sr-only">Busque tarefas e projetos pelo nome</DialogDescription>
                <div className="flex h-12 items-center gap-2.5 border-b border-borda px-3">
                    <Search aria-hidden="true" className="size-4 text-texto-mudo" />
                    <input
                        aria-label="Buscar tarefas e projetos"
                        autoFocus
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={teclas}
                        placeholder="Buscar tarefas e projetos…"
                        className="h-full flex-1 bg-transparent text-[14px] text-texto outline-none placeholder:text-placeholder"
                    />
                    <kbd className="rounded border border-borda-media px-1.5 font-mono text-[10.5px] text-texto-mudo">Esc</kbd>
                </div>
                {atuais && (
                    <div role="listbox" aria-label="Resultados" className="max-h-[360px] overflow-y-auto p-1">
                        {atuais.length === 0
                            ? <p className="px-3 py-6 text-center text-[13px] text-texto-mudo">Nada encontrado</p>
                            : <>{grupo("tarefa", "Tarefas")}{grupo("projeto", "Projetos")}</>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default BuscaRapida;
