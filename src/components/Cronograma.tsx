import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MenuStatus } from "./MenuValorTarefa";
import Avatar from "./Avatar";
import { FaixaTema, IdTarefa, Trilha } from "@/components/TrilhaTarefa";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { comMotivo } from "@/api/apiClient";
import { acompanhar, fetchCronograma, type Cronograma as DadosCronograma, type DadosAcompanhamento, type LinhaCronograma, type Sprint, type StatusItem } from "@/fetchs/fetchSprints";
import { updateTarefa } from "@/fetchs/fetchTarefas";
import type { Status } from "@/fetchs/fetchStatus";
import type { Membro } from "@/fetchs/fetchMembros";
import { formatarMinutos } from "@/utils/minutos";

//aba Cronograma da sprint (RF-127, SPEC-025): equivalente à aba "Cronograma" da planilha

const TODOS = "todos";
const ATALHOS = [0, 25, 50, 75, 100];
const diaMes = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "–");
const intervalo = (a: string | null, b: string | null) => (!a && !b ? "–" : a === b ? diaMes(a) : `${diaMes(a)}–${diaMes(b)}`);
const pct = (v: number | null) => (v === null ? "–" : `${v}%`);

const COR_STATUS: Record<StatusItem, string> = {
    "Concluída": "bg-tom-verde-fundo text-tom-verde-texto",
    "Bloqueada": "bg-tom-vermelho-fundo text-tom-vermelho-texto",
    "Em andamento": "bg-tom-azul-fundo text-tom-azul-texto",
    "Não iniciada": "bg-tom-neutro-fundo text-tom-neutro-texto",
};

const estiloCabecalho = "whitespace-nowrap px-2 py-2 text-left font-mono text-[10px] font-medium uppercase tracking-[.12em] text-texto-mudo";
const estiloCelula = "px-2 py-1.5 align-middle";
const estiloTexto = "h-7 border-transparent bg-transparent px-1.5 text-[12px] text-texto-2 hover:bg-elevado focus-visible:bg-elevado disabled:opacity-100";

//texto que grava ao sair do campo, só se mudou
const CampoTexto = ({ rotulo, valor, pode, onGravar, largura = "w-40" }: { rotulo: string; valor: string | null; pode: boolean; onGravar: (v: string | null) => void; largura?: string }) => {
    const [texto, setTexto] = useState<string | null>(null);
    if (!pode) return <span className={`block truncate text-[12px] text-texto-2 ${largura}`} title={valor ?? undefined}>{valor ?? ""}</span>;
    return (
        <Input aria-label={rotulo} className={`${estiloTexto} ${largura}`} value={texto ?? valor ?? ""} placeholder="–"
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => { if (texto !== null) { const novo = texto.trim() || null; setTexto(null); if (novo !== valor) onGravar(novo); } }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
    );
};

const CampoEvolucao = ({ linha, pode, onGravar }: { linha: LinhaCronograma; pode: boolean; onGravar: (v: number) => void }) => {
    const [texto, setTexto] = useState<string | null>(null);
    const barra = (
        <span aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-realce">
            <span className="block h-full rounded-full bg-tom-verde-texto" style={{ width: `${linha.evolucao}%` }} />
        </span>
    );
    if (!pode) return <div data-evolucao={linha.evolucao} className="flex w-28 flex-col gap-1"><span className="font-mono text-[12px] text-texto">{linha.evolucao}%</span>{barra}</div>;
    const sair = () => {
        if (texto === null) return;
        setTexto(null);
        //campo apagado: volta ao valor que estava, sem gravar 0 por engano
        if (!texto.trim()) return;
        const n = Number(texto);
        if (!Number.isInteger(n) || n < 0 || n > 100) { toast.error("Evolução é um inteiro de 0 a 100"); return; }
        if (n !== linha.evolucao) onGravar(n);
    };
    return (
        <div data-evolucao={linha.evolucao} className="flex w-40 flex-col gap-1">
            <div className="flex items-center gap-0.5">
                <Input aria-label="Evolução" inputMode="numeric" className="h-6 w-11 border-transparent bg-transparent px-1 text-right font-mono text-[12px] text-texto hover:bg-elevado focus-visible:bg-elevado"
                    value={texto ?? String(linha.evolucao)} onChange={(e) => setTexto(e.target.value)} onBlur={sair} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
                <span className="mr-1 font-mono text-[11px] text-texto-mudo">%</span>
                {ATALHOS.map((a) => (
                    <button key={a} type="button" data-atalho={a} onClick={() => a !== linha.evolucao && onGravar(a)}
                        className={`rounded px-1 font-mono text-[10px] ${a === linha.evolucao ? "bg-realce text-texto" : "text-texto-mudo hover:bg-hover hover:text-texto"}`}>{a}</button>
                ))}
            </div>
            {barra}
        </div>
    );
};

const Chip = ({ children, cor, tipo }: { children: ReactNode; cor: string; tipo: string }) => (
    <span data-selo={tipo} className={`whitespace-nowrap rounded px-1.5 py-px text-[10.5px] font-medium ${cor}`}>{children}</span>
);

interface CronogramaProps {
    sprint: Sprint;
    devs: Membro[];
    statusOptions: Status[];
    souAdmin: boolean;
    idEu: number | null;
    //muda quando algo de fora (planejamento) mexeu na sprint
    recarga: number;
}

const Cronograma = ({ sprint, devs, statusOptions, souAdmin, idEu, recarga }: CronogramaProps) => {
    const [dados, setDados] = useState<DadosCronograma | null>(null);
    const [idProjeto, setIdProjeto] = useState<number | null>(null);
    const [idUsuario, setIdUsuario] = useState<number | null>(null);
    const [versao, setVersao] = useState(0);
    const [projetos, setProjetos] = useState<{ id: number; nome: string }[]>([]);
    const fechada = sprint.status === "Fechada";

    useEffect(() => {
        let ativo = true;
        fetchCronograma(sprint.id, { idProjeto: idProjeto ?? undefined, idUsuario: idUsuario ?? undefined })
            .then((d) => {
                if (!ativo) return;
                setDados(d);
                //projetos do filtro: os que aparecem na sprint (lidos sem filtro de projeto)
                if (idProjeto === null) setProjetos([...new Map(d.itens.filter((i) => i.projeto).map((i) => [i.projeto!.id, i.projeto!])).values()]);
            })
            .catch((e) => toast.error(comMotivo("Erro ao buscar o cronograma", e)));
        return () => { ativo = false };
    }, [sprint.id, idProjeto, idUsuario, recarga, versao]);

    const gravar = async (linha: LinhaCronograma, d: DadosAcompanhamento) => {
        try {
            await acompanhar(linha.id, d);
        } catch (e) {
            toast.error(comMotivo("Erro ao atualizar", e));
        }
        setVersao((v) => v + 1);
    };
    const trocarStatus = async (idTarefa: number, idStatus: number) => {
        try { await updateTarefa(idTarefa, { idStatus }); } catch (e) { toast.error(comMotivo("Erro ao trocar o status", e)); }
        setVersao((v) => v + 1);
    };

    if (!dados) return <p className="py-10 text-center text-sm text-texto-fraco">Carregando…</p>;

    const filtro = (rotulo: string, valor: number | null, onChange: (v: number | null) => void, opcoes: { id: number; nome: string }[]) => (
        <Select value={valor ? String(valor) : TODOS} onValueChange={(v) => onChange(v === TODOS ? null : Number(v))}>
            <SelectTrigger aria-label={`Filtrar por ${rotulo}`} className="h-8! w-48 bg-elevado border-borda-forte text-[12.5px] text-texto"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-elevado border border-borda-forte text-texto">
                <SelectGroup>
                    <SelectItem className="text-texto-suave" value={TODOS}>{rotulo}: todos</SelectItem>
                    {opcoes.map((o) => <SelectItem className="text-texto-suave" key={o.id} value={String(o.id)}>{o.nome}</SelectItem>)}
                </SelectGroup>
            </SelectContent>
        </Select>
    );

    return (
        <section aria-label="Cronograma" data-cronograma className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-borda bg-superficie px-4 py-3">
                <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-[.12em] text-texto-mudo">Evolução da sprint</span>
                    <span data-evolucao-sprint className="font-heading text-2xl font-bold text-texto">{pct(dados.evolucao.sprint)}</span>
                </div>
                {dados.evolucao.porDev.map((d) => (
                    <div key={d.usuario.id} data-evolucao-dev={d.usuario.id} className="flex items-center gap-2 rounded-md border border-borda px-2.5 py-1.5">
                        <Avatar usuario={d.usuario} tamanho={20} />
                        <span className="text-[12.5px] text-texto-2">{d.usuario.nome}</span>
                        <span className="font-mono text-[12.5px] text-texto">{pct(d.evolucao)}</span>
                    </div>
                ))}
                <div className="ml-auto flex gap-2">
                    {filtro("Projeto", idProjeto, setIdProjeto, projetos)}
                    {filtro("Dev", idUsuario, setIdUsuario, devs)}
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-borda bg-superficie">
                <table className="w-full border-collapse text-[12.5px]">
                    <thead className="bg-cabecalho">
                        <tr className="border-b border-divisoria">
                            {["Tarefa", "Dev", "Projeto", "Planej.", "Apont.", "Consumo", "Evolução", "Status", "Bloqueio", "Observação", "Previsto", "Projetado", "Entrega real", "Atraso"].map((c) => (
                                <th key={c} className={estiloCabecalho}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dados.itens.length === 0 && <tr><td colSpan={14} className="py-6 text-center text-texto-fraco">Nada nesta sprint com esses filtros</td></tr>}
                        {dados.itens.map((l) => {
                            const pode = !fechada && (souAdmin || l.usuario.id === idEu);
                            const nome = l.tarefa?.nome ?? l.avulso?.nome ?? "";
                            return (
                                <tr key={l.id} data-linha-id={l.id} data-status={l.status} className="border-b border-divisoria last:border-b-0 hover:bg-hover">
                                    <td className={`${estiloCelula} max-w-64`}>
                                        <div className="flex min-w-0 gap-2">
                                        {l.tarefa ? <FaixaTema tarefa={l.tarefa} /> : <span aria-hidden="true" className="w-[3px] shrink-0" />}
                                        <div className="min-w-0 flex-1">
                                        {l.tarefa && <Trilha tarefa={l.tarefa} comProjeto={false} className="pl-7" />}
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            {l.tarefa && <MenuStatus soIcone desabilitado={!pode} status={l.tarefa.status} statusOptions={statusOptions} onEscolher={(id) => trocarStatus(l.tarefa!.id, id)} />}
                                            {l.tarefa ? <Link to={`/tarefas/${l.tarefa.id}`} title={`#${l.tarefa.id} ${nome}`} className="truncate font-medium text-texto hover:underline"><IdTarefa id={l.tarefa.id} />{nome}</Link> : <span className="truncate pl-1 text-texto-2">{nome}</span>}
                                            {l.tarefa?.issueExterna && <span className="shrink-0 font-mono text-[10.5px] text-texto-mudo">{l.tarefa.issueExterna}</span>}
                                        </div>
                                        <div className="mt-0.5 flex gap-1 pl-7">
                                            {l.naoPrevista && <Chip tipo="nao-prevista" cor="bg-tom-rosa-fundo text-tom-rosa-texto">não prevista</Chip>}
                                            {l.risco && <Chip tipo="risco" cor="bg-tom-laranja-fundo text-tom-laranja-texto">risco</Chip>}
                                            {l.transborda && <Chip tipo="transborda" cor="bg-tom-laranja-fundo text-tom-laranja-texto">vai transbordar {formatarMinutos(l.transborda.minutos)}</Chip>}
                                        </div>
                                        </div>
                                        </div>
                                    </td>
                                    <td className={`${estiloCelula} whitespace-nowrap text-texto-2`}>{l.usuario.nome}</td>
                                    <td className={`${estiloCelula} max-w-28 truncate text-texto-fraco`} title={l.projeto?.nome}>{l.projeto?.nome ?? "–"}</td>
                                    <td className={`${estiloCelula} font-mono text-texto-2`}>{formatarMinutos(l.planejadas)}</td>
                                    <td className={`${estiloCelula} font-mono text-texto-2`}>{formatarMinutos(l.apontadas)}</td>
                                    <td data-consumo={l.consumo ?? ""} className={`${estiloCelula} font-mono ${l.consumo !== null && l.consumo > 100 ? "rounded bg-tom-ambar-fundo text-tom-ambar-texto" : "text-texto-2"}`}>{pct(l.consumo)}</td>
                                    <td className={estiloCelula}><CampoEvolucao linha={l} pode={pode} onGravar={(evolucao) => gravar(l, { evolucao })} /></td>
                                    <td className={estiloCelula}><Chip tipo="status" cor={COR_STATUS[l.status]}>{l.status}</Chip></td>
                                    <td className={estiloCelula}><CampoTexto rotulo="Bloqueio" valor={l.bloqueio} pode={pode} largura="w-28" onGravar={(bloqueio) => gravar(l, { bloqueio })} /></td>
                                    <td className={estiloCelula}><CampoTexto rotulo="Observação" valor={l.observacao} pode={pode} largura="w-32" onGravar={(observacao) => gravar(l, { observacao })} /></td>
                                    <td className={`${estiloCelula} whitespace-nowrap font-mono text-[11.5px] text-texto-2`}>{intervalo(l.inicioPrevisto, l.entregaPrevista)}{l.diasUteis !== null && <span className="text-texto-mudo"> · {l.diasUteis}d</span>}</td>
                                    <td className={`${estiloCelula} whitespace-nowrap font-mono text-[11.5px] text-texto-fraco`}>{intervalo(l.inicioProjetado, l.entregaProjetada)}</td>
                                    <td className={estiloCelula}>
                                        {pode ? (
                                            <Input aria-label="Entrega real" type="date" className={`${estiloTexto} w-32 font-mono`} value={l.dataEntregaReal ?? ""}
                                                onChange={(e) => gravar(l, { dataEntregaReal: e.target.value || null })} />
                                        ) : <span className="font-mono text-[11.5px] text-texto-2">{diaMes(l.dataEntregaReal)}</span>}
                                    </td>
                                    <td data-atraso={l.atraso ?? ""} className={`${estiloCelula} whitespace-nowrap font-mono font-medium ${l.atraso === null ? "text-texto-mudo" : l.atraso > 0 ? "text-tom-vermelho-texto" : l.atraso < 0 ? "text-tom-verde-texto" : "text-texto-2"}`}>
                                        {l.atraso === null ? "–" : l.atraso > 0 ? `+${l.atraso}` : l.atraso}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {fechada && <p className="text-[12px] text-texto-fraco">Sprint fechada: somente leitura.</p>}
        </section>
    );
};

export default Cronograma;
