import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, XIcon } from "lucide-react";
import { hojeLocal } from "@/utils/limitesData";
import Layout from "@/components/Layout";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { comMotivo } from "@/api/apiClient";
import { fetchUsuarios } from "@/fetchs/fetchUsuarios";
import { dataParaInput } from "@/fetchs/fetchTarefas";
import {
    DIAS_SEMANA, ROTULO_DIA, ROTULO_TIPO, TIPOS_AUSENCIA,
    createAusencia, createFeriado, createJornada, deleteAusencia, deleteFeriado, deleteJornada,
    fetchAusencias, fetchCapacidade, fetchFeriados, fetchJornadas, importarFeriados,
    updateAusencia, updateFeriado, updateJornada,
    type Ausencia, type DiaCapacidade, type Feriado, type Jornada, type MinutosDaSemana, type TipoAusencia,
} from "@/fetchs/fetchCalendario";
import { formatarDia } from "@/utils/formaters/fdata";
import { formatarMinutos, lerHoras } from "@/utils/minutos";
import { useUsuarioLogado } from "@/utils/usuarioLogado";
import type { Usuario } from "@/pages/usuarios";

//tela Calendário (RF-107, SPEC-023): jornadas, feriados e ausências; admin edita, os demais só veem

type Aba = "jornadas" | "feriados" | "ausencias";
const ABAS: { valor: Aba; rotulo: string }[] = [
    { valor: "jornadas", rotulo: "Jornadas" },
    { valor: "feriados", rotulo: "Feriados" },
    { valor: "ausencias", rotulo: "Ausências" },
];

const estiloCampo = "text-texto bg-elevado border-borda-forte h-9";
const estiloRotulo = "text-texto-suave text-[12.5px]";
const estiloGatilho = "h-9! w-48 rounded-md bg-elevado border-borda-forte text-texto";
const estiloConteudo = "bg-elevado border border-borda-forte text-texto";
const estiloItem = "text-texto-suave focus:bg-realce focus:text-texto";
const estiloCabecalho = "h-9 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-texto-mudo";
const TODOS = "todos";

const hoje = hojeLocal;
const nomeDe = (usuarios: Usuario[], id: number) => usuarios.find((u) => u.id === id)?.nome ?? `#${id}`;

const SeletorUsuario = ({ usuarios, valor, onChange, comTodos, rotulo }: { usuarios: Usuario[]; valor: number | null; onChange: (id: number | null) => void; comTodos?: boolean; rotulo: string }) => (
    <Select value={valor ? String(valor) : TODOS} onValueChange={(v) => onChange(v === TODOS ? null : Number(v))}>
        <SelectTrigger aria-label={rotulo} className={estiloGatilho}><SelectValue placeholder="Escolha o dev" /></SelectTrigger>
        <SelectContent className={estiloConteudo}>
            <SelectGroup>
                {comTodos && <SelectItem className={estiloItem} value={TODOS}>Todos</SelectItem>}
                {usuarios.map((u) => <SelectItem className={estiloItem} key={u.id} value={String(u.id)}>{u.nome}</SelectItem>)}
            </SelectGroup>
        </SelectContent>
    </Select>
);

const Vazio = ({ colunas, texto }: { colunas: number; texto: string }) => (
    <TableRow className="border-divisoria hover:bg-transparent">
        <TableCell colSpan={colunas} className="py-6 text-center text-[13px] text-texto-fraco">{texto}</TableCell>
    </TableRow>
);

const Acoes = ({ podeEditar, onEditar, id, titulo, descricao, onExcluir }: { podeEditar: boolean; onEditar: () => void; id: number; titulo: string; descricao: string; onExcluir: () => void }) =>
    podeEditar ? (
        <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label="Editar" className="size-7 text-texto-fraco" onClick={onEditar}><Pencil className="size-3.5" /></Button>
            <ConfirmDeleteDialog
                trigger={<Button variant="ghost" size="icon" aria-label="Excluir" className="size-7 text-texto-fraco hover:text-tom-vermelho-texto"><XIcon className="size-3.5" /></Button>}
                id={id} titulo={titulo} descricao={descricao} funcao={onExcluir}
            />
        </div>
    ) : null;

const DialogBase = ({ aberto, onFechar, titulo, children, podeSalvar, onSalvar }: { aberto: boolean; onFechar: () => void; titulo: string; children: ReactNode; podeSalvar: boolean; onSalvar: () => void }) => (
    <Dialog open={aberto} onOpenChange={(v) => { if (!v) onFechar(); }}>
        <DialogContent className="bg-superficie flex w-[520px] flex-col gap-2 p-5">
            <DialogHeader><DialogTitle className="text-texto text-[17px]">{titulo}</DialogTitle></DialogHeader>
            {children}
            <DialogFooter className="bg-superficie mt-2">
                <Button variant="ghost" className="text-texto-suave" onClick={onFechar}>Cancelar</Button>
                <Button variant="destructive" disabled={!podeSalvar} onClick={onSalvar}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

// ---------- Jornadas (RF-101) ----------

const SEMANA_PADRAO: Record<keyof MinutosDaSemana, string> = { seg: "8h", ter: "8h", qua: "8h", qui: "8h", sex: "8h", sab: "0", dom: "0" };

const DialogJornada = ({ jornada, idUsuario, nome, onFechar, onSalvo }: { jornada: Jornada | null; idUsuario: number; nome: string; onFechar: () => void; onSalvo: () => void }) => {
    const [vigencia, setVigencia] = useState(jornada ? dataParaInput(jornada.vigencia) : hoje());
    const [horas, setHoras] = useState<Record<keyof MinutosDaSemana, string>>(() =>
        jornada ? Object.fromEntries(DIAS_SEMANA.map((d) => [d, formatarMinutos(jornada[d])])) as Record<keyof MinutosDaSemana, string> : SEMANA_PADRAO);
    const minutos = DIAS_SEMANA.map((d) => lerHoras(horas[d]));
    const valido = !!vigencia && minutos.every((m) => m !== null && m <= 1440);

    const salvar = async () => {
        const dias = Object.fromEntries(DIAS_SEMANA.map((d, i) => [d, minutos[i]])) as MinutosDaSemana;
        try {
            if (jornada) await updateJornada(jornada.id, { vigencia, ...dias });
            else await createJornada({ idUsuario, vigencia, ...dias });
            onSalvo();
        } catch (error) {
            toast.error(comMotivo("Erro ao salvar a jornada", error));
        }
    };

    return (
        <DialogBase aberto onFechar={onFechar} titulo={`${jornada ? "Editar" : "Nova"} jornada de ${nome}`} podeSalvar={valido} onSalvar={salvar}>
            <p className={estiloRotulo}>Vale a partir de</p>
            <Input aria-label="Vigência" type="date" className={estiloCampo} value={vigencia} onChange={(e) => setVigencia(e.target.value)} />
            <p className={estiloRotulo}>Horas por dia (ex.: 8h, 4h30, 6)</p>
            <div className="grid grid-cols-7 gap-1.5">
                {DIAS_SEMANA.map((d, i) => (
                    <label key={d} className="flex flex-col gap-1">
                        <span className="text-center font-mono text-[10.5px] uppercase text-texto-mudo">{ROTULO_DIA[d]}</span>
                        <Input aria-label={`Horas de ${ROTULO_DIA[d]}`} className={`${estiloCampo} px-1 text-center ${minutos[i] === null ? "border-tom-vermelho-texto" : ""}`}
                            value={horas[d]} onChange={(e) => setHoras((h) => ({ ...h, [d]: e.target.value }))} />
                    </label>
                ))}
            </div>
        </DialogBase>
    );
};

const AbaJornadas = ({ usuarios, souAdmin, onMudou }: { usuarios: Usuario[]; souAdmin: boolean; onMudou: () => void }) => {
    const [idUsuario, setIdUsuario] = useState<number | null>(null);
    const [jornadas, setJornadas] = useState<Jornada[]>([]);
    const [editando, setEditando] = useState<Jornada | "nova" | null>(null);
    const [recarga, setRecarga] = useState(0);
    const mudou = () => { setRecarga((n) => n + 1); onMudou(); };
    const dev = idUsuario ?? usuarios[0]?.id ?? null;

    useEffect(() => {
        if (!dev) return;
        let ativo = true;
        fetchJornadas(dev).then((j) => { if (ativo) setJornadas(j) }).catch((e) => toast.error(comMotivo("Erro ao buscar jornadas", e)));
        return () => { ativo = false };
    }, [dev, recarga]);

    const excluir = async (id: number) => {
        try { await deleteJornada(id); mudou(); } catch (e) { toast.error(comMotivo("Erro ao excluir a jornada", e)); }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <SeletorUsuario rotulo="Dev" usuarios={usuarios} valor={dev} onChange={setIdUsuario} />
                {souAdmin && dev && <Button variant="ghost" size="sm" className="ml-auto text-texto-fraco" onClick={() => setEditando("nova")}><Plus />Nova vigência</Button>}
            </div>
            <div className="mt-3 overflow-clip rounded-cartao border border-borda bg-superficie">
                <Table>
                    <TableHeader className="bg-cabecalho">
                        <TableRow className="border-divisoria hover:bg-transparent">
                            <TableHead className={`${estiloCabecalho} pl-4`}>Vale a partir de</TableHead>
                            {DIAS_SEMANA.map((d) => <TableHead key={d} className={`${estiloCabecalho} text-center`}>{ROTULO_DIA[d]}</TableHead>)}
                            <TableHead className={estiloCabecalho} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jornadas.length === 0 && <Vazio colunas={9} texto="Sem jornada: este usuário não aparece como dev no planejamento" />}
                        {jornadas.map((j) => (
                            <TableRow key={j.id} data-jornada-id={j.id} className="border-divisoria hover:bg-hover">
                                <TableCell className="pl-4 font-mono text-[12.5px] text-texto">{formatarDia(j.vigencia)}</TableCell>
                                {DIAS_SEMANA.map((d) => <TableCell key={d} className={`text-center font-mono text-[12.5px] ${j[d] ? "text-texto-2" : "text-texto-mudo"}`}>{formatarMinutos(j[d])}</TableCell>)}
                                <TableCell className="pr-3">
                                    <Acoes podeEditar={souAdmin} onEditar={() => setEditando(j)} id={j.id} titulo={`vigência ${formatarDia(j.vigencia)}`} descricao="jornada" onExcluir={() => excluir(j.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {editando && dev && (
                <DialogJornada jornada={editando === "nova" ? null : editando} idUsuario={dev} nome={nomeDe(usuarios, dev)}
                    onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); mudou(); }} />
            )}
        </>
    );
};

// ---------- Feriados (RF-102, RF-103) ----------

const DialogFeriado = ({ feriado, onFechar, onSalvo }: { feriado: Feriado | null; onFechar: () => void; onSalvo: () => void }) => {
    const [data, setData] = useState(feriado ? dataParaInput(feriado.data) : hoje());
    const [nome, setNome] = useState(feriado?.nome ?? "");
    const [meio, setMeio] = useState(feriado?.minutosDescontados != null);
    const [horas, setHoras] = useState(feriado?.minutosDescontados != null ? formatarMinutos(feriado.minutosDescontados) : "4h");
    const minutos = meio ? lerHoras(horas) : null;
    const valido = !!data && !!nome.trim() && (!meio || (minutos !== null && minutos >= 1 && minutos <= 1440));

    const salvar = async () => {
        const dados = { data, nome: nome.trim(), minutosDescontados: minutos };
        try {
            if (feriado) await updateFeriado(feriado.id, dados);
            else await createFeriado(dados);
            onSalvo();
        } catch (error) {
            toast.error(comMotivo("Erro ao salvar o feriado", error));
        }
    };

    return (
        <DialogBase aberto onFechar={onFechar} titulo={feriado ? "Editar feriado" : "Novo feriado"} podeSalvar={valido} onSalvar={salvar}>
            <p className={estiloRotulo}>Data</p>
            <Input aria-label="Data" type="date" className={estiloCampo} value={data} onChange={(e) => setData(e.target.value)} />
            <p className={estiloRotulo}>Nome</p>
            <Input aria-label="Nome" className={estiloCampo} value={nome} maxLength={100} placeholder="ex.: Aniversário da cidade" onChange={(e) => setNome(e.target.value)} />
            <label className="mt-1 flex items-center gap-2 text-[13px] text-texto-2">
                <input type="checkbox" checked={meio} onChange={(e) => setMeio(e.target.checked)} />
                Meio período (desconta só algumas horas)
            </label>
            {meio && <Input aria-label="Horas descontadas" className={`${estiloCampo} w-32`} value={horas} onChange={(e) => setHoras(e.target.value)} />}
        </DialogBase>
    );
};

const AbaFeriados = ({ souAdmin, onMudou }: { souAdmin: boolean; onMudou: () => void }) => {
    const [ano, setAno] = useState(new Date().getFullYear());
    const [feriados, setFeriados] = useState<Feriado[]>([]);
    const [editando, setEditando] = useState<Feriado | "novo" | null>(null);
    const [importando, setImportando] = useState(false);
    const [recarga, setRecarga] = useState(0);
    const mudou = () => { setRecarga((n) => n + 1); onMudou(); };

    useEffect(() => {
        let ativo = true;
        fetchFeriados(ano).then((f) => { if (ativo) setFeriados(f) }).catch((e) => toast.error(comMotivo("Erro ao buscar feriados", e)));
        return () => { ativo = false };
    }, [ano, recarga]);

    const importar = async () => {
        setImportando(true);
        try {
            const { criados, ignorados } = await importarFeriados(ano);
            toast.success(`${criados} criados, ${ignorados} já existiam`);
            mudou();
        } catch (e) {
            toast.error(comMotivo("Erro ao importar", e));
        } finally {
            setImportando(false);
        }
    };

    const excluir = async (id: number) => {
        try { await deleteFeriado(id); mudou(); } catch (e) { toast.error(comMotivo("Erro ao excluir o feriado", e)); }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-borda bg-superficie p-0.5">
                    <Button variant="ghost" size="icon" aria-label="Ano anterior" className="size-7" onClick={() => setAno((a) => a - 1)}><ChevronLeft className="size-4" /></Button>
                    <span data-ano className="w-12 text-center font-mono text-[13px] text-texto">{ano}</span>
                    <Button variant="ghost" size="icon" aria-label="Próximo ano" className="size-7" onClick={() => setAno((a) => a + 1)}><ChevronRight className="size-4" /></Button>
                </div>
                {souAdmin && (
                    <div className="ml-auto flex gap-1">
                        <Button variant="ghost" size="sm" className="text-texto-fraco" disabled={importando} onClick={importar}><Download />Importar feriados nacionais</Button>
                        <Button variant="ghost" size="sm" className="text-texto-fraco" onClick={() => setEditando("novo")}><Plus />Novo feriado</Button>
                    </div>
                )}
            </div>
            <div className="mt-3 overflow-clip rounded-cartao border border-borda bg-superficie">
                <Table>
                    <TableHeader className="bg-cabecalho">
                        <TableRow className="border-divisoria hover:bg-transparent">
                            <TableHead className={`${estiloCabecalho} pl-4`}>Data</TableHead>
                            <TableHead className={estiloCabecalho}>Nome</TableHead>
                            <TableHead className={estiloCabecalho}>Desconto</TableHead>
                            <TableHead className={estiloCabecalho} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feriados.length === 0 && <Vazio colunas={4} texto={`Nenhum feriado em ${ano}`} />}
                        {feriados.map((f) => (
                            <TableRow key={f.id} data-feriado-id={f.id} className="border-divisoria hover:bg-hover">
                                <TableCell className="pl-4 font-mono text-[12.5px] text-texto">{formatarDia(f.data)}</TableCell>
                                <TableCell className="text-[13px] text-texto">{f.nome}</TableCell>
                                <TableCell className="text-[12.5px] text-texto-fraco">{f.minutosDescontados == null ? "Dia inteiro" : formatarMinutos(f.minutosDescontados)}</TableCell>
                                <TableCell className="pr-3">
                                    <Acoes podeEditar={souAdmin} onEditar={() => setEditando(f)} id={f.id} titulo={f.nome} descricao="feriado" onExcluir={() => excluir(f.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {editando && (
                <DialogFeriado feriado={editando === "novo" ? null : editando}
                    onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); mudou(); }} />
            )}
        </>
    );
};

// ---------- Ausências (RF-104) ----------

const DialogAusencia = ({ ausencia, usuarios, idUsuarioInicial, onFechar, onSalvo }: { ausencia: Ausencia | null; usuarios: Usuario[]; idUsuarioInicial: number | null; onFechar: () => void; onSalvo: () => void }) => {
    const [idUsuario, setIdUsuario] = useState<number | null>(ausencia?.idUsuario ?? idUsuarioInicial);
    const [tipo, setTipo] = useState<TipoAusencia>(ausencia?.tipo ?? "Ferias");
    const [inicio, setInicio] = useState(ausencia ? dataParaInput(ausencia.dataInicio) : hoje());
    const [fim, setFim] = useState(ausencia ? dataParaInput(ausencia.dataFim) : hoje());
    const [parcial, setParcial] = useState(ausencia?.minutosPorDia != null);
    const [horas, setHoras] = useState(ausencia?.minutosPorDia != null ? formatarMinutos(ausencia.minutosPorDia) : "4h");
    const [observacao, setObservacao] = useState(ausencia?.observacao ?? "");
    const minutos = parcial ? lerHoras(horas) : null;
    const valido = !!idUsuario && !!inicio && !!fim && fim >= inicio && (!parcial || (minutos !== null && minutos >= 1 && minutos <= 1440));

    const salvar = async () => {
        const dados = { tipo, dataInicio: inicio, dataFim: fim, minutosPorDia: minutos, observacao: observacao.trim() || null };
        try {
            if (ausencia) await updateAusencia(ausencia.id, dados);
            else await createAusencia({ idUsuario: idUsuario!, ...dados });
            onSalvo();
        } catch (error) {
            toast.error(comMotivo("Erro ao salvar a ausência", error));
        }
    };

    return (
        <DialogBase aberto onFechar={onFechar} titulo={ausencia ? "Editar ausência" : "Nova ausência"} podeSalvar={valido} onSalvar={salvar}>
            {!ausencia && (<><p className={estiloRotulo}>Dev</p><SeletorUsuario rotulo="Dev da ausência" usuarios={usuarios} valor={idUsuario} onChange={setIdUsuario} /></>)}
            <p className={estiloRotulo}>Tipo</p>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoAusencia)}>
                <SelectTrigger aria-label="Tipo" className={estiloGatilho}><SelectValue /></SelectTrigger>
                <SelectContent className={estiloConteudo}>
                    <SelectGroup>{TIPOS_AUSENCIA.map((t) => <SelectItem className={estiloItem} key={t} value={t}>{ROTULO_TIPO[t]}</SelectItem>)}</SelectGroup>
                </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1"><span className={estiloRotulo}>De</span>
                    <Input aria-label="Início" type="date" className={estiloCampo} value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>
                <label className="flex flex-col gap-1"><span className={estiloRotulo}>Até</span>
                    <Input aria-label="Fim" type="date" className={estiloCampo} value={fim} onChange={(e) => setFim(e.target.value)} /></label>
            </div>
            {fim < inicio && <p className="text-[12px] text-tom-vermelho-texto">A data de fim não pode ser anterior à de início</p>}
            <label className="mt-1 flex items-center gap-2 text-[13px] text-texto-2">
                <input type="checkbox" checked={parcial} onChange={(e) => setParcial(e.target.checked)} />
                Só algumas horas por dia
            </label>
            {parcial && <Input aria-label="Horas por dia" className={`${estiloCampo} w-32`} value={horas} onChange={(e) => setHoras(e.target.value)} />}
            <p className={estiloRotulo}>Observação</p>
            <Input aria-label="Observação" className={estiloCampo} value={observacao} maxLength={500} onChange={(e) => setObservacao(e.target.value)} />
        </DialogBase>
    );
};

const AbaAusencias = ({ usuarios, souAdmin, onMudou }: { usuarios: Usuario[]; souAdmin: boolean; onMudou: () => void }) => {
    const [idUsuario, setIdUsuario] = useState<number | null>(null);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [ausencias, setAusencias] = useState<Ausencia[]>([]);
    const [editando, setEditando] = useState<Ausencia | "nova" | null>(null);
    const [recarga, setRecarga] = useState(0);
    const mudou = () => { setRecarga((n) => n + 1); onMudou(); };

    useEffect(() => {
        let ativo = true;
        fetchAusencias({ idUsuario: idUsuario ?? undefined, inicio: `${ano}-01-01`, fim: `${ano}-12-31` })
            .then((a) => { if (ativo) setAusencias(a) })
            .catch((e) => toast.error(comMotivo("Erro ao buscar ausências", e)));
        return () => { ativo = false };
    }, [idUsuario, ano, recarga]);

    const excluir = async (id: number) => {
        try { await deleteAusencia(id); mudou(); } catch (e) { toast.error(comMotivo("Erro ao excluir a ausência", e)); }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <SeletorUsuario rotulo="Filtrar por dev" usuarios={usuarios} valor={idUsuario} onChange={setIdUsuario} comTodos />
                <div className="flex items-center gap-1 rounded-md border border-borda bg-superficie p-0.5">
                    <Button variant="ghost" size="icon" aria-label="Ano anterior" className="size-7" onClick={() => setAno((a) => a - 1)}><ChevronLeft className="size-4" /></Button>
                    <span className="w-12 text-center font-mono text-[13px] text-texto">{ano}</span>
                    <Button variant="ghost" size="icon" aria-label="Próximo ano" className="size-7" onClick={() => setAno((a) => a + 1)}><ChevronRight className="size-4" /></Button>
                </div>
                {souAdmin && <Button variant="ghost" size="sm" className="ml-auto text-texto-fraco" onClick={() => setEditando("nova")}><Plus />Nova ausência</Button>}
            </div>
            <div className="mt-3 overflow-clip rounded-cartao border border-borda bg-superficie">
                <Table>
                    <TableHeader className="bg-cabecalho">
                        <TableRow className="border-divisoria hover:bg-transparent">
                            <TableHead className={`${estiloCabecalho} pl-4`}>Dev</TableHead>
                            <TableHead className={estiloCabecalho}>Tipo</TableHead>
                            <TableHead className={estiloCabecalho}>Período</TableHead>
                            <TableHead className={estiloCabecalho}>Por dia</TableHead>
                            <TableHead className={estiloCabecalho}>Observação</TableHead>
                            <TableHead className={estiloCabecalho} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ausencias.length === 0 && <Vazio colunas={6} texto={`Nenhuma ausência em ${ano}`} />}
                        {ausencias.map((a) => (
                            <TableRow key={a.id} data-ausencia-id={a.id} className="border-divisoria hover:bg-hover">
                                <TableCell className="pl-4 text-[13px] text-texto">{nomeDe(usuarios, a.idUsuario)}</TableCell>
                                <TableCell className="text-[13px] text-texto-2">{ROTULO_TIPO[a.tipo] ?? a.tipo}</TableCell>
                                <TableCell className="font-mono text-[12.5px] text-texto-2">{formatarDia(a.dataInicio)} – {formatarDia(a.dataFim)}</TableCell>
                                <TableCell className="text-[12.5px] text-texto-fraco">{a.minutosPorDia == null ? "Dia inteiro" : formatarMinutos(a.minutosPorDia)}</TableCell>
                                <TableCell className="max-w-0 truncate text-[12.5px] text-texto-fraco">{a.observacao ?? ""}</TableCell>
                                <TableCell className="pr-3">
                                    <Acoes podeEditar={souAdmin} onEditar={() => setEditando(a)} id={a.id} titulo={`${ROTULO_TIPO[a.tipo] ?? a.tipo} de ${nomeDe(usuarios, a.idUsuario)}`} descricao="ausência" onExcluir={() => excluir(a.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {editando && (
                <DialogAusencia ausencia={editando === "nova" ? null : editando} usuarios={usuarios} idUsuarioInicial={idUsuario}
                    onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); mudou(); }} />
            )}
        </>
    );
};

// ---------- Prévia de capacidade (RF-106, RF-107) ----------

const ultimoDia = (mes: string) => {
    const [a, m] = mes.split("-").map(Number);
    return `${mes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

//"feriado: Natal" → "Natal"; "ausencia: Ferias" → "Férias"
const rotuloDoMotivo = (motivo: string) => {
    const [tipo, ...resto] = motivo.split(": ");
    const valor = resto.join(": ");
    return tipo === "ausencia" ? (ROTULO_TIPO[valor as TipoAusencia] ?? valor) : valor;
};

const PreviaCapacidade = ({ usuarios, recarga }: { usuarios: Usuario[]; recarga: number }) => {
    const [idUsuario, setIdUsuario] = useState<number | null>(null);
    const [mes, setMes] = useState(hoje().slice(0, 7));
    const [dias, setDias] = useState<DiaCapacidade[]>([]);
    const [total, setTotal] = useState(0);
    const dev = idUsuario ?? usuarios[0]?.id ?? null;

    useEffect(() => {
        if (!dev || !/^\d{4}-\d{2}$/.test(mes)) return;
        let ativo = true;
        fetchCapacidade(dev, `${mes}-01`, ultimoDia(mes))
            .then((r) => { if (ativo) { setDias(r.dias); setTotal(r.total); } })
            .catch((e) => toast.error(comMotivo("Erro ao calcular a capacidade", e)));
        return () => { ativo = false };
    }, [dev, mes, recarga]);

    //a grade começa na segunda: casas vazias antes do dia 1
    const vazias = useMemo(() => (dias.length ? (new Date(`${dias[0].data}T00:00:00Z`).getUTCDay() + 6) % 7 : 0), [dias]);

    return (
        <section aria-label="Prévia de capacidade" data-previa className="mt-8 border-t border-borda pt-5">
            <div className="flex items-center gap-2">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[.12em] text-texto-mudo">Prévia de capacidade</h2>
                <div className="ml-auto flex items-center gap-2">
                    <SeletorUsuario rotulo="Dev da prévia" usuarios={usuarios} valor={dev} onChange={setIdUsuario} />
                    <Input aria-label="Mês" type="month" className={`${estiloCampo} w-48`} value={mes} onChange={(e) => setMes(e.target.value)} />
                </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
                {DIAS_SEMANA.map((d) => <span key={d} className="text-center font-mono text-[10px] uppercase tracking-[.12em] text-texto-mudo">{ROTULO_DIA[d]}</span>)}
                {Array.from({ length: vazias }, (_, i) => <span key={`v${i}`} />)}
                {dias.map((d) => (
                    <div key={d.data} data-dia={d.data} title={d.motivo ?? undefined}
                        className={`flex min-h-16 flex-col rounded-md border p-1.5 ${d.util ? "border-borda bg-superficie" : "border-divisoria bg-fundo"}`}>
                        <span className="font-mono text-[10.5px] text-texto-mudo">{Number(d.data.slice(8))}</span>
                        <span data-capacidade className={`font-mono text-[13px] ${d.util ? "text-texto" : "text-texto-mudo"}`}>{formatarMinutos(d.capacidade)}</span>
                        {d.motivo && <span className="truncate text-[10.5px] text-tom-ambar-texto">{rotuloDoMotivo(d.motivo)}</span>}
                    </div>
                ))}
            </div>
            <p className="mt-3 text-right text-[13px] text-texto-2">Total do mês: <span data-total className="font-mono text-texto">{formatarMinutos(total)}</span></p>
        </section>
    );
};

const Calendario = () => {
    //o papel decide o que a tela oferece (RF-107); enquanto não sabe, trata como comum
    const eu = useUsuarioLogado({ relerAoMontar: true });
    const souAdmin = eu?.isAdmin === true;
    const [aba, setAba] = useState<Aba>("jornadas");
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    //muda a cada gravação em qualquer aba: a prévia relê (CA-25)
    const [versao, setVersao] = useState(0);
    const mudou = () => setVersao((v) => v + 1);

    useEffect(() => {
        fetchUsuarios().then(setUsuarios).catch((e) => toast.error(comMotivo("Erro ao buscar usuários", e)));
    }, []);

    return (
        <Layout>
            <div className="mx-auto max-w-[1080px]">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-texto">Calendário</h1>
                    {!souAdmin && <p className="mt-1 text-sm text-texto-suave">Só administradores alteram o calendário</p>}
                </div>
                <div role="tablist" className="mt-4 flex w-fit items-center gap-0.5 rounded-md border border-borda bg-superficie p-0.5">
                    {ABAS.map((a) => (
                        <button key={a.valor} type="button" role="tab" aria-selected={aba === a.valor} onClick={() => setAba(a.valor)}
                            className={`flex h-7 items-center rounded px-3 text-[12.5px] font-medium transition-colors ${aba === a.valor ? "bg-realce text-texto" : "text-texto-fraco hover:text-texto"}`}>
                            {a.rotulo}
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    {aba === "jornadas" && <AbaJornadas usuarios={usuarios} souAdmin={souAdmin} onMudou={mudou} />}
                    {aba === "feriados" && <AbaFeriados souAdmin={souAdmin} onMudou={mudou} />}
                    {aba === "ausencias" && <AbaAusencias usuarios={usuarios} souAdmin={souAdmin} onMudou={mudou} />}
                </div>
                <PreviaCapacidade usuarios={usuarios} recarga={versao} />
            </div>
        </Layout>
    );
};

export default Calendario;
