import { useCallback, useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Plus, Search, XIcon } from "lucide-react";
import Layout from "@/components/Layout";
import Avatar from "@/components/Avatar";
import CampoHoras from "@/components/CampoHoras";
import Cronograma from "@/components/Cronograma";
import SeloStatusSprint from "@/components/SeloStatusSprint";
import { MenuStatus } from "@/components/MenuValorTarefa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { comMotivo } from "@/api/apiClient";
import { ativarSprint, createItem, deleteItem, fecharSprint, fetchPlanejamento, fetchPreviaFechamento, reordenarFila, updateItem, type DestinoFechamento, type FilaDoDev, type ItemDaFila, type Planejamento, type PreviaFechamento, type Sprint } from "@/fetchs/fetchSprints";
import { fetchTarefas, updateTarefa, type Tarefa } from "@/fetchs/fetchTarefas";
import { fetchStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { formatarMinutos, lerHoras } from "@/utils/minutos";

const estiloHorasBacklog = "h-7 w-14 px-1 text-center text-[11.5px]";
import { useUsuarioLogado } from "@/utils/usuarioLogado";

//planejamento da sprint (RF-117, SPEC-024): uma coluna por dev, backlog ao lado, arrastar para alocar e ordenar

const TODOS = "todos";
const estiloCampo = "text-texto bg-elevado border-borda-forte h-9";
//DD/MM a partir de AAAA-MM-DD
const diaMes = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "–");
const intervalo = (a: string | null, b: string | null) => (a === b ? diaMes(a) : `${diaMes(a)}–${diaMes(b)}`);

//o que está sendo arrastado
type Arrasto = { tipo: "backlog"; idTarefa: number } | { tipo: "item"; id: number; idUsuario: number };
const TIPO_ARRASTO = "application/x-taskflow-sprint";

const Selo = ({ cor, tipo, children }: { cor: string; tipo: string; children: ReactNode }) => (
    <span data-selo={tipo} className={`rounded px-1.5 py-px text-[10.5px] font-medium ${cor}`}>{children}</span>
);

// ---------- cartão ----------

const CartaoItem = ({ item, statusOptions, podeEditar, ativa, onStatus, onRemover, onArrastar, onSoltarAntes }: {
    item: ItemDaFila; statusOptions: Status[]; podeEditar: boolean; ativa: boolean;
    onStatus: (idTarefa: number, idStatus: number) => void; onRemover: () => void;
    onArrastar: (e: DragEvent) => void; onSoltarAntes: (e: DragEvent) => void;
}) => {
    const nome = item.tarefa?.nome ?? item.avulso?.nome ?? "";
    return (
        <li data-item-id={item.id} data-item-tipo={item.tipo} draggable={podeEditar} onDragStart={onArrastar}
            onDragOver={(e) => { if (podeEditar) e.preventDefault(); }} onDrop={onSoltarAntes}
            className={`group flex flex-col gap-1 rounded-md border border-borda bg-superficie px-2.5 py-2 ${podeEditar ? "cursor-grab active:cursor-grabbing" : ""}`}>
            <div className="flex min-w-0 items-center gap-1.5">
                {item.tarefa && <MenuStatus soIcone status={item.tarefa.status} statusOptions={statusOptions} onEscolher={(idStatus) => onStatus(item.tarefa!.id, idStatus)} />}
                {item.tarefa ? (
                    <Link to={`/tarefas/${item.tarefa.id}`} className="min-w-0 truncate text-[13px] font-medium text-texto hover:underline">{nome}</Link>
                ) : (
                    <span className="min-w-0 truncate pl-1 text-[13px] font-medium text-texto-2">{nome}</span>
                )}
                <span data-horas className={`ml-auto shrink-0 font-mono text-[11.5px] ${item.semEstimativa ? "text-tom-ambar-texto" : "text-texto-fraco"}`}>
                    {item.semEstimativa ? "sem estimativa" : formatarMinutos(item.planejadas)}
                </span>
                {podeEditar && (
                    <button type="button" aria-label={`Tirar ${nome} da sprint`} onClick={onRemover}
                        className="shrink-0 rounded p-0.5 text-texto-mudo opacity-0 hover:text-tom-vermelho-texto group-hover:opacity-100 focus-visible:opacity-100">
                        <XIcon className="size-3.5" />
                    </button>
                )}
            </div>
            {item.tarefa && <span className="truncate pl-7 text-[11.5px] text-texto-mudo">{item.tarefa.projeto.nome}</span>}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-7 font-mono text-[10.5px] text-texto-fraco">
                <span data-previsto title="Previsto">prev {intervalo(item.inicioPrevisto, item.entregaPrevista)}</span>
                {ativa && <span data-projetado title="Projetado">proj {intervalo(item.inicioProjetado, item.entregaProjetada)}</span>}
            </div>
            {(item.naoPrevista || item.transborda || item.origem || item.avulso?.recorrente) && (
                <div className="flex flex-wrap gap-1 pl-7">
                    {item.avulso?.recorrente && <Selo cor="bg-tom-neutro-fundo text-tom-neutro-texto" tipo="repete">repete</Selo>}
                    {item.naoPrevista && <Selo cor="bg-tom-rosa-fundo text-tom-rosa-texto" tipo="nao-prevista">não prevista</Selo>}
                    {item.origem && <Selo cor="bg-tom-azul-fundo text-tom-azul-texto" tipo="veio-de">veio de {item.origem.nome}</Selo>}
                    {item.transborda && (
                        <Selo cor="bg-tom-laranja-fundo text-tom-laranja-texto" tipo="transborda">
                            {ativa ? "vai transbordar" : "transborda"} {formatarMinutos(item.transborda.minutos)} → {item.transborda.sprint.nome}
                        </Selo>
                    )}
                </div>
            )}
        </li>
    );
};

// ---------- coluna do dev ----------

const BarraOcupacao = ({ fila }: { fila: FilaDoDev }) => {
    const pct = fila.ocupacao ?? 0;
    const alerta = fila.semCapacidade || pct > 100;
    return (
        <div data-ocupacao={fila.ocupacao ?? "sem-capacidade"} className="flex flex-col gap-1">
            <span className={`font-mono text-[11.5px] ${alerta ? "text-tom-vermelho-texto" : "text-texto-fraco"}`}>
                {fila.semCapacidade ? `${formatarMinutos(fila.planejadas)} · sem capacidade` : `${formatarMinutos(fila.planejadas)} / ${formatarMinutos(fila.capacidade)} (${pct}%)`}
            </span>
            <span aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-realce">
                <span className={`block h-full rounded-full ${alerta ? "bg-tom-vermelho-texto" : "bg-tom-verde-texto"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </span>
        </div>
    );
};

const DialogLinha = ({ nomeDev, onFechar, onCriar }: { nomeDev: string; onFechar: () => void; onCriar: (nome: string, minutos: number, recorrente: boolean) => void }) => {
    const [nome, setNome] = useState("");
    const [horas, setHoras] = useState("");
    const [recorrente, setRecorrente] = useState(false);
    const minutos = lerHoras(horas);
    const valido = !!nome.trim() && minutos !== null && minutos <= 100000;
    return (
        <Dialog open onOpenChange={(v) => { if (!v) onFechar(); }}>
            <DialogContent className="bg-superficie flex w-[440px] flex-col gap-2 p-5">
                <DialogHeader><DialogTitle className="text-texto text-[17px]">Nova linha na fila de {nomeDev}</DialogTitle></DialogHeader>
                <p className="text-[12px] text-texto-fraco">Para o que não é tarefa cadastrada (reuniões, suporte…). Conta nas horas da sprint.</p>
                <p className="text-texto-suave text-[12.5px]">Nome</p>
                <Input aria-label="Nome da linha" className={estiloCampo} value={nome} maxLength={100} placeholder="ex.: Reuniões" onChange={(e) => setNome(e.target.value)} />
                <p className="text-texto-suave text-[12.5px]">Horas (ex.: 4h, 1h30)</p>
                <Input aria-label="Horas da linha" className={`${estiloCampo} w-32`} value={horas} onChange={(e) => setHoras(e.target.value)} />
                <label className="mt-1 flex items-center gap-2 text-[13px] text-texto-2">
                    <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
                    Repetir nas próximas sprints
                </label>
                <DialogFooter className="bg-superficie mt-2">
                    <Button variant="ghost" className="text-texto-suave" onClick={onFechar}>Cancelar</Button>
                    <Button variant="destructive" disabled={!valido} onClick={() => onCriar(nome.trim(), minutos!, recorrente)}>Adicionar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- backlog (RF-116) ----------

const Backlog = ({ recarga, podeArrastar, idEu, souAdmin, onEstimar }: { recarga: number; podeArrastar: boolean; idEu: number | null; souAdmin: boolean; onEstimar: () => void }) => {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);
    const [busca, setBusca] = useState("");
    const [idProjeto, setIdProjeto] = useState<number | null>(null);
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [versao, setVersao] = useState(0);

    useEffect(() => { fetchProjetos(1, 100).then((p) => setProjetos(p.data)).catch(() => { /* filtro sem opções */ }); }, []);
    useEffect(() => {
        let ativo = true;
        const espera = setTimeout(() => {
            fetchTarefas(1, { foraDeSprint: true, ...(idProjeto && { idProjeto }), ...(busca.trim() && { busca: busca.trim() }) }, 100)
                .then((r) => { if (ativo) setTarefas(r.data) })
                .catch((e) => toast.error(comMotivo("Erro ao buscar o backlog", e)));
        }, 250);
        return () => { ativo = false; clearTimeout(espera); };
    }, [busca, idProjeto, recarga, versao]);

    const estimar = async (t: Tarefa, dados: { minutosEstimados?: number | null; minutosBuffer?: number | null }) => {
        try {
            await updateTarefa(t.id, dados);
            setVersao((v) => v + 1);
            onEstimar();
        } catch (e) {
            toast.error(comMotivo("Erro ao estimar", e));
        }
    };

    return (
        <aside data-backlog aria-label="Backlog" className="flex w-80 shrink-0 flex-col rounded-lg border border-borda bg-superficie">
            <div className="flex flex-col gap-2 border-b border-divisoria p-3">
                <div className="flex items-center gap-2">
                    <h2 className="font-mono text-[11px] font-medium uppercase tracking-[.12em] text-texto-mudo">Backlog</h2>
                    <span data-contagem className="font-mono text-[11px] text-texto-fraco">{tarefas.length}</span>
                </div>
                <div className="relative">
                    <Search aria-hidden="true" className="absolute left-2 top-2.5 size-3.5 text-texto-mudo" />
                    <Input aria-label="Buscar no backlog" className={`${estiloCampo} h-8 pl-7 text-[12.5px]`} placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <Select value={idProjeto ? String(idProjeto) : TODOS} onValueChange={(v) => setIdProjeto(v === TODOS ? null : Number(v))}>
                    <SelectTrigger aria-label="Projeto do backlog" className="h-8! w-full bg-elevado border-borda-forte text-[12.5px] text-texto"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-elevado border border-borda-forte text-texto">
                        <SelectGroup>
                            <SelectItem className="text-texto-suave" value={TODOS}>Todos os projetos</SelectItem>
                            {projetos.map((p) => <SelectItem className="text-texto-suave" key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div className="flex justify-end gap-1 pr-1 font-mono text-[9.5px] uppercase tracking-[.1em] text-texto-mudo"><span className="w-14 text-center">Est.</span><span className="w-14 text-center">Buffer</span></div>
            </div>
            <ul className="flex max-h-[calc(100vh-280px)] flex-col overflow-y-auto">
                {tarefas.length === 0 && <li className="p-4 text-center text-[12.5px] text-texto-fraco">Nada no backlog</li>}
                {tarefas.map((t) => {
                    const pode = souAdmin || (idEu !== null && t.idUsuarioResponsavel === idEu);
                    return (
                        <li key={t.id} data-backlog-id={t.id} draggable={podeArrastar}
                            onDragStart={(e) => { e.dataTransfer.setData(TIPO_ARRASTO, JSON.stringify({ tipo: "backlog", idTarefa: t.id } satisfies Arrasto)); e.dataTransfer.effectAllowed = "move"; }}
                            className={`flex items-center gap-1 border-b border-divisoria px-3 py-1.5 last:border-b-0 hover:bg-hover ${podeArrastar ? "cursor-grab" : ""}`}>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <Link to={`/tarefas/${t.id}`} className="truncate text-[12.5px] text-texto hover:underline">{t.nome}</Link>
                                <span className="truncate text-[10.5px] text-texto-mudo">{t.projeto.nome}{t.issueExterna ? ` · ${t.issueExterna}` : ""}</span>
                            </div>
                            <CampoHoras className={estiloHorasBacklog} rotulo={`Estimativa de ${t.nome}`} valor={t.minutosEstimados} pode={pode} onGravar={(m) => estimar(t, { minutosEstimados: m })} />
                            <CampoHoras className={estiloHorasBacklog} rotulo={`Buffer de ${t.nome}`} valor={t.minutosBuffer} pode={pode} onGravar={(m) => estimar(t, { minutosBuffer: m })} />
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

// ---------- fechamento (RF-139, SPEC-027) ----------

const DialogFechar = ({ sprint, onFechar, onFechada }: { sprint: Sprint; onFechar: () => void; onFechada: () => void }) => {
    const [previa, setPrevia] = useState<PreviaFechamento | null>(null);
    const [destinos, setDestinos] = useState<Record<number, DestinoFechamento>>({});
    useEffect(() => {
        fetchPreviaFechamento(sprint.id)
            .then((p) => { setPrevia(p); setDestinos(Object.fromEntries(p.itens.map((i) => [i.id, "proxima" as const]))); })
            .catch((e) => toast.error(comMotivo("Erro ao preparar o fechamento", e)));
    }, [sprint.id]);
    const fechar = async () => {
        try {
            const r = await fecharSprint(sprint.id, Object.entries(destinos).map(([id, destino]) => ({ id: Number(id), destino })));
            toast.success(r.proxima ? `${sprint.nome} fechada; pendências em ${r.proxima.nome}` : `${sprint.nome} fechada`);
            onFechada();
        } catch (e) {
            toast.error(comMotivo("Erro ao fechar", e));
        }
    };
    return (
        <Dialog open onOpenChange={(v) => { if (!v) onFechar(); }}>
            <DialogContent className="bg-superficie flex w-[620px] max-w-[95vw] flex-col gap-2 p-5">
                <DialogHeader><DialogTitle className="text-texto text-[17px]">Fechar {sprint.nome}?</DialogTitle></DialogHeader>
                <p className="text-[13px] text-texto-2">A sprint fica somente leitura. Escolha o destino de cada tarefa não concluída; linhas avulsas encerram aqui.</p>
                {!previa && <p className="text-[12.5px] text-texto-fraco">Carregando…</p>}
                {previa && previa.itens.length === 0 && <p className="text-[12.5px] text-texto-fraco">Todas as tarefas estão concluídas.</p>}
                {previa && previa.itens.length > 0 && (
                    <ul data-fechamento className="flex max-h-[50vh] flex-col overflow-y-auto rounded-md border border-borda">
                        {previa.itens.map((i) => (
                            <li key={i.id} data-fechamento-item={i.id} className="flex flex-wrap items-center gap-2 border-b border-divisoria px-3 py-2 last:border-b-0">
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-[13px] font-medium text-texto">{i.tarefa.nome}</span>
                                    <span className="text-[11.5px] text-texto-fraco">{i.usuario.nome} · {i.evolucao}% · restam {formatarMinutos(i.restantes)}</span>
                                </div>
                                {(["proxima", "backlog"] as const).map((d) => (
                                    <label key={d} className="flex items-center gap-1.5 text-[12.5px] text-texto-2">
                                        <input type="radio" name={`destino-${i.id}`} value={d} checked={destinos[i.id] === d}
                                            onChange={() => setDestinos((x) => ({ ...x, [i.id]: d }))} />
                                        {d === "proxima" ? `Mover para ${previa.proxima.nome}${previa.proxima.id === null ? " (nova)" : ""}` : "Devolver ao backlog"}
                                    </label>
                                ))}
                            </li>
                        ))}
                    </ul>
                )}
                <DialogFooter className="bg-superficie mt-2">
                    <Button variant="ghost" className="text-texto-suave" onClick={onFechar}>Cancelar</Button>
                    <Button variant="destructive" disabled={!previa} onClick={fechar}>Fechar sprint</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- página ----------

const PaginaSprint = ({ id }: { id: number }) => {
    const eu = useUsuarioLogado({ relerAoMontar: true });
    const souAdmin = eu?.isAdmin === true;
    const [plano, setPlano] = useState<Planejamento | null>(null);
    const [statusOptions, setStatusOptions] = useState<Status[]>([]);
    const [recarga, setRecarga] = useState(0);
    const [linhaPara, setLinhaPara] = useState<FilaDoDev | null>(null);
    const [confirmarAtivar, setConfirmarAtivar] = useState(false);
    const [fechando, setFechando] = useState(false);
    //RF-127: abas; sem escolha, sprint em planejamento abre no Planejamento e as demais no Cronograma
    const [aba, setAba] = useState<"planejamento" | "cronograma" | null>(null);
    const reler = useCallback(() => setRecarga((n) => n + 1), []);

    useEffect(() => { fetchStatus("tarefa").then(setStatusOptions).catch(() => { /* bolinha sem menu */ }); }, []);
    useEffect(() => {
        let ativo = true;
        fetchPlanejamento(id).then((p) => { if (ativo) setPlano(p) }).catch((e) => toast.error(comMotivo("Erro ao buscar o planejamento", e)));
        return () => { ativo = false };
    }, [id, recarga]);

    const transbordos = useMemo(() => plano?.devs.flatMap((d) => d.itens.filter((i) => i.transborda).map((i) => ({ dev: d.usuario.nome, item: i }))) ?? [], [plano]);

    if (!plano) return <Layout><p className="py-24 text-center text-sm text-texto-fraco">Carregando…</p></Layout>;
    const { sprint } = plano;
    const editavel = souAdmin && sprint.status !== "Fechada";
    const ativa = sprint.status === "Ativa";
    const abaAtual = aba ?? (sprint.status === "Planejamento" ? "planejamento" : "cronograma");

    const executar = async (acao: () => Promise<unknown>, erro: string) => {
        try {
            const r = await acao();
            const membro = (r as { membroAdicionado?: { nomeProjeto: string } | null } | null)?.membroAdicionado;
            return membro ?? null;
        } catch (e) {
            toast.error(comMotivo(erro, e));
            return undefined;
        } finally {
            reler();
        }
    };

    //soltar na coluna do dev, antes do item `antes` (ou no fim)
    const soltar = async (e: DragEvent, dev: FilaDoDev, antes?: ItemDaFila) => {
        if (!editavel) return;
        e.preventDefault();
        e.stopPropagation();
        const cru = e.dataTransfer.getData(TIPO_ARRASTO);
        if (!cru) return;
        const arrasto = JSON.parse(cru) as Arrasto;
        const ids = dev.itens.map((i) => i.id);
        const posicao = antes ? ids.indexOf(antes.id) + 1 : undefined;
        if (arrasto.tipo === "backlog") {
            const membro = await executar(() => createItem(sprint.id, { idTarefa: arrasto.idTarefa, idUsuario: dev.usuario.id, posicao }), "Erro ao alocar");
            if (membro) toast.success(`${dev.usuario.nome} entrou no projeto ${membro.nomeProjeto}`);
        } else if (arrasto.idUsuario === dev.usuario.id) {
            if (antes?.id === arrasto.id) return;
            const sem = ids.filter((x) => x !== arrasto.id);
            const i = antes ? sem.indexOf(antes.id) : sem.length;
            sem.splice(i, 0, arrasto.id);
            await executar(() => reordenarFila(sprint.id, dev.usuario.id, sem), "Erro ao reordenar");
        } else {
            const membro = await executar(() => updateItem(arrasto.id, { idUsuario: dev.usuario.id, ...(posicao && { posicao }) }), "Erro ao mover");
            if (membro) toast.success(`${dev.usuario.nome} entrou no projeto ${membro.nomeProjeto}`);
        }
    };

    const ativar = async () => {
        setConfirmarAtivar(false);
        try {
            await ativarSprint(sprint.id);
            toast.success(`${sprint.nome} ativada`);
        } catch (e) {
            toast.error(comMotivo("Erro ao ativar", e));
        }
        reler();
    };

    return (
        <Layout>
            <header className="mb-4 flex flex-wrap items-center gap-3">
                <nav aria-label="Trilha" className="flex items-center gap-1.5 text-[13px]">
                    <Link to="/sprints" className="text-texto-fraco hover:text-texto hover:underline">Sprints</Link>
                    <ChevronRight aria-hidden="true" className="size-3.5 text-placeholder" />
                </nav>
                <h1 className="text-xl font-bold text-texto">{sprint.nome}</h1>
                <SeloStatusSprint status={sprint.status} />
                <span className="font-mono text-[12.5px] text-texto-fraco">{diaMes(sprint.dataInicio.slice(0, 10))} – {diaMes(sprint.dataFim.slice(0, 10))}</span>
                {souAdmin && sprint.status === "Planejamento" && (
                    <Button variant="destructive" className="ml-auto" onClick={() => setConfirmarAtivar(true)}>Ativar sprint</Button>
                )}
                {souAdmin && ativa && (
                    <Button variant="destructive" className="ml-auto" onClick={() => setFechando(true)}>Fechar sprint</Button>
                )}
            </header>
            <div role="tablist" className="mb-3 flex w-fit items-center gap-0.5 rounded-md border border-borda bg-superficie p-0.5">
                {(["planejamento", "cronograma"] as const).map((a) => (
                    <button key={a} type="button" role="tab" aria-selected={abaAtual === a} onClick={() => setAba(a)}
                        className={`flex h-7 items-center rounded px-3 text-[12.5px] font-medium transition-colors ${abaAtual === a ? "bg-realce text-texto" : "text-texto-fraco hover:text-texto"}`}>
                        {a === "planejamento" ? "Planejamento" : "Cronograma"}
                    </button>
                ))}
            </div>
            {abaAtual === "cronograma" && (
                <Cronograma sprint={sprint} devs={plano.devs.map((d) => d.usuario)} statusOptions={statusOptions} souAdmin={souAdmin} idEu={eu?.id ?? null} recarga={recarga} />
            )}
            {abaAtual === "planejamento" && (<>
            <p className="mb-4 text-[12.5px] text-texto-fraco">
                {sprint.status === "Planejamento" && (editavel ? "Arraste tarefas do backlog para a fila de um dev. A ordem da fila é a ordem de execução." : "Planejamento em andamento. Só administradores alteram as filas.")}
                {ativa && "Sprint ativa: o previsto está congelado; o projetado se recalcula a partir de hoje."}
                {sprint.status === "Fechada" && "Sprint fechada: somente leitura."}
            </p>

            <div className="flex items-start gap-4">
                {sprint.status !== "Fechada" && <Backlog recarga={recarga} podeArrastar={editavel} idEu={eu?.id ?? null} souAdmin={souAdmin} onEstimar={reler} />}
                <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-3">
                    {plano.devs.length === 0 && <p className="p-6 text-[13px] text-texto-fraco">Ninguém tem jornada cadastrada. Cadastre em Cadastros › Calendário.</p>}
                    {plano.devs.map((dev) => (
                        <section key={dev.usuario.id} data-fila-dev={dev.usuario.id} aria-label={`Fila de ${dev.usuario.nome}`}
                            onDragOver={(e) => { if (editavel) e.preventDefault(); }} onDrop={(e) => soltar(e, dev)}
                            className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-borda bg-fundo p-2.5">
                            <div className="flex items-center gap-2">
                                <Avatar usuario={dev.usuario} tamanho={22} />
                                <span className="truncate text-[13px] font-semibold text-texto">{dev.usuario.nome}</span>
                                {editavel && (
                                    <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-[12px] text-texto-fraco" onClick={() => setLinhaPara(dev)}><Plus className="size-3.5" />Linha</Button>
                                )}
                            </div>
                            <BarraOcupacao fila={dev} />
                            <ul className="flex min-h-16 flex-col gap-1.5">
                                {dev.itens.length === 0 && <li className="rounded-md border border-dashed border-borda p-3 text-center text-[12px] text-texto-mudo">{editavel ? "Solte tarefas aqui" : "Fila vazia"}</li>}
                                {dev.itens.map((item) => (
                                    <CartaoItem key={item.id} item={item} statusOptions={statusOptions} podeEditar={editavel} ativa={ativa}
                                        onStatus={(idTarefa, idStatus) => executar(() => updateTarefa(idTarefa, { idStatus }), "Erro ao trocar o status")}
                                        onRemover={() => executar(() => deleteItem(item.id), "Erro ao tirar da sprint")}
                                        onArrastar={(e) => { e.dataTransfer.setData(TIPO_ARRASTO, JSON.stringify({ tipo: "item", id: item.id, idUsuario: dev.usuario.id } satisfies Arrasto)); e.dataTransfer.effectAllowed = "move"; }}
                                        onSoltarAntes={(e) => soltar(e, dev, item)} />
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
            </>)}

            {fechando && <DialogFechar sprint={sprint} onFechar={() => setFechando(false)} onFechada={() => { setFechando(false); reler(); }} />}

            {linhaPara && (
                <DialogLinha nomeDev={linhaPara.usuario.nome} onFechar={() => setLinhaPara(null)}
                    onCriar={async (nome, minutosAvulsos, recorrente) => {
                        const dev = linhaPara;
                        setLinhaPara(null);
                        await executar(() => createItem(sprint.id, { nome, minutosAvulsos, recorrente, idUsuario: dev.usuario.id }), "Erro ao criar a linha");
                    }} />
            )}

            {confirmarAtivar && (
                <Dialog open onOpenChange={(v) => { if (!v) setConfirmarAtivar(false); }}>
                    <DialogContent className="bg-superficie flex w-[520px] flex-col gap-2 p-5">
                        <DialogHeader><DialogTitle className="text-texto text-[17px]">Ativar {sprint.nome}?</DialogTitle></DialogHeader>
                        <p className="text-[13px] text-texto-2">As datas previstas de todos os itens ficam congeladas como linha de base.</p>
                        {transbordos.length > 0 ? (
                            <div data-confirmar-transbordo className="flex flex-col gap-1 rounded-md border border-borda bg-fundo p-3">
                                <p className="text-[12.5px] font-medium text-texto">Vão para {plano.proxima.nome}{plano.proxima.id === null ? " (será criada)" : ""}:</p>
                                {transbordos.map(({ dev, item }) => (
                                    <p key={item.id} className="text-[12.5px] text-texto-2">
                                        {item.tarefa?.nome ?? item.avulso?.nome} ({dev}): {formatarMinutos(item.transborda!.minutos)}
                                        {item.transborda!.minutos < item.planejadas ? `, ficam ${formatarMinutos(item.planejadas - item.transborda!.minutos)} nesta` : " (inteiro)"}
                                    </p>
                                ))}
                            </div>
                        ) : <p className="text-[12.5px] text-texto-fraco">Tudo cabe na sprint: nada transborda.</p>}
                        <DialogFooter className="bg-superficie mt-2">
                            <Button variant="ghost" className="text-texto-suave" onClick={() => setConfirmarAtivar(false)}>Cancelar</Button>
                            <Button variant="destructive" onClick={ativar}>Ativar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Layout>
    );
};

const SprintDaRota = () => {
    const { id } = useParams();
    const n = id && /^[1-9]\d*$/.test(id) ? Number(id) : null;
    if (n === null) return <Layout><p className="py-24 text-center text-sm text-texto-fraco">Sprint não encontrada</p></Layout>;
    return <PaginaSprint key={n} id={n} />;
};

export default SprintDaRota;
