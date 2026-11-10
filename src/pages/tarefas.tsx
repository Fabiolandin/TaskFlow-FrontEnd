import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ListaTarefas from "@/components/ListaTarefas";
import ListaAgrupada from "@/components/ListaAgrupada";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { LayoutList, Table2 } from "lucide-react";
import { ApiError } from "@/api/apiClient";
import { fetchProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { fetchStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchLabels } from "@/fetchs/fetchLabel";
import { fetchUsuarios } from "@/fetchs/fetchUsuarios";
import { consultaParaUrl, fetchTarefas, lerConsultaDaUrl, updateTarefa, type DadosEdicaoTarefa, type FiltrosTarefa, type PaginaTarefas } from "@/fetchs/fetchTarefas";
import { useAbrirCriarTarefa } from "@/context/CriarTarefaContext";
import type { Label } from "@/pages/labels";
import type { Usuario } from "@/pages/usuarios";

const PAGINA_VAZIA: PaginaTarefas = { data: [], total: 0, page: 1, totalPages: 0 };
const TODOS = "todos";
const estiloFiltro = "w-44 h-9! rounded-md bg-[#151A1E] border-[#333B44] text-white";
const estiloItem = "text-gray-400 focus:bg-[#333B44] focus:text-white";
//filtros que vão na URL desta tela (RF-44)
const CHAVES: (keyof FiltrosTarefa)[] = ["idProjeto", "idStatus", "idUsuarioResponsavel", "idLabel"];

//exibição agrupada ou tabela, salva no navegador; sem escolha ou sem localStorage, tabela (RF-45)
type Exibicao = "tabela" | "agrupado";
const CHAVE_EXIBICAO = "taskflow:tarefas:exibicao";
const lerExibicao = (): Exibicao => {
    try {
        return localStorage.getItem(CHAVE_EXIBICAO) === "agrupado" ? "agrupado" : "tabela";
    } catch {
        return "tabela";
    }
}

//mensagem da API quando ela manda texto; senão, só o texto fixo
const comMotivo = (texto: string, error: unknown) => {
    const motivo = error instanceof ApiError ? error.mensagemDaApi : undefined;
    return motivo ? `${texto}: ${motivo}` : texto;
}

//o dialog de criar é o único do app, hospedado pelo Layout, o mesmo da tecla C (RF-57, D-13)
const BotaoNovaTarefa = () => {
    const abrir = useAbrirCriarTarefa();
    return <Button variant="destructive" onClick={abrir}>Nova Tarefa</Button>;
}

const Tarefas = () => {

    //página e filtros vivem na URL: abrir uma tarefa e voltar restaura a lista (RF-44, D-8)
    const [params, setParams] = useSearchParams();
    const chaveDaUrl = params.toString();
    const consulta = useMemo(() => lerConsultaDaUrl(new URLSearchParams(chaveDaUrl), CHAVES), [chaveDaUrl]);
    const [resposta, setResposta] = useState<PaginaTarefas>(PAGINA_VAZIA);
    const pagina = resposta.page;
    const totalPaginas = Math.max(resposta.totalPages, 1);
    const [exibicao, setExibicao] = useState<Exibicao>(lerExibicao);

    //opções dos filtros, carregadas uma vez do cadastro
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [statusOptions, setStatusOptions] = useState<Status[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    //relê a mesma consulta (depois de uma troca na linha)
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        let ativo = true;
        Promise.all([fetchProjetos(1, 100), fetchStatus("tarefa"), fetchLabels(), fetchUsuarios()])
            .then(([paginaProjetos, listaStatus, listaLabels, listaUsuarios]) => {
                if (!ativo) return;
                setProjetos(paginaProjetos.data);
                setStatusOptions(listaStatus);
                setLabels(listaLabels);
                setUsuarios(listaUsuarios);
            })
            .catch((error) => toast.error(comMotivo("Erro ao buscar projetos, status, labels e usuários", error)));
        return () => { ativo = false };
    }, []);

    //no modo agrupado quem lê é a ListaAgrupada, um pedido por status (nenhum pedido sem idStatus)
    useEffect(() => {
        if (exibicao !== "tabela") return;
        let ativo = true;
        const { pagina: p, filtros } = lerConsultaDaUrl(new URLSearchParams(chaveDaUrl), CHAVES);
        fetchTarefas(p, filtros)
            .then((nova) => { if (ativo) setResposta(nova) })
            .catch((error) => toast.error(comMotivo("Erro ao buscar tarefas", error)));
        return () => { ativo = false };
    }, [chaveDaUrl, recarga, exibicao]);

    const irPara = (novaPagina: number, filtros: FiltrosTarefa) => setParams(consultaParaUrl(novaPagina, filtros), { replace: true });

    const mudarFiltro = (chave: keyof FiltrosTarefa, valor: string) => {
        const filtros = { ...consulta.filtros };
        if (valor === TODOS) delete filtros[chave];
        else filtros[chave] = Number(valor);
        irPara(1, filtros);
    }

    const trocarExibicao = (nova: Exibicao) => {
        setExibicao(nova);
        try {
            localStorage.setItem(CHAVE_EXIBICAO, nova);
        } catch {
            //sem localStorage: a escolha vale só até recarregar
        }
    }

    //troca de status/prioridade na linha: um campo por PATCH, e a lista relê (RF-44); sucesso sem aviso
    const trocarCampo = async (id: number, dados: DadosEdicaoTarefa) => {
        try {
            await updateTarefa(id, dados);
        } catch (error) {
            toast.error(comMotivo("Erro ao atualizar tarefa", error));
            return;
        }
        setRecarga((n) => n + 1);
    }

    const valorDe = (chave: keyof FiltrosTarefa) => String(consulta.filtros[chave] ?? TODOS);

    const filtro = (rotulo: string, chave: keyof FiltrosTarefa, opcoes: { id: number; nome: string }[]) => (
        <Select value={valorDe(chave)} onValueChange={(v) => mudarFiltro(chave, v)}>
            <SelectTrigger aria-label={`Filtrar por ${rotulo}`} className={estiloFiltro}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151A1E] border border-[#333B44] text-white">
                <SelectGroup>
                    <SelectItem className={estiloItem} value={TODOS}>{rotulo}: todos</SelectItem>
                    {opcoes.map((o) => (
                        <SelectItem className={estiloItem} key={o.id} value={String(o.id)}>{o.nome}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );

    const botaoExibicao = (valor: Exibicao, rotulo: string, icone: ReactNode) => (
        <button
            type="button"
            aria-pressed={exibicao === valor}
            onClick={() => trocarExibicao(valor)}
            className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[12.5px] font-medium transition-colors ${exibicao === valor ? "bg-[#1B1F23] text-[#E7E4DF]" : "text-[#7C8189] hover:text-[#E7E4DF]"}`}
        >
            {icone}{rotulo}
        </button>
    );

    return (
        <Layout>
            <div className="flex flex-row items-center gap-3">
                <h1 className="text-2xl font-bold text-white">Tarefas</h1>
                {exibicao === "tabela" && <p className="text-sm text-zinc-400 mt-1">{resposta.total} no total</p>}
                <div className="ml-auto flex items-center gap-0.5 rounded-md border border-[#1C1F23] bg-[#0E1012] p-0.5">
                    {botaoExibicao("agrupado", "Agrupado", <LayoutList aria-hidden="true" className="size-3.5" />)}
                    {botaoExibicao("tabela", "Tabela", <Table2 aria-hidden="true" className="size-3.5" />)}
                </div>
                <BotaoNovaTarefa />
            </div>

            <div className="mt-4 flex flex-row flex-wrap gap-2">
                {filtro("Projeto", "idProjeto", projetos)}
                {filtro("Status", "idStatus", statusOptions)}
                {filtro("Responsável", "idUsuarioResponsavel", usuarios)}
                {filtro("Label", "idLabel", labels)}
            </div>

            {exibicao === "agrupado" ? (
                <ListaAgrupada filtros={consulta.filtros} statusOptions={statusOptions} recarga={recarga} onTrocar={trocarCampo} />
            ) : (
                <ListaTarefas
                    tarefas={resposta.data}
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    onPagina={(p) => irPara(p, consulta.filtros)}
                    statusOptions={statusOptions}
                    onTrocar={trocarCampo}
                />
            )}
        </Layout>
    );
};

export default Tarefas;
