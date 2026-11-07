import DialogDetailsTarefa from "@/components/DialogDetailsTarefa";
import Layout from "@/components/Layout";
import ListaTarefas from "@/components/ListaTarefas";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { comMotivo } from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import { fetchProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { fetchStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchLabels } from "@/fetchs/fetchLabel";
import { fetchTarefas, updateTarefa, type DadosEdicaoTarefa, type FiltrosTarefa, type PaginaTarefas, type Tarefa } from "@/fetchs/fetchTarefas";
import type { Label } from "@/pages/labels";

const PAGINA_VAZIA: PaginaTarefas = { data: [], total: 0, page: 1, totalPages: 0 };
const TODOS = "todos";
const estiloFiltro = "w-44 h-9! rounded-md bg-[#151A1E] border-[#333B44] text-white";
const estiloItem = "text-gray-400 focus:bg-[#333B44] focus:text-white";

//filtros que o usuário mexe aqui; o `idUsuarioEnvolvido` é fixo e vem do token
type FiltroLivre = "idProjeto" | "idStatus" | "idLabel";

//tarefas em que o usuário logado é responsável ou criador (SPEC-007, RF-38)
const MinhasTarefas = () => {
    const { usuario } = useAuth();
    const idLogado = usuario?.id;

    const [consulta, setConsulta] = useState<{ pagina: number; filtros: Pick<FiltrosTarefa, FiltroLivre> }>({ pagina: 1, filtros: {} });
    const [resposta, setResposta] = useState<PaginaTarefas>(PAGINA_VAZIA);
    const pagina = resposta.page;
    const totalPaginas = Math.max(resposta.totalPages, 1);

    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [statusOptions, setStatusOptions] = useState<Status[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);

    const [openDetalhe, setOpenDetalhe] = useState(false);
    const [aberturaDetalhe, setAberturaDetalhe] = useState(0);
    const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
    const [recarga, setRecarga] = useState(0);

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
        fetchTarefas(consulta.pagina, { ...consulta.filtros, idUsuarioEnvolvido: idLogado })
            .then((nova) => { if (ativo) setResposta(nova) })
            .catch((error) => toast.error(comMotivo("Erro ao buscar tarefas", error)));
        return () => { ativo = false };
    }, [consulta, recarga, idLogado]);

    const mudarFiltro = (chave: FiltroLivre, valor: string) => {
        setConsulta((atual) => {
            const filtros = { ...atual.filtros };
            if (valor === TODOS) delete filtros[chave];
            else filtros[chave] = Number(valor);
            return { pagina: 1, filtros };
        });
    }

    const editarTarefa = async (id: number, dados: DadosEdicaoTarefa) => {
        try {
            await updateTarefa(id, dados);
        } catch (error) {
            toast.error(comMotivo("Erro ao editar tarefa", error));
            return false;
        }
        toast.success("Tarefa editada com sucesso!");
        setRecarga((n) => n + 1);
        return true;
    }

    const abrirDetalhe = (tarefa: Tarefa) => {
        setTarefaSelecionada(tarefa);
        setAberturaDetalhe((n) => n + 1);
        setOpenDetalhe(true);
    }

    const filtro = (rotulo: string, chave: FiltroLivre, opcoes: { id: number; nome: string }[]) => (
        <Select value={String(consulta.filtros[chave] ?? TODOS)} onValueChange={(v) => mudarFiltro(chave, v)}>
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

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-white">Minhas Tarefas</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2">{resposta.total} no total</p>
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
                onPagina={(p) => setConsulta((c) => ({ ...c, pagina: p }))}
                onAbrir={abrirDetalhe}
                vazio="Você não tem tarefas como responsável ou criador"
            />

            <DialogDetailsTarefa key={`detalhe-${aberturaDetalhe}`} open={openDetalhe} onOpenChange={setOpenDetalhe} tarefaSelecionada={tarefaSelecionada} onEditTarefa={editarTarefa} projetos={projetos} statusOptions={statusOptions} labels={labels} />
        </Layout>
    );
};

export default MinhasTarefas;
