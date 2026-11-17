import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Shuffle, XIcon } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { comMotivo } from "@/api/apiClient";
import {
    converterApontamento, createApontamento, deleteApontamento, fetchDia, fetchItensApontaveis, horasDecimais, updateApontamento,
    type Apontamento, type DiaDeApontamentos, type ItemApontavel,
} from "@/fetchs/fetchApontamentos";
import { fetchProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { fetchUsuarios } from "@/fetchs/fetchUsuarios";
import { useUsuarioLogado } from "@/utils/usuarioLogado";
import type { Usuario } from "@/pages/usuarios";

//tela Apontamentos (RF-135, SPEC-026): lançamento rápido por dia, como a aba "Controle de Horas"

const SEM_TAREFA = "";
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const hoje = () => new Date().toISOString().slice(0, 10);
const somarDias = (data: string, n: number) => new Date(Date.parse(`${data}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const nomeDoDia = (data: string) => {
    const texto = new Date(`${data}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};
const estiloCampo = "h-8 text-texto bg-elevado border-borda-forte text-[13px]";
const estiloSelect = "h-8 w-full rounded-md border border-borda-forte bg-elevado px-2 text-[13px] text-texto";
//"Paredes › Planejamento": a trilha das mães distingue tarefas com o mesmo nome
const rotuloItem = (i: ItemApontavel, mostrarSprint: boolean) =>
    `${[...(i.trilha ?? []), i.nome ?? "(sem nome)"].join(" › ")}${mostrarSprint ? ` · ${i.sprint.nome}` : ""}`;

//agrupa por projeto, na ordem em que aparecem (a da fila); avulsas ficam em "Sem projeto"
const porProjeto = (itens: ItemApontavel[]) => {
    const grupos = new Map<string, ItemApontavel[]>();
    for (const i of itens) {
        const nome = i.projeto?.nome ?? "Sem projeto";
        grupos.set(nome, [...(grupos.get(nome) ?? []), i]);
    }
    return [...grupos];
};

const SeletorItem = ({ valor, itens, idSprintDoDia, rotulo, onChange }: { valor: number | null; itens: ItemApontavel[]; idSprintDoDia: number | null; rotulo: string; onChange: (id: number | null) => void }) => (
    <select aria-label={rotulo} className={estiloSelect} value={valor === null ? SEM_TAREFA : String(valor)} onChange={(e) => onChange(e.target.value === SEM_TAREFA ? null : Number(e.target.value))}>
        <option value={SEM_TAREFA}>Sem tarefa</option>
        {porProjeto(itens).map(([projeto, doProjeto]) => (
            <optgroup key={projeto} label={projeto}>
                {doProjeto.map((i) => <option key={i.id} value={i.id}>{rotuloItem(i, i.sprint.id !== idSprintDoDia)}</option>)}
            </optgroup>
        ))}
    </select>
);

//uma linha já gravada: horas e observação gravam ao sair do campo; item grava ao escolher
const LinhaApontamento = ({ a, itens, idSprintDoDia, onMudou, onConverter }: {
    a: Apontamento; itens: ItemApontavel[]; idSprintDoDia: number | null; onMudou: () => void; onConverter: (a: Apontamento) => void;
}) => {
    const [inicio, setInicio] = useState<string | null>(null);
    const [fim, setFim] = useState<string | null>(null);
    const [obs, setObs] = useState<string | null>(null);
    //o item atual entra na lista mesmo que não esteja entre os oferecidos (outra sprint, mostrar todas desligado)
    const opcoes = a.item && !itens.some((i) => i.id === a.item!.id) ? [...itens, { id: a.item.id, nome: a.item.nome, idTarefa: null, sprint: a.item.sprint }] : itens;

    const gravar = async (dados: Parameters<typeof updateApontamento>[1]) => {
        try {
            await updateApontamento(a.id, dados);
        } catch (e) {
            toast.error(comMotivo("Erro ao salvar", e));
        }
        setInicio(null); setFim(null); setObs(null);
        onMudou();
    };
    const sairHora = (campo: "inicio" | "fim", valor: string | null) => {
        if (valor === null || valor === a[campo]) { if (campo === "inicio") setInicio(null); else setFim(null); return; }
        if (!HORA.test(valor)) { toast.error("Use HH:MM (ex.: 08:00)"); return; }
        gravar({ [campo]: valor });
    };
    const excluir = async () => {
        try { await deleteApontamento(a.id); } catch (e) { toast.error(comMotivo("Erro ao excluir", e)); }
        onMudou();
    };

    return (
        <tr data-apontamento-id={a.id} className="border-b border-divisoria hover:bg-hover">
            <td className="px-2 py-1"><Input aria-label="Início" className={`${estiloCampo} w-20 font-mono`} value={inicio ?? a.inicio} onChange={(e) => setInicio(e.target.value)} onBlur={() => sairHora("inicio", inicio)} /></td>
            <td className="px-2 py-1"><Input aria-label="Fim" className={`${estiloCampo} w-20 font-mono`} value={fim ?? a.fim} onChange={(e) => setFim(e.target.value)} onBlur={() => sairHora("fim", fim)} /></td>
            <td data-horas className="px-2 py-1 font-mono text-[13px] text-texto">{horasDecimais(a.minutos)}</td>
            <td className="px-2 py-1">
                <div className="flex items-center gap-1.5">
                    <SeletorItem rotulo="Item" valor={a.idItemSprint} itens={opcoes} idSprintDoDia={idSprintDoDia}
                        onChange={(id) => gravar({ idItemSprint: id, foraDaSprint: id !== null && opcoes.find((i) => i.id === id)?.sprint.id !== idSprintDoDia })} />
                    {a.foraDaSprint && <span data-fora-da-sprint title="Item de outra sprint" className="shrink-0 rounded bg-tom-ambar-fundo px-1.5 py-px text-[10.5px] text-tom-ambar-texto">outra sprint</span>}
                </div>
            </td>
            <td className="px-2 py-1"><Input aria-label="Observação" className={`${estiloCampo} w-full`} value={obs ?? a.observacao ?? ""} placeholder="–"
                onChange={(e) => setObs(e.target.value)} onBlur={() => { if (obs !== null && obs.trim() !== (a.observacao ?? "")) gravar({ observacao: obs.trim() || null }); else setObs(null); }} /></td>
            <td className="whitespace-nowrap px-2 py-1 text-right">
                {a.idItemSprint === null && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[12px] text-texto-fraco" onClick={() => onConverter(a)}><Shuffle className="size-3.5" />Converter em tarefa</Button>
                )}
                <button type="button" aria-label="Excluir apontamento" onClick={excluir} className="rounded p-1 text-texto-mudo hover:text-tom-vermelho-texto"><XIcon className="size-3.5" /></button>
            </td>
        </tr>
    );
};

const DialogConverter = ({ a, onFechar, onConvertido }: { a: Apontamento; onFechar: () => void; onConvertido: () => void }) => {
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [idProjeto, setIdProjeto] = useState<number | null>(null);
    useEffect(() => { fetchProjetos(1, 100).then((p) => { setProjetos(p.data); setIdProjeto(p.data[0]?.id ?? null); }).catch(() => { /* sem projetos */ }); }, []);
    const converter = async () => {
        try {
            await converterApontamento(a.id, idProjeto!);
            toast.success("Tarefa criada e colocada na sprint");
            onConvertido();
        } catch (e) {
            toast.error(comMotivo("Erro ao converter", e));
        }
    };
    return (
        <Dialog open onOpenChange={(v) => { if (!v) onFechar(); }}>
            <DialogContent className="bg-superficie flex w-[460px] flex-col gap-2 p-5">
                <DialogHeader><DialogTitle className="text-texto text-[17px]">Converter em tarefa não prevista</DialogTitle></DialogHeader>
                <p className="text-[13px] text-texto-2">Cria a tarefa <span className="font-medium text-texto">“{a.observacao}”</span>, coloca na sprint deste dia como não prevista e liga este apontamento a ela.</p>
                <p className="text-texto-suave text-[12.5px]">Projeto</p>
                <select aria-label="Projeto da tarefa" className={estiloSelect} value={idProjeto ?? ""} onChange={(e) => setIdProjeto(Number(e.target.value))}>
                    {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <DialogFooter className="bg-superficie mt-2">
                    <Button variant="ghost" className="text-texto-suave" onClick={onFechar}>Cancelar</Button>
                    <Button variant="destructive" disabled={!idProjeto} onClick={converter}>Converter</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const Apontamentos = () => {
    const eu = useUsuarioLogado({ relerAoMontar: true });
    const souAdmin = eu?.isAdmin === true;
    const [data, setData] = useState(hoje());
    const [idDev, setIdDev] = useState<number | null>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [dia, setDia] = useState<DiaDeApontamentos | null>(null);
    const [itens, setItens] = useState<ItemApontavel[]>([]);
    const [todas, setTodas] = useState(false);
    const [versao, setVersao] = useState(0);
    const [convertendo, setConvertendo] = useState<Apontamento | null>(null);
    //linha de lançamento
    const [inicio, setInicio] = useState("");
    const [fim, setFim] = useState("");
    const [idItem, setIdItem] = useState<number | null>(null);
    const [obs, setObs] = useState("");
    const refFim = useRef<HTMLInputElement>(null);
    const dev = idDev ?? undefined;

    useEffect(() => { if (souAdmin) fetchUsuarios().then(setUsuarios).catch(() => { /* seletor vazio */ }); }, [souAdmin]);
    useEffect(() => {
        let ativo = true;
        Promise.all([fetchDia(data, dev), fetchItensApontaveis(data, todas, dev)])
            .then(([d, i]) => {
                if (!ativo) return;
                setDia(d);
                setItens(i);
                //início sugerido = fim do último apontamento do dia (RF-131)
                setInicio(d.sugestaoInicio ?? "08:00");
            })
            .catch((e) => toast.error(comMotivo("Erro ao buscar os apontamentos", e)));
        return () => { ativo = false };
    }, [data, dev, todas, versao]);

    const reler = () => setVersao((v) => v + 1);
    const idSprintDoDia = dia?.sprint?.id ?? null;
    const valido = HORA.test(inicio) && HORA.test(fim) && fim > inicio && (idItem !== null || !!obs.trim());

    const lancar = async (e: FormEvent) => {
        e.preventDefault();
        if (!valido) {
            toast.error(idItem === null && !obs.trim() ? "Apontamento sem tarefa precisa de observação" : "Use HH:MM, com o fim depois do início");
            return;
        }
        try {
            const r = await createApontamento({
                data, inicio, fim, idItemSprint: idItem, observacao: obs.trim() || null,
                foraDaSprint: idItem !== null && itens.find((i) => i.id === idItem)?.sprint.id !== idSprintDoDia, idUsuario: dev,
            });
            if (r.alerta) toast.warning(r.alerta);
            setFim(""); setObs(""); setIdItem(null);
            reler();
            refFim.current?.focus();
        } catch (er) {
            toast.error(comMotivo("Erro ao lançar", er));
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-[1100px]">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-texto">Apontamentos</h1>
                    {souAdmin && (
                        <select aria-label="Dev" className={`${estiloSelect.replace("w-full", "w-56")} ml-auto`} value={idDev ?? ""} onChange={(e) => setIdDev(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">Eu ({eu?.nome})</option>
                            {usuarios.filter((u) => u.id !== eu?.id).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                        </select>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="icon" aria-label="Dia anterior" className="size-8" onClick={() => setData((d) => somarDias(d, -1))}><ChevronLeft className="size-4" /></Button>
                    <Input aria-label="Data" type="date" className={`${estiloCampo} w-40 font-mono`} value={data} onChange={(e) => e.target.value && setData(e.target.value)} />
                    <Button variant="ghost" size="icon" aria-label="Próximo dia" className="size-8" onClick={() => setData((d) => somarDias(d, 1))}><ChevronRight className="size-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-texto-fraco" onClick={() => setData(hoje())}>Hoje</Button>
                    <span className="text-[13px] text-texto-2">{nomeDoDia(data)}</span>
                    <span data-sprint-do-dia className="ml-auto text-[12.5px]">
                        {dia?.sprint ? <span className="text-texto-fraco">Sprint: <span className="text-texto">{dia.sprint.nome}</span></span>
                            : <span className="text-tom-ambar-texto">Esta data não está em nenhuma sprint</span>}
                    </span>
                </div>

                <form onSubmit={lancar} className="mt-4 overflow-hidden rounded-lg border border-borda bg-superficie">
                    <table className="w-full border-collapse">
                        <thead className="bg-cabecalho">
                            <tr className="border-b border-divisoria font-mono text-[10px] uppercase tracking-[.12em] text-texto-mudo">
                                <th className="w-24 px-2 py-2 text-left font-medium">Início</th>
                                <th className="w-24 px-2 py-2 text-left font-medium">Fim</th>
                                <th className="w-20 px-2 py-2 text-left font-medium">Horas</th>
                                <th className="w-80 px-2 py-2 text-left font-medium">Item da sprint</th>
                                <th className="px-2 py-2 text-left font-medium">Observação</th>
                                <th className="w-44" />
                            </tr>
                        </thead>
                        <tbody>
                            {dia?.apontamentos.map((a) => (
                                <LinhaApontamento key={a.id} a={a} itens={itens} idSprintDoDia={idSprintDoDia} onMudou={reler} onConverter={setConvertendo} />
                            ))}
                            <tr data-linha-nova className="bg-fundo">
                                <td className="px-2 py-1.5"><Input aria-label="Início novo" className={`${estiloCampo} w-20 font-mono`} value={inicio} onChange={(e) => setInicio(e.target.value)} /></td>
                                <td className="px-2 py-1.5"><Input ref={refFim} aria-label="Fim novo" placeholder="HH:MM" className={`${estiloCampo} w-20 font-mono`} value={fim} onChange={(e) => setFim(e.target.value)} /></td>
                                <td className="px-2 py-1.5 font-mono text-[13px] text-texto-mudo">
                                    {HORA.test(inicio) && HORA.test(fim) && fim > inicio ? horasDecimais((Number(fim.slice(0, 2)) * 60 + Number(fim.slice(3))) - (Number(inicio.slice(0, 2)) * 60 + Number(inicio.slice(3)))) : "–"}
                                </td>
                                <td className="px-2 py-1.5">
                                    <SeletorItem rotulo="Item novo" valor={idItem} itens={itens} idSprintDoDia={idSprintDoDia} onChange={setIdItem} />
                                    <label className="mt-1 flex items-center gap-1.5 text-[11.5px] text-texto-fraco">
                                        <input type="checkbox" checked={todas} onChange={(e) => setTodas(e.target.checked)} aria-label="Mostrar todas" />
                                        Mostrar itens de outras sprints
                                    </label>
                                </td>
                                <td className="px-2 py-1.5"><Input aria-label="Observação nova" className={`${estiloCampo} w-full`} value={obs}
                                    placeholder={idItem === null ? "Obrigatória sem tarefa" : "Opcional"} onChange={(e) => setObs(e.target.value)} /></td>
                                <td className="px-2 py-1.5 text-right"><Button type="submit" variant="destructive" size="sm" disabled={!valido}>Lançar ↵</Button></td>
                            </tr>
                        </tbody>
                    </table>
                </form>
                <p className="mt-3 text-right text-[13px] text-texto-2">Total do dia: <span data-total-dia className="font-mono text-texto">{horasDecimais(dia?.totalMinutos ?? 0)}</span></p>
            </div>
            {convertendo && <DialogConverter a={convertendo} onFechar={() => setConvertendo(null)} onConvertido={() => { setConvertendo(null); reler(); }} />}
        </Layout>
    );
};

export default Apontamentos;
