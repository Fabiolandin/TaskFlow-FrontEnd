import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckIcon, ChevronRight, Link2, Trash2, Users } from "lucide-react";
import Layout from "@/components/Layout";
import ListaAgrupada from "@/components/ListaAgrupada";
import DescricaoMarkdown from "@/components/DescricaoMarkdown";
import DialogMembrosProjeto from "@/components/DialogMembrosProjeto";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import Progresso from "@/components/Progresso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, comMotivo } from "@/api/apiClient";
import { deleteProjeto, fetchProjeto, updateProjeto, type DadosEdicaoProjeto, type Projeto } from "@/fetchs/fetchProjetos";
import { fetchStatus, ordenarStatus, type Status } from "@/fetchs/fetchStatus";
import { AVISO_PRAZO, dataParaInput, prazoAntesDoInicio, updateTarefa, type DadosEdicaoTarefa } from "@/fetchs/fetchTarefas";
import { copiarTexto, linkDoProjeto } from "@/utils/copiarLink";

const estiloGatilho = "h-8! w-full rounded-md border-transparent bg-transparent px-2 text-[13px] text-[#C9C5BE] hover:bg-[#151A1E] data-[state=open]:bg-[#151A1E]";
const estiloConteudo = "bg-[#151A1E] border border-[#333B44] text-white";
const estiloItem = "text-gray-400 focus:bg-[#333B44] focus:text-white";
const estiloData = "h-8 w-full rounded-md border-transparent bg-transparent px-2 font-mono text-[12.5px] text-[#C9C5BE] [color-scheme:dark] hover:bg-[#151A1E] focus-visible:bg-[#151A1E]";

//só id inteiro positivo vai à API; o resto é "não encontrado" sem pedido (RF-48)
const idDaRota = (valor?: string) => (valor && /^[1-9]\d*$/.test(valor) ? Number(valor) : null);

type Leitura = { estado: "carregando" } | { estado: "naoEncontrado" } | { estado: "erro"; mensagem: string };

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
                <Link to="/projetos">Voltar para Projetos</Link>
            </Button>
        </div>
    </Layout>
);

//página do projeto (RF-48): lê da API, nunca do cartão; cada campo grava ao mudar; tarefas agrupadas por status
const PaginaProjeto = ({ id }: { id: number | null }) => {
    const navigate = useNavigate();
    const [projeto, setProjeto] = useState<Projeto | null>(null);
    const [leitura, setLeitura] = useState<Leitura>(id === null ? { estado: "naoEncontrado" } : { estado: "carregando" });
    const [statusProjeto, setStatusProjeto] = useState<Status[]>([]);
    const [statusTarefa, setStatusTarefa] = useState<Status[]>([]);
    const [recarga, setRecarga] = useState(0);
    const [membrosAberto, setMembrosAberto] = useState(false);

    //rascunhos: null = mostra o valor gravado; um texto = o usuário está mexendo e ainda não saiu do campo
    const [nome, setNome] = useState<string | null>(null);
    const [inicio, setInicio] = useState<string | null>(null);
    const [prazo, setPrazo] = useState<string | null>(null);
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (id === null) return;
        let ativo = true;
        fetchProjeto(id)
            .then((p) => { if (ativo) setProjeto(p) })
            .catch((error) => {
                if (!ativo) return;
                if (error instanceof ApiError && error.status === 404) setLeitura({ estado: "naoEncontrado" });
                else setLeitura({ estado: "erro", mensagem: comMotivo("Erro ao buscar o projeto", error) });
            });
        Promise.all([fetchStatus("projeto"), fetchStatus("tarefa")])
            .then(([deProjeto, deTarefa]) => {
                if (!ativo) return;
                setStatusProjeto(deProjeto);
                setStatusTarefa(deTarefa);
            })
            .catch((error) => toast.error(comMotivo("Erro ao buscar os status", error)));
        return () => { ativo = false };
    }, [id]);

    if (leitura.estado === "naoEncontrado") return <Aviso titulo="Projeto não encontrado" texto="O link pode estar errado, ou o projeto foi excluído." />;
    if (leitura.estado === "erro") return <Aviso titulo="Não foi possível abrir o projeto" texto={leitura.mensagem} />;
    if (!projeto) {
        return (
            <Layout>
                <p className="py-24 text-center text-sm text-[#7C8189]">Carregando…</p>
            </Layout>
        );
    }

    //relê o projeto (membros e progresso), sem trocar a tela em caso de falha
    const reler = async () => {
        try {
            setProjeto(await fetchProjeto(projeto.id));
        } catch (error) {
            toast.error(comMotivo("Erro ao atualizar o projeto", error));
        }
    }

    //um campo por PATCH; a resposta vira o estado da página; na falha, aviso e o valor gravado continua (RF-48)
    const gravar = async (dados: DadosEdicaoProjeto) => {
        try {
            setProjeto(await updateProjeto(projeto.id, dados));
            return true;
        } catch (error) {
            toast.error(comMotivo("Não foi possível salvar a alteração", error));
            return false;
        }
    }

    const sairDoNome = async () => {
        if (nome === null) return;
        const novo = nome.trim();
        //vazio volta ao nome anterior; sem mudança não grava
        if (!novo || novo === projeto.nome) { setNome(null); return; }
        await gravar({ nome: novo });
        setNome(null);
    }

    //datas pelo dia (AAAA-MM-DD); prazo antes do início não vai (lacuna do RF-13: só a tela bloqueia)
    const sairDaData = async (campo: "data_inicio" | "data_final") => {
        const rascunho = campo === "data_inicio" ? inicio : prazo;
        const limpar = () => (campo === "data_inicio" ? setInicio(null) : setPrazo(null));
        if (rascunho === null) return;
        if (rascunho === dataParaInput(projeto[campo])) { limpar(); return; }
        const novoInicio = campo === "data_inicio" ? rascunho : dataParaInput(projeto.data_inicio);
        const novoPrazo = campo === "data_final" ? rascunho : dataParaInput(projeto.data_final);
        if (prazoAntesDoInicio(novoInicio, novoPrazo)) {
            toast.error(AVISO_PRAZO);
            limpar();
            return;
        }
        await gravar(campo === "data_inicio" ? { data_inicio: rascunho || null } : { data_final: rascunho || null });
        limpar();
    }

    const trocarStatus = (valor: string) => { if (Number(valor) !== projeto.idStatus) gravar({ idStatus: Number(valor) }); };

    //troca na linha de uma tarefa: grava, relê os grupos e o projeto (o progresso muda, CA-12)
    const trocarNaTarefa = async (idTarefa: number, dados: DadosEdicaoTarefa) => {
        try {
            await updateTarefa(idTarefa, dados);
        } catch (error) {
            toast.error(comMotivo("Erro ao atualizar tarefa", error));
            return;
        }
        setRecarga((n) => n + 1);
        await reler();
    }

    //ao fechar o dialog de membros (cada clique já gravou), a página relê o projeto
    const mudarMembros = (aberto: boolean) => {
        setMembrosAberto(aberto);
        if (!aberto) reler();
    }

    //sucesso volta à lista com aviso; a recusa (409 "Projeto em uso: …") mostra a mensagem e a página fica (RF-50)
    const excluir = async () => {
        try {
            await deleteProjeto(projeto.id);
        } catch (error) {
            toast.error(comMotivo("Não foi possível excluir o projeto", error));
            return;
        }
        toast.success("Projeto excluído com sucesso!");
        navigate("/projetos");
    }

    const copiar = async () => {
        try {
            await copiarTexto(linkDoProjeto(projeto.id));
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {
            toast.error("Não foi possível copiar o link");
        }
    }

    const statusOrdenados = ordenarStatus(statusProjeto);

    return (
        <Layout>
            <div className="mx-auto max-w-[1180px]">
                <header className="mb-6 flex h-9 items-center gap-2">
                    <nav aria-label="Trilha" className="flex min-w-0 items-center gap-1.5 text-[13px]">
                        <Link to="/projetos" className="text-[#8A9098] hover:text-[#E7E4DF] hover:underline">Projetos</Link>
                        <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-[#4E5359]" />
                        <span className="truncate text-[#C9C5BE]">{projeto.nome}</span>
                    </nav>
                    <Button variant="ghost" size="sm" aria-label="Copiar link" className="ml-auto text-[#8A9098]" onClick={copiar}>
                        {copiado ? <CheckIcon aria-hidden="true" /> : <Link2 aria-hidden="true" />}
                        {copiado ? "Copiado" : "Copiar link"}
                    </Button>
                    <ConfirmDeleteDialog
                        trigger={
                            <Button variant="ghost" size="sm" aria-label="Excluir projeto" className="text-[#8A9098] hover:text-red-300">
                                <Trash2 aria-hidden="true" />Excluir
                            </Button>
                        }
                        id={projeto.id}
                        titulo={projeto.nome}
                        descricao="projeto"
                        funcao={excluir}
                    />
                </header>

                <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-10">
                    <div data-coluna="principal" className="flex min-w-0 flex-col gap-3">
                        <Input
                            aria-label="Nome do projeto"
                            value={nome ?? projeto.nome}
                            onChange={(e) => setNome(e.target.value)}
                            onBlur={sairDoNome}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            className="-mx-2 h-11 border-transparent bg-transparent px-2 font-heading text-[22px]! font-semibold tracking-[-.02em] text-[#E7E4DF] hover:bg-[#121518] focus-visible:bg-[#121518] focus-visible:ring-0"
                        />
                        <DescricaoMarkdown valor={projeto.descricao} onGravar={(descricao) => gravar({ descricao })} />

                        <section aria-label="Tarefas do projeto" className="mt-3 border-t border-[#1C1F23] pt-5">
                            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[.12em] text-[#6E7379]">Tarefas</h2>
                            <ListaAgrupada filtros={{ idProjeto: projeto.id }} statusOptions={statusTarefa} recarga={recarga} onTrocar={trocarNaTarefa} />
                        </section>
                    </div>

                    <aside data-coluna="propriedades" className="flex flex-col gap-0.5 rounded-lg border border-[#1C1F23] bg-[#0E1012] p-3">
                        <Propriedade rotulo="Status">
                            <Select value={String(projeto.idStatus)} onValueChange={trocarStatus}>
                                <SelectTrigger aria-label="Status" className={estiloGatilho}><SelectValue /></SelectTrigger>
                                <SelectContent className={estiloConteudo}>
                                    <SelectGroup>
                                        {(statusOrdenados.length ? statusOrdenados : [projeto.status]).map((s) => (
                                            <SelectItem className={estiloItem} key={s.id} value={String(s.id)}>
                                                {s.cor && <span aria-hidden="true" className="inline-block size-2 rounded-full" style={{ backgroundColor: s.cor }} />}
                                                {s.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Propriedade>

                        <Propriedade rotulo="Data de início">
                            <Input aria-label="Data de início" type="date" className={estiloData}
                                value={inicio ?? dataParaInput(projeto.data_inicio)}
                                onChange={(e) => setInicio(e.target.value)}
                                onBlur={() => sairDaData("data_inicio")} />
                        </Propriedade>

                        <Propriedade rotulo="Prazo">
                            <Input aria-label="Prazo" type="date" className={estiloData}
                                value={prazo ?? dataParaInput(projeto.data_final)}
                                onChange={(e) => setPrazo(e.target.value)}
                                onBlur={() => sairDaData("data_final")} />
                        </Propriedade>

                        <Propriedade rotulo="Membros">
                            <button type="button" aria-label="Membros" onClick={() => setMembrosAberto(true)}
                                className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md px-2 py-1 text-left outline-none hover:bg-[#151A1E] focus-visible:bg-[#151A1E]">
                                {projeto.membros.map((m) => (
                                    <span key={m.id} data-membro className="rounded-md border border-[#24272B] bg-[#121518] px-1.5 py-0.5 text-[11px] text-[#A9AEB4]">{m.nome}</span>
                                ))}
                                {projeto.membros.length === 0 && (
                                    <span className="flex items-center gap-1 text-[12.5px] text-[#5E6369]"><Users aria-hidden="true" className="size-3.5" />Adicionar</span>
                                )}
                            </button>
                        </Propriedade>

                        <Propriedade rotulo="Progresso">
                            <div className="px-2 py-1"><Progresso progresso={projeto.progresso} /></div>
                        </Propriedade>
                    </aside>
                </div>
            </div>
            <DialogMembrosProjeto open={membrosAberto} onOpenChange={mudarMembros} projeto={projeto} />
        </Layout>
    );
};

//a `key` pelo id faz cada projeto nascer do zero ao trocar de /projetos/1 para /projetos/2
const ProjetoDaRota = () => {
    const { id } = useParams();
    return <PaginaProjeto key={id} id={idDaRota(id)} />;
};

export default ProjetoDaRota;
