import DialogNewTarefa from "@/components/DialogNewTarefa";
import DialogDetailsTarefa from "@/components/DialogDetailsTarefa";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ListaTarefas from "@/components/ListaTarefas";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/apiClient";
import { fetchProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { fetchStatus, type Status } from "@/fetchs/fetchStatus";
import { fetchLabels } from "@/fetchs/fetchLabel";
import { fetchUsuarios } from "@/fetchs/fetchUsuarios";
import { createTarefa, fetchTarefas, updateTarefa, type DadosEdicaoTarefa, type DadosNovaTarefa, type FiltrosTarefa, type PaginaTarefas, type Tarefa } from "@/fetchs/fetchTarefas";
import type { Label } from "@/pages/labels";
import type { Usuario } from "@/pages/usuarios";

const PAGINA_VAZIA: PaginaTarefas = { data: [], total: 0, page: 1, totalPages: 0 };
const TODOS = "todos";
const estiloFiltro = "w-44 h-9! rounded-md bg-[#151A1E] border-[#333B44] text-white";
const estiloItem = "text-gray-400 focus:bg-[#333B44] focus:text-white";

//mensagem da API quando ela manda texto; senão, só o texto fixo
const comMotivo = (texto: string, error: unknown) => {
    const motivo = error instanceof ApiError ? error.mensagemDaApi : undefined;
    return motivo ? `${texto}: ${motivo}` : texto;
}

const Tarefas = () => {

    //página atual e filtros juntos: mudar filtro volta à página 1 numa só consulta
    const [consulta, setConsulta] = useState<{ pagina: number; filtros: FiltrosTarefa }>({ pagina: 1, filtros: {} });
    const [resposta, setResposta] = useState<PaginaTarefas>(PAGINA_VAZIA);
    const pagina = resposta.page;
    const totalPaginas = Math.max(resposta.totalPages, 1);

    //opções dos filtros e dos dialogs, carregadas uma vez do cadastro
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [statusOptions, setStatusOptions] = useState<Status[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    //dialogs: a `key` nova a cada abertura faz o formulário nascer do zero (criar) ou da tarefa (editar)
    const [openNova, setOpenNova] = useState(false);
    const [aberturaNova, setAberturaNova] = useState(0);
    const [openDetalhe, setOpenDetalhe] = useState(false);
    const [aberturaDetalhe, setAberturaDetalhe] = useState(0);
    const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);

    //recarrega a mesma consulta (depois de editar)
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

    useEffect(() => {
        let ativo = true;
        fetchTarefas(consulta.pagina, consulta.filtros)
            .then((nova) => { if (ativo) setResposta(nova) })
            .catch((error) => toast.error(comMotivo("Erro ao buscar tarefas", error)));
        return () => { ativo = false };
    }, [consulta, recarga]);

    const mudarFiltro = (chave: keyof FiltrosTarefa, valor: string) => {
        setConsulta((atual) => {
            const filtros = { ...atual.filtros };
            if (valor === TODOS) delete filtros[chave];
            else filtros[chave] = Number(valor);
            return { pagina: 1, filtros };
        });
    }

    //a API ordena por id: a tarefa nova é a última, então limpa os filtros e vai para a última página
    const criarTarefa = async (dados: DadosNovaTarefa) => {
        try {
            await createTarefa(dados);
        } catch (error) {
            toast.error(comMotivo("Erro ao criar tarefa", error));
            return false;
        }
        toast.success("Tarefa criada com sucesso!");
        try {
            const primeira = await fetchTarefas(1, {});
            setConsulta({ pagina: Math.max(primeira.totalPages, 1), filtros: {} });
        } catch {
            setConsulta({ pagina: 1, filtros: {} });
        }
        return true;
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

    const abrirNova = () => {
        setAberturaNova((n) => n + 1);
        setOpenNova(true);
    }

    const abrirDetalhe = (tarefa: Tarefa) => {
        setTarefaSelecionada(tarefa);
        setAberturaDetalhe((n) => n + 1);
        setOpenDetalhe(true);
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

    const opcoesDosDialogs = { projetos, statusOptions, labels };

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-white">Tarefas</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2">{resposta.total} no total</p>
                <Button variant="destructive" className="ml-auto" onClick={abrirNova}>
                    Nova Tarefa
                </Button>
            </div>

            <div className="mt-4 flex flex-row flex-wrap gap-2">
                {filtro("Projeto", "idProjeto", projetos)}
                {filtro("Status", "idStatus", statusOptions)}
                {filtro("Responsável", "idUsuarioResponsavel", usuarios)}
                {filtro("Label", "idLabel", labels)}
            </div>

            <ListaTarefas
                tarefas={resposta.data}
                pagina={pagina}
                totalPaginas={totalPaginas}
                onPagina={(p) => setConsulta((c) => ({ ...c, pagina: p }))}
                onAbrir={abrirDetalhe}
            />

            <DialogNewTarefa key={`nova-${aberturaNova}`} open={openNova} onOpenChange={setOpenNova} onCreateTarefa={criarTarefa} {...opcoesDosDialogs} />
            <DialogDetailsTarefa key={`detalhe-${aberturaDetalhe}`} open={openDetalhe} onOpenChange={setOpenDetalhe} tarefaSelecionada={tarefaSelecionada} onEditTarefa={editarTarefa} {...opcoesDosDialogs} />
        </Layout>
    );
};

export default Tarefas;
