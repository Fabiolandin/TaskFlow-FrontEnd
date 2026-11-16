import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { comMotivo } from "@/api/apiClient";
import { createSprint, fetchSprints, type Sprint } from "@/fetchs/fetchSprints";
import SeloStatusSprint from "@/components/SeloStatusSprint";
import { formatarDia } from "@/utils/formaters/fdata";
import { useUsuarioLogado } from "@/utils/usuarioLogado";

//lista de sprints (RF-117, SPEC-024): mais recente primeiro; admin cria

const estiloCabecalho = "h-9 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-texto-mudo";
const estiloCampo = "text-texto bg-elevado border-borda-forte h-9";

const somarDias = (data: string, n: number) => new Date(Date.parse(`${data}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

const DialogNovaSprint = ({ sprints, onFechar, onCriada }: { sprints: Sprint[]; onFechar: () => void; onCriada: (s: Sprint) => void }) => {
    //sugere a sequência: começa no dia seguinte à última e dura o mesmo
    const ultima = sprints[0];
    const inicioSugerido = ultima ? somarDias(ultima.dataFim.slice(0, 10), 1) : new Date().toISOString().slice(0, 10);
    const duracao = ultima ? Math.round((Date.parse(ultima.dataFim) - Date.parse(ultima.dataInicio)) / 86400000) : 13;
    const proximoNome = ultima?.nome.match(/^(.*?)(\d+)$/) ? ultima.nome.replace(/(\d+)$/, (n) => String(Number(n) + 1)) : "Sprint 1";
    const [nome, setNome] = useState(proximoNome);
    const [inicio, setInicio] = useState(inicioSugerido);
    const [fim, setFim] = useState(somarDias(inicioSugerido, duracao));
    const valido = !!nome.trim() && !!inicio && !!fim && fim >= inicio;

    const criar = async () => {
        try {
            onCriada(await createSprint({ nome: nome.trim(), dataInicio: inicio, dataFim: fim }));
        } catch (e) {
            toast.error(comMotivo("Erro ao criar a sprint", e));
        }
    };

    return (
        <Dialog open onOpenChange={(v) => { if (!v) onFechar(); }}>
            <DialogContent className="bg-superficie flex w-[460px] flex-col gap-2 p-5">
                <DialogHeader><DialogTitle className="text-texto text-[17px]">Nova sprint</DialogTitle></DialogHeader>
                <p className="text-texto-suave text-[12.5px]">Nome</p>
                <Input aria-label="Nome da sprint" className={estiloCampo} value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1"><span className="text-texto-suave text-[12.5px]">Início</span>
                        <Input aria-label="Início da sprint" type="date" className={estiloCampo} value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>
                    <label className="flex flex-col gap-1"><span className="text-texto-suave text-[12.5px]">Fim</span>
                        <Input aria-label="Fim da sprint" type="date" className={estiloCampo} value={fim} onChange={(e) => setFim(e.target.value)} /></label>
                </div>
                {fim < inicio && <p className="text-[12px] text-tom-vermelho-texto">A data de fim não pode ser anterior à de início</p>}
                <p className="text-[12px] text-texto-fraco">As linhas marcadas para repetir na sprint anterior são copiadas para esta.</p>
                <DialogFooter className="bg-superficie mt-2">
                    <Button variant="ghost" className="text-texto-suave" onClick={onFechar}>Cancelar</Button>
                    <Button variant="destructive" disabled={!valido} onClick={criar}>Criar sprint</Button>
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
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        let ativo = true;
        fetchSprints().then((s) => { if (ativo) setSprints(s) }).catch((e) => toast.error(comMotivo("Erro ao buscar sprints", e)));
        return () => { ativo = false };
    }, [recarga]);

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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sprints.length === 0 && (
                                <TableRow className="border-divisoria hover:bg-transparent">
                                    <TableCell colSpan={3} className="py-6 text-center text-[13px] text-texto-fraco">Nenhuma sprint ainda</TableCell>
                                </TableRow>
                            )}
                            {sprints.map((s) => (
                                <TableRow key={s.id} data-sprint-id={s.id} className="border-divisoria hover:bg-hover">
                                    <TableCell className="pl-4"><Link to={`/sprints/${s.id}`} className="text-[13.5px] font-medium text-texto hover:underline">{s.nome}</Link></TableCell>
                                    <TableCell className="font-mono text-[12.5px] text-texto-2">{formatarDia(s.dataInicio)} – {formatarDia(s.dataFim)}</TableCell>
                                    <TableCell><SeloStatusSprint status={s.status} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {criando && (
                <DialogNovaSprint sprints={sprints} onFechar={() => setCriando(false)}
                    onCriada={(s) => { setCriando(false); setRecarga((n) => n + 1); toast.success(`${s.nome} criada`); }} />
            )}
        </Layout>
    );
};

export default Sprints;
