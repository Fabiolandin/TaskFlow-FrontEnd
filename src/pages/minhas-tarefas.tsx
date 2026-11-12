import Layout from "@/components/Layout";
import ListaTarefas from "@/components/ListaTarefas";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { comMotivo } from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useAoCriarTarefa } from "@/context/CriarTarefaContext";
import { fetchProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { fetchStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchLabels } from "@/fetchs/fetchLabel";
import { consultaParaUrl, fetchTarefas, lerConsultaDaUrl, updateTarefa, type DadosEdicaoTarefa, type FiltrosTarefa, type PaginaTarefas } from "@/fetchs/fetchTarefas";
import type { Label } from "@/pages/labels";

const PAGINA_VAZIA: PaginaTarefas = { data: [], total: 0, page: 1, totalPages: 0 };
const TODOS = "todos";
const estiloFiltro = "w-44 h-9! rounded-md bg-elevado border-borda-forte text-texto";
const estiloItem = "text-texto-suave focus:bg-realce focus:text-texto";

//filtros que o usuário mexe aqui, e que vão na URL; o `idUsuarioResponsavel` é fixo e vem do token
type FiltroLivre = "idProjeto" | "idStatus" | "idLabel";
const CHAVES: FiltroLivre[] = ["idProjeto", "idStatus", "idLabel"];

//tarefas em que o usuário logado é o responsável (RF-38; quem só criou não vê aqui); só tabela, sem criar
const MinhasTarefas = () => {
    const { usuario } = useAuth();
    const idLogado = usuario?.id;

    //página e filtros na URL (RF-44)
    const [params, setParams] = useSearchParams();
    const chaveDaUrl = params.toString();
    const consulta = useMemo(() => lerConsultaDaUrl(new URLSearchParams(chaveDaUrl), CHAVES), [chaveDaUrl]);
    const [resposta, setResposta] = useState<PaginaTarefas>(PAGINA_VAZIA);
    const pagina = resposta.page;
    const totalPaginas = Math.max(resposta.totalPages, 1);

    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [statusOptions, setStatusOptions] = useState<Status[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [recarga, setRecarga] = useState(0);
    //tarefa criada pela tecla C: a lista relê (RF-34)
    useAoCriarTarefa(() => setRecarga((n) => n + 1));

    useEffect(() => {
        let ativo = true;
        Promise.all([fetchProjetos(1, 100), fetchStatus("tarefa"), fetchLabels()])
            .then(([paginaProjetos, listaStatus, listaLabels]) => {
                if (!ativo) return;
                setProjetos(paginaProjetos.data);
                setStatusOptions(listaStatus);
                setLabels(listaLabels);
            })
            .catch((error) => toast.error(comMotivo("Erro ao buscar projetos, status e labels", error)));
        return () => { ativo = false };
    }, []);

    useEffect(() => {
        if (idLogado === undefined) return;
        let ativo = true;
        const { pagina: p, filtros } = lerConsultaDaUrl(new URLSearchParams(chaveDaUrl), CHAVES);
        fetchTarefas(p, { ...filtros, idUsuarioResponsavel: idLogado })
            .then((nova) => { if (ativo) setResposta(nova) })
            .catch((error) => toast.error(comMotivo("Erro ao buscar tarefas", error)));
        return () => { ativo = false };
    }, [chaveDaUrl, recarga, idLogado]);

    const irPara = (novaPagina: number, filtros: FiltrosTarefa) => setParams(consultaParaUrl(novaPagina, filtros), { replace: true });

    const mudarFiltro = (chave: FiltroLivre, valor: string) => {
        const filtros = { ...consulta.filtros };
        if (valor === TODOS) delete filtros[chave];
        else filtros[chave] = Number(valor);
        irPara(1, filtros);
    }

    //troca de status/prioridade na linha (RF-44): um campo por PATCH, a lista relê; sucesso sem aviso
    const trocarCampo = async (id: number, dados: DadosEdicaoTarefa) => {
        try {
            await updateTarefa(id, dados);
        } catch (error) {
            toast.error(comMotivo("Erro ao atualizar tarefa", error));
            return;
        }
        setRecarga((n) => n + 1);
    }

    const filtro = (rotulo: string, chave: FiltroLivre, opcoes: { id: number; nome: string }[]) => (
        <Select value={String(consulta.filtros[chave] ?? TODOS)} onValueChange={(v) => mudarFiltro(chave, v)}>
            <SelectTrigger aria-label={`Filtrar por ${rotulo}`} className={estiloFiltro}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-elevado border border-borda-forte text-texto">
                <SelectGroup>
                    <SelectItem className={estiloItem} value={TODOS}>{rotulo}: todos</SelectItem>
                    {opcoes.map((o) => (
                        <SelectItem className={estiloItem} key={o.id} value={String(o.id)}>{o.nome}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-texto">Minhas Tarefas</h1>
                <p className="text-sm text-texto-suave mt-2 ml-2">{resposta.total} no total</p>
            </div>

            <div className="mt-4 flex flex-row flex-wrap gap-2">
                {filtro("Projeto", "idProjeto", projetos)}
                {filtro("Status", "idStatus", statusOptions)}
                {filtro("Label", "idLabel", labels)}
            </div>

            <ListaTarefas
                tarefas={resposta.data}
                pagina={pagina}
                totalPaginas={totalPaginas}
                onPagina={(p) => irPara(p, consulta.filtros)}
                statusOptions={statusOptions}
                onTrocar={trocarCampo}
                vazio="Você não é responsável por nenhuma tarefa"
            />
        </Layout>
    );
};

export default MinhasTarefas;
