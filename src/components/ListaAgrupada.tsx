import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import LinhaTarefa from "./LinhaTarefa";
import StatusIcon from "./StatusIcon";
import { comMotivo } from "@/api/apiClient";
import { ordenarStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchTarefas, type DadosEdicaoTarefa, type FiltrosTarefa, type Tarefa } from "@/fetchs/fetchTarefas";

interface Grupo {
    tarefas: Tarefa[];
    //contagem do grupo: o `total` da resposta (RF-45)
    total: number;
    //quantas páginas de 10 já foram carregadas ("Mostrar mais")
    paginas: number;
}

interface ListaAgrupadaProps {
    //filtros da tela (inclusive idProjeto); com idStatus, só aquele grupo aparece
    filtros: FiltrosTarefa;
    statusOptions: Status[];
    //muda depois de uma troca na linha: os grupos são relidos, mantendo o "Mostrar mais" de cada um
    recarga: number;
    onTrocar: (id: number, dados: DadosEdicaoTarefa) => void;
}

const semRepetir = (tarefas: Tarefa[]) => tarefas.filter((t, i) => tarefas.findIndex((x) => x.id === t.id) === i);

//lista agrupada por status (RF-45): um GET /tarefas?idStatus=S por grupo, paginado por grupo
const ListaAgrupada = ({ filtros, statusOptions, recarga, onTrocar }: ListaAgrupadaProps) => {
    const chave = JSON.stringify(filtros);
    const visiveis = useMemo(() => {
        const ordenados = ordenarStatus(statusOptions);
        const { idStatus } = JSON.parse(chave) as FiltrosTarefa;
        return idStatus ? ordenados.filter((s) => s.id === idStatus) : ordenados;
    }, [statusOptions, chave]);

    const [grupos, setGrupos] = useState<Record<number, Grupo>>({});
    //grupo recolhido ou aberto pelo usuário; sem escolha, os de status isFinal começam recolhidos
    const [abertos, setAbertos] = useState<Record<number, boolean>>({});
    const paginas = useRef<Record<number, number>>({});
    const ultimaChave = useRef<string | null>(null);

    useEffect(() => {
        let ativo = true;
        //filtro novo: todos os grupos recomeçam da página 1; releitura depois de uma troca: mantém as páginas
        if (ultimaChave.current !== chave) paginas.current = {};
        ultimaChave.current = chave;
        const base = JSON.parse(chave) as FiltrosTarefa;

        Promise.all(visiveis.map(async (s): Promise<[number, Grupo]> => {
            const ate = paginas.current[s.id] ?? 1;
            const respostas = [];
            for (let p = 1; p <= ate; p++) respostas.push(await fetchTarefas(p, { ...base, idStatus: s.id }));
            const ultima = respostas[respostas.length - 1];
            return [s.id, { tarefas: semRepetir(respostas.flatMap((r) => r.data)), total: ultima.total, paginas: ate }];
        }))
            .then((lidos) => { if (ativo) setGrupos(Object.fromEntries(lidos)); })
            .catch((error) => toast.error(comMotivo("Erro ao buscar tarefas", error)));
        return () => { ativo = false };
    }, [chave, recarga, visiveis]);

    const mostrarMais = async (s: Status) => {
        const atual = grupos[s.id];
        if (!atual) return;
        const proxima = atual.paginas + 1;
        try {
            const resposta = await fetchTarefas(proxima, { ...filtros, idStatus: s.id });
            paginas.current[s.id] = proxima;
            setGrupos((g) => ({ ...g, [s.id]: { tarefas: semRepetir([...(g[s.id]?.tarefas ?? []), ...resposta.data]), total: resposta.total, paginas: proxima } }));
        } catch (error) {
            toast.error(comMotivo("Erro ao buscar mais tarefas", error));
        }
    }

    return (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#1C1F23] bg-[#0E1012]">
            <Table>
                {visiveis.map((s) => {
                    const grupo = grupos[s.id];
                    const aberto = abertos[s.id] ?? !s.isFinal;
                    return (
                        <TableBody key={s.id} data-grupo={s.id}>
                            <TableRow className="border-[#14171A] bg-[#101316] hover:bg-[#101316]">
                                <TableCell colSpan={7} className="p-0">
                                    <button
                                        type="button"
                                        data-grupo-cabecalho
                                        aria-expanded={aberto}
                                        onClick={() => setAbertos((a) => ({ ...a, [s.id]: !aberto }))}
                                        className="flex h-9 w-full items-center gap-2 px-3 text-left outline-none hover:bg-[#131619] focus-visible:bg-[#131619]"
                                    >
                                        <ChevronRight aria-hidden="true" className={`size-3.5 text-[#61666C] transition-transform ${aberto ? "rotate-90" : ""}`} />
                                        <StatusIcon status={s} todos={statusOptions} />
                                        <span data-grupo-nome className="text-[13px] font-medium text-[#E7E4DF]">{s.nome}</span>
                                        {grupo && <span data-contagem className="font-mono text-[12px] text-[#6E7379]">{grupo.total}</span>}
                                    </button>
                                </TableCell>
                            </TableRow>
                            {aberto && grupo?.tarefas.map((t) => (
                                <LinhaTarefa key={t.id} tarefa={t} statusOptions={statusOptions} onTrocar={onTrocar} />
                            ))}
                            {aberto && grupo && grupo.total === 0 && (
                                <TableRow className="border-[#14171A] hover:bg-transparent">
                                    <TableCell colSpan={7} className="pl-10 text-[12.5px] text-[#61666C]">Nenhuma tarefa</TableCell>
                                </TableRow>
                            )}
                            {aberto && grupo && grupo.tarefas.length < grupo.total && (
                                <TableRow className="border-[#14171A] hover:bg-transparent">
                                    <TableCell colSpan={7} className="py-1 pl-8">
                                        <Button variant="ghost" size="sm" className="text-[#8A9098]" onClick={() => mostrarMais(s)}>Mostrar mais</Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    );
                })}
            </Table>
        </div>
    );
};

export default ListaAgrupada;
