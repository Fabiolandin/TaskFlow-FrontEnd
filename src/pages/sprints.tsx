import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { hojeLocal } from "@/utils/limitesData";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { comMotivo } from "@/api/apiClient";
import { createSprint, deleteSprint, fetchSprints, updateSprint, type Sprint } from "@/fetchs/fetchSprints";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import SeloStatusSprint from "@/components/SeloStatusSprint";
import { formatarDia } from "@/utils/formaters/fdata";
import { useUsuarioLogado } from "@/utils/usuarioLogado";

//lista de sprints (RF-117, SPEC-024): mais recente primeiro; admin cria, edita (Planejamento/Ativa) e exclui (Planejamento)

const estiloCabecalho = "h-9 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-texto-mudo";
const estiloCampo = "text-texto bg-elevado border-borda-forte h-9";

const somarDias = (data: string, n: number) => new Date(Date.parse(`${data}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

//sem `editando`, cria a próxima; com `editando`, edita nome e datas
const DialogSprint = ({ sprints, editando, onFechar, onSalva }: { sprints: Sprint[]; editando?: Sprint; onFechar: () => void; onSalva: (s: Sprint) => void }) => {
    //sugere a sequência: começa no dia seguinte à última e dura o mesmo
    const ultima = sprints[0];
    const inicioSugerido = ultima ? somarDias(ultima.dataFim.slice(0, 10), 1) : hojeLocal();
    const duracao = ultima ? Math.round((Date.parse(ultima.dataFim) - Date.parse(ultima.dataInicio)) / 86400000) : 13;
    const proximoNome = ultima?.nome.match(/^(.*?)(\d+)$/) ? ultima.nome.replace(/(\d+)$/, (n) => String(Number(n) + 1)) : "Sprint 1";
    const [nome, setNome] = useState(editando?.nome ?? proximoNome);
    const [inicio, setInicio] = useState(editando?.dataInicio.slice(0, 10) ?? inicioSugerido);
    const [fim, setFim] = useState(editando?.dataFim.slice(0, 10) ?? somarDias(inicioSugerido, duracao));
    const valido = !!nome.trim() && !!inicio && !!fim && fim >= inicio;

    const salvar = async () => {
        const dados = { nome: nome.trim(), dataInicio: inicio, dataFim: fim };
        try {
            onSalva(editando ? await updateSprint(editando.id, dados) : await createSprint(dados));
        } catch (e) {
            toast.error(comMotivo(editando ? "Erro ao editar a sprint" : "Erro ao criar a sprint", e));
        }
    };

    return (
        <Dialog open onOpenChange={(v) => { if (!v) onFechar(); }}>
            <DialogContent className="bg-superficie flex w-[460px] flex-col gap-2 p-5">
                <DialogHeader><DialogTitle className="text-texto text-[17px]">{editando ? `Editar ${editando.nome}` : "Nova sprint"}</DialogTitle></DialogHeader>
                <p className="text-texto-suave text-[12.5px]">Nome</p>
                <Input aria-label="Nome da sprint" className={estiloCampo} value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1"><span className="text-texto-suave text-[12.5px]">Início</span>
                        <Input aria-label="Início da sprint" type="date" className={estiloCampo} value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>
                    <label className="flex flex-col gap-1"><span className="text-texto-suave text-[12.5px]">Fim</span>
                        <Input aria-label="Fim da sprint" type="date" className={estiloCampo} value={fim} onChange={(e) => setFim(e.target.value)} /></label>
                </div>
                {fim < inicio && <p className="text-[12px] text-tom-vermelho-texto">A data de fim não pode ser anterior à de início</p>}
                {!editando && <p className="text-[12px] text-texto-fraco">As linhas marcadas para repetir na sprint anterior são copiadas para esta.</p>}
                {editando?.status === "Ativa" && <p className="text-[12px] text-texto-fraco">Sprint ativa: a linha de base (previsto) não muda.</p>}
                <DialogFooter className="bg-superficie mt-2">
                    <Button variant="ghost" className="text-texto-suave" onClick={onFechar}>Cancelar</Button>
                    <Button variant="destructive" disabled={!valido} onClick={salvar}>{editando ? "Salvar" : "Criar sprint"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const Sprints = () => {
    const eu = useUsuarioLogado({ relerAoMontar: true });
    const souAdmin = eu?.isAdmin === true;
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [criando, setCriando] = useState(false);
    const [editando, setEditando] = useState<Sprint | null>(null);
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        let ativo = true;
        fetchSprints().then((s) => { if (ativo) setSprints(s) }).catch((e) => toast.error(comMotivo("Erro ao buscar sprints", e)));
        return () => { ativo = false };
    }, [recarga]);

    const excluir = async (s: Sprint) => {
        try {
            await deleteSprint(s.id);
            toast.success(`${s.nome} excluída`);
        } catch (e) {
            toast.error(comMotivo("Erro ao excluir a sprint", e));
        }
        setRecarga((n) => n + 1);
    };

    return (
        <Layout>
            <div className="mx-auto max-w-[1080px]">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-texto">Sprints</h1>
                    {souAdmin && <Button variant="destructive" className="ml-auto" onClick={() => setCriando(true)}><Plus />Nova sprint</Button>}
                </div>
                <div className="mt-4 overflow-clip rounded-cartao border border-borda bg-superficie">
                    <Table>
                        <TableHeader className="bg-cabecalho">
                            <TableRow className="border-divisoria hover:bg-transparent">
                                <TableHead className={`${estiloCabecalho} pl-4`}>Sprint</TableHead>
                                <TableHead className={estiloCabecalho}>Período</TableHead>
                                <TableHead className={estiloCabecalho}>Status</TableHead>
                                {souAdmin && <TableHead className={`${estiloCabecalho} w-24`}><span className="sr-only">Ações</span></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sprints.length === 0 && (
                                <TableRow className="border-divisoria hover:bg-transparent">
                                    <TableCell colSpan={souAdmin ? 4 : 3} className="py-6 text-center text-[13px] text-texto-fraco">Nenhuma sprint ainda</TableCell>
                                </TableRow>
                            )}
                            {sprints.map((s) => (
                                <TableRow key={s.id} data-sprint-id={s.id} className="border-divisoria hover:bg-hover">
                                    <TableCell className="pl-4"><Link to={`/sprints/${s.id}`} className="text-[13.5px] font-medium text-texto hover:underline">{s.nome}</Link></TableCell>
                                    <TableCell className="font-mono text-[12.5px] text-texto-2">{formatarDia(s.dataInicio)} – {formatarDia(s.dataFim)}</TableCell>
                                    <TableCell><SeloStatusSprint status={s.status} /></TableCell>
                                    {souAdmin && (
                                        <TableCell className="pr-3 text-right">
                                            {s.status !== "Fechada" && (
                                                <Button variant="ghost" size="icon" aria-label={`Editar ${s.nome}`} title="Editar" className="size-8 text-texto-fraco" onClick={() => setEditando(s)}><Pencil className="size-4" /></Button>
                                            )}
                                            {s.status === "Planejamento" && (
                                                <ConfirmDeleteDialog id={s.id} titulo={s.nome} descricao="sprint (com as filas planejadas nela)" funcao={() => excluir(s)}
                                                    trigger={<Button variant="ghost" size="icon" aria-label={`Excluir ${s.nome}`} title="Excluir" className="size-8 text-texto-fraco hover:text-tom-vermelho-texto"><Trash2 className="size-4" /></Button>} />
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {criando && (
                <DialogSprint sprints={sprints} onFechar={() => setCriando(false)}
                    onSalva={(s) => { setCriando(false); setRecarga((n) => n + 1); toast.success(`${s.nome} criada`); }} />
            )}
            {editando && (
                <DialogSprint sprints={sprints} editando={editando} onFechar={() => setEditando(null)}
                    onSalva={(s) => { setEditando(null); setRecarga((n) => n + 1); toast.success(`${s.nome} salva`); }} />
            )}
        </Layout>
    );
};

export default Sprints;
