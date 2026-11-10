import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckIcon, ChevronRight, Link2, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import StatusIcon from "@/components/StatusIcon";
import PrioridadeIcon from "@/components/PrioridadeIcon";
import ComentariosDaTarefa from "@/components/ComentariosDaTarefa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ApiError, comMotivo } from "@/api/apiClient";
import { AVISO_PRAZO, dataParaInput, fetchTarefa, PRIORIDADES, prazoAntesDoInicio, updateTarefa, type DadosEdicaoTarefa, type Tarefa } from "@/fetchs/fetchTarefas";
import { fetchProjeto, fetchProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { fetchStatus, ordenarStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchLabels } from "@/fetchs/fetchLabel";
import type { Membro } from "@/fetchs/fetchMembros";
import type { Label } from "@/pages/labels";
import { copiarTexto, linkDaTarefa } from "@/utils/copiarLink";

const SEM_RESPONSAVEL = "sem-responsavel";
const estiloGatilho = "h-8! w-full rounded-md border-transparent bg-transparent px-2 text-[13px] text-[#C9C5BE] hover:bg-[#151A1E] data-[state=open]:bg-[#151A1E]";
const estiloConteudo = "bg-[#151A1E] border border-[#333B44] text-white";
const estiloItem = "text-gray-400 focus:bg-[#333B44] focus:text-white";
const estiloData = "h-8 w-full rounded-md border-transparent bg-transparent px-2 font-mono text-[12.5px] text-[#C9C5BE] [color-scheme:dark] hover:bg-[#151A1E] focus-visible:bg-[#151A1E]";

//só id inteiro positivo vai à API; o resto é "não encontrada" sem pedido (RF-46, D-12)
const idDaRota = (valor?: string) => (valor && /^[1-9]\d*$/.test(valor) ? Number(valor) : null);

type Leitura = { estado: "carregando" } | { estado: "naoEncontrada" } | { estado: "erro"; mensagem: string };

const Propriedade = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
    <div className="grid min-h-9 grid-cols-[92px_minmax(0,1fr)] items-center gap-2">
        <span className="text-[12px] text-[#7C8189]">{rotulo}</span>
        <div className="min-w-0">{children}</div>
    </div>
);

const Aviso = ({ titulo, texto }: { titulo: string; texto: string }) => (
    <Layout>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="font-heading text-lg font-semibold text-[#E7E4DF]">{titulo}</p>
            <p className="text-sm text-[#7C8189]">{texto}</p>
            <Button asChild variant="ghost" className="text-[#8A9098]">
                <Link to="/tarefas">Voltar para Tarefas</Link>
            </Button>
        </div>
    </Layout>
);

//página da tarefa (RF-46): lê da API, nunca da linha da lista; cada campo grava ao mudar (RF-47)
const PaginaTarefa = ({ id }: { id: number | null }) => {
    const [tarefa, setTarefa] = useState<Tarefa | null>(null);
    const [leitura, setLeitura] = useState<Leitura>(id === null ? { estado: "naoEncontrada" } : { estado: "carregando" });
    const [statusOptions, setStatusOptions] = useState<Status[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [membros, setMembros] = useState<Membro[]>([]);

    //rascunhos: null = mostra o valor gravado; um texto = o usuário está mexendo e ainda não saiu do campo
    const [titulo, setTitulo] = useState<string | null>(null);
    const [descricao, setDescricao] = useState<string | null>(null);
    const [inicio, setInicio] = useState<string | null>(null);
    const [prazo, setPrazo] = useState<string | null>(null);
    const [labelsAberto, setLabelsAberto] = useState(false);
    const [labelsMarcadas, setLabelsMarcadas] = useState<number[] | null>(null);
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (id === null) return;
        let ativo = true;
        fetchTarefa(id)
            .then((t) => { if (ativo) setTarefa(t) })
            .catch((error) => {
                if (!ativo) return;
                if (error instanceof ApiError && error.status === 404) setLeitura({ estado: "naoEncontrada" });
                else setLeitura({ estado: "erro", mensagem: comMotivo("Erro ao buscar a tarefa", error) });
            });
        Promise.all([fetchStatus("tarefa"), fetchLabels(), fetchProjetos(1, 100)])
            .then(([listaStatus, listaLabels, paginaProjetos]) => {
                if (!ativo) return;
                setStatusOptions(listaStatus);
                setLabels(listaLabels);
                setProjetos(paginaProjetos.data);
            })
            .catch((error) => toast.error(comMotivo("Erro ao buscar status, labels e projetos", error)));
        return () => { ativo = false };
    }, [id]);

    //membros do projeto atual da tarefa, de GET /projetos/:id (RF-26, C-5); relidos quando o projeto muda
    const idProjeto = tarefa?.idProjeto;
    useEffect(() => {
        if (idProjeto === undefined) return;
        let ativo = true;
        fetchProjeto(idProjeto)
            .then((p) => { if (ativo) setMembros(p.membros) })
            .catch((error) => toast.error(comMotivo("Erro ao buscar os membros do projeto", error)));
        return () => { ativo = false };
    }, [idProjeto]);

    if (leitura.estado === "naoEncontrada") return <Aviso titulo="Tarefa não encontrada" texto="O link pode estar errado, ou a tarefa foi excluída." />;
    if (leitura.estado === "erro") return <Aviso titulo="Não foi possível abrir a tarefa" texto={leitura.mensagem} />;
    if (!tarefa) {
        return (
            <Layout>
                <p className="py-24 text-center text-sm text-[#7C8189]">Carregando…</p>
            </Layout>
        );
    }

    //um campo por PATCH; a resposta vira o estado da página; na falha, aviso e o valor gravado continua (RF-47)
    const gravar = async (dados: DadosEdicaoTarefa) => {
        try {
            setTarefa(await updateTarefa(tarefa.id, dados));
            return true;
        } catch (error) {
            toast.error(comMotivo("Não foi possível salvar a alteração", error));
            return false;
        }
    }

    const sairDoTitulo = async () => {
        if (titulo === null) return;
        const novo = titulo.trim();
        //vazio volta ao título anterior; sem mudança não grava (D-4)
        if (!novo || novo === tarefa.nome) { setTitulo(null); return; }
        await gravar({ nome: novo });
        setTitulo(null);
    }

    const sairDaDescricao = async () => {
        if (descricao === null) return;
        const novo = descricao.trim() ? descricao.trim() : null;
        if (descricao === (tarefa.descricao ?? "") || novo === tarefa.descricao) { setDescricao(null); return; }
        await gravar({ descricao: novo });
        setDescricao(null);
    }

    //datas pelo dia (AAAA-MM-DD); prazo antes do início não vai (L-1)
    const sairDaData = async (campo: "data_inicio" | "data_final") => {
        const rascunho = campo === "data_inicio" ? inicio : prazo;
        const limpar = () => (campo === "data_inicio" ? setInicio(null) : setPrazo(null));
        if (rascunho === null) return;
        if (rascunho === dataParaInput(tarefa[campo])) { limpar(); return; }
        const novoInicio = campo === "data_inicio" ? rascunho : dataParaInput(tarefa.data_inicio);
        const novoPrazo = campo === "data_final" ? rascunho : dataParaInput(tarefa.data_final);
        if (prazoAntesDoInicio(novoInicio, novoPrazo)) {
            toast.error(AVISO_PRAZO);
            limpar();
            return;
        }
        await gravar(campo === "data_inicio" ? { data_inicio: rascunho || null } : { data_final: rascunho || null });
        limpar();
    }

    const trocarStatus = (valor: string) => { if (Number(valor) !== tarefa.idStatus) gravar({ idStatus: Number(valor) }); };
    const trocarPrioridade = (valor: string) => { if (valor !== tarefa.prioridade) gravar({ prioridade: valor }); };
    const trocarResponsavel = (valor: string) => {
        const novo = valor === SEM_RESPONSAVEL ? null : Number(valor);
        if (novo !== tarefa.idUsuarioResponsavel) gravar({ idUsuarioResponsavel: novo });
    }

    //responsável que não é membro do destino sai no mesmo PATCH, com aviso (D-3)
    const trocarProjeto = async (valor: string) => {
        const destino = Number(valor);
        if (destino === tarefa.idProjeto) return;
        let projeto: Projeto;
        try {
            projeto = await fetchProjeto(destino);
        } catch (error) {
            toast.error(comMotivo("Erro ao buscar o projeto", error));
            return;
        }
        const responsavel = tarefa.idUsuarioResponsavel;
        const continua = responsavel === null || projeto.membros.some((m) => m.id === responsavel);
        const gravou = await gravar(continua ? { idProjeto: destino } : { idProjeto: destino, idUsuarioResponsavel: null });
        if (!gravou) return;
        setMembros(projeto.membros);
        if (!continua) toast.warning(`${tarefa.responsavel?.nome ?? "O responsável"} não é membro de ${projeto.nome}: a tarefa ficou sem responsável`);
    }

    //labels: marcar e desmarcar não grava; ao fechar o seletor vai um PATCH com a lista inteira, se mudou (D-5)
    const idsGravados = tarefa.labels.map((l) => l.id);
    const abrirLabels = (aberto: boolean) => {
        setLabelsAberto(aberto);
        if (aberto) { setLabelsMarcadas(idsGravados); return; }
        const marcadas = labelsMarcadas;
        if (marcadas === null) return;
        const mudou = marcadas.length !== idsGravados.length || marcadas.some((l) => !idsGravados.includes(l));
        if (!mudou) { setLabelsMarcadas(null); return; }
        gravar({ labelIds: marcadas }).then(() => setLabelsMarcadas(null));
    }
    const alternarLabel = (idLabel: number) => setLabelsMarcadas((atual) => {
        const lista = atual ?? idsGravados;
        return lista.includes(idLabel) ? lista.filter((l) => l !== idLabel) : [...lista, idLabel];
    });
    const labelsNaTela = labelsMarcadas === null ? tarefa.labels : labels.filter((l) => labelsMarcadas.includes(l.id));

    const copiar = async () => {
        try {
            await copiarTexto(linkDaTarefa(tarefa.id));
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {
            toast.error("Não foi possível copiar o link");
        }
    }

    const statusOrdenados = ordenarStatus(statusOptions);

    return (
        <Layout>
            <div className="mx-auto max-w-[1180px]">
                <header className="mb-6 flex h-9 items-center gap-3">
                    <nav aria-label="Trilha" className="flex min-w-0 items-center gap-1.5 text-[13px]">
                        <Link to={`/tarefas?idProjeto=${tarefa.idProjeto}`} className="truncate text-[#8A9098] hover:text-[#E7E4DF] hover:underline">{tarefa.projeto.nome}</Link>
                        <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-[#4E5359]" />
                        <span className="truncate text-[#C9C5BE]">{tarefa.nome}</span>
                    </nav>
                    <Button variant="ghost" size="sm" aria-label="Copiar link" className="ml-auto text-[#8A9098]" onClick={copiar}>
                        {copiado ? <CheckIcon aria-hidden="true" /> : <Link2 aria-hidden="true" />}
                        {copiado ? "Copiado" : "Copiar link"}
                    </Button>
                </header>

                <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-10">
                    <div data-coluna="principal" className="flex min-w-0 flex-col gap-3">
                        <Input
                            aria-label="Título"
                            value={titulo ?? tarefa.nome}
                            onChange={(e) => setTitulo(e.target.value)}
                            onBlur={sairDoTitulo}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            className="-mx-2 h-11 border-transparent bg-transparent px-2 font-heading text-[22px]! font-semibold tracking-[-.02em] text-[#E7E4DF] hover:bg-[#121518] focus-visible:bg-[#121518] focus-visible:ring-0"
                        />
                        <Textarea
                            aria-label="Descrição"
                            placeholder="Adicione uma descrição…"
                            value={descricao ?? tarefa.descricao ?? ""}
                            onChange={(e) => setDescricao(e.target.value)}
                            onBlur={sairDaDescricao}
                            className="-mx-2 min-h-28 border-transparent bg-transparent px-2 text-[13px] leading-[1.6] text-[#B8B4AD] placeholder:text-[#5E6369] hover:bg-[#121518] focus-visible:bg-[#121518] focus-visible:ring-0"
                        />
                        <ComentariosDaTarefa idTarefa={tarefa.id} />
                    </div>

                    <aside data-coluna="propriedades" className="flex flex-col gap-0.5 rounded-lg border border-[#1C1F23] bg-[#0E1012] p-3">
                        <Propriedade rotulo="Status">
                            <Select value={String(tarefa.idStatus)} onValueChange={trocarStatus}>
                                <SelectTrigger aria-label="Status" className={estiloGatilho}><SelectValue /></SelectTrigger>
                                <SelectContent className={estiloConteudo}>
                                    <SelectGroup>
                                        {(statusOrdenados.length ? statusOrdenados : [{ ...tarefa.status, ordem: 0 }]).map((s) => (
                                            <SelectItem className={estiloItem} key={s.id} value={String(s.id)}>
                                                <StatusIcon status={s} todos={statusOptions} />{s.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Propriedade>

                        <Propriedade rotulo="Prioridade">
                            <Select value={tarefa.prioridade} onValueChange={trocarPrioridade}>
                                <SelectTrigger aria-label="Prioridade" className={estiloGatilho}><SelectValue /></SelectTrigger>
                                <SelectContent className={estiloConteudo}>
                                    <SelectGroup>
                                        {PRIORIDADES.map((p) => (
                                            <SelectItem className={estiloItem} key={p} value={p}><PrioridadeIcon prioridade={p} />{p}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Propriedade>

                        <Propriedade rotulo="Responsável">
                            <Select value={tarefa.idUsuarioResponsavel === null ? SEM_RESPONSAVEL : String(tarefa.idUsuarioResponsavel)} onValueChange={trocarResponsavel}>
                                <SelectTrigger aria-label="Responsável" className={estiloGatilho}><SelectValue placeholder={tarefa.responsavel?.nome ?? "Sem responsável"} /></SelectTrigger>
                                <SelectContent className={estiloConteudo}>
                                    <SelectGroup>
                                        <SelectItem className={estiloItem} value={SEM_RESPONSAVEL}>Sem responsável</SelectItem>
                                        {membros.map((m) => (
                                            <SelectItem className={estiloItem} key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Propriedade>

                        <Propriedade rotulo="Data de início">
                            <Input aria-label="Data de início" type="date" className={estiloData}
                                value={inicio ?? dataParaInput(tarefa.data_inicio)}
                                onChange={(e) => setInicio(e.target.value)}
                                onBlur={() => sairDaData("data_inicio")} />
                        </Propriedade>

                        <Propriedade rotulo="Prazo">
                            <Input aria-label="Prazo" type="date" className={estiloData}
                                value={prazo ?? dataParaInput(tarefa.data_final)}
                                onChange={(e) => setPrazo(e.target.value)}
                                onBlur={() => sairDaData("data_final")} />
                        </Propriedade>

                        <Propriedade rotulo="Projeto">
                            <Select value={String(tarefa.idProjeto)} onValueChange={trocarProjeto}>
                                <SelectTrigger aria-label="Projeto" className={estiloGatilho}><SelectValue placeholder={tarefa.projeto.nome} /></SelectTrigger>
                                <SelectContent className={estiloConteudo}>
                                    <SelectGroup>
                                        {projetos.map((p) => (
                                            <SelectItem className={estiloItem} key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Propriedade>

                        <Propriedade rotulo="Labels">
                            <DropdownMenu open={labelsAberto} onOpenChange={abrirLabels}>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" aria-label="Labels" className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md px-2 py-1 text-left outline-none hover:bg-[#151A1E] focus-visible:bg-[#151A1E] data-[state=open]:bg-[#151A1E]">
                                        {labelsNaTela.map((l) => (
                                            <span key={l.id} data-label className="rounded-md border border-[#24272B] bg-[#121518] px-1.5 py-0.5 text-[11px] text-[#A9AEB4]">{l.nome}</span>
                                        ))}
                                        {labelsNaTela.length === 0 && (
                                            <span className="flex items-center gap-1 text-[12.5px] text-[#5E6369]"><Plus aria-hidden="true" className="size-3.5" />Adicionar</span>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {labels.length === 0 && <p className="px-2 py-1.5 text-[12px] text-[#61666C]">Nenhuma label cadastrada</p>}
                                    {labels.map((l) => (
                                        <DropdownMenuCheckboxItem key={l.id} checked={(labelsMarcadas ?? idsGravados).includes(l.id)}
                                            onCheckedChange={() => alternarLabel(l.id)} onSelect={(e) => e.preventDefault()}>
                                            {l.nome}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Propriedade>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};

//a `key` pelo id faz cada tarefa nascer do zero ao trocar de /tarefas/1 para /tarefas/2
const TarefaDaRota = () => {
    const { id } = useParams();
    return <PaginaTarefa key={id} id={idDaRota(id)} />;
};

export default TarefaDaRota;
