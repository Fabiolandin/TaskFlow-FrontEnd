import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import DialogNewTarefa, { type OpcoesTarefa } from "@/components/DialogNewTarefa";
import BuscaRapida from "@/components/BuscaRapida";
import { comMotivo } from "@/api/apiClient";
import { CriarTarefaContext } from "@/context/CriarTarefaContext";
import { createTarefa, type DadosNovaTarefa } from "@/fetchs/fetchTarefas";
import { fetchProjetos } from "@/fetchs/fetchProjetos";
import { fetchStatus } from "@/fetchs/fetchStatus";
import { fetchLabels } from "@/fetchs/fetchLabel";

interface LayoutProps {
    children: ReactNode;
}

const OPCOES_VAZIAS: OpcoesTarefa = { projetos: [], statusOptions: [], labels: [] };

//foco num campo de texto: a letra é do campo, não atalho
const emCampo = (alvo: EventTarget | null) =>
    alvo instanceof HTMLElement && (alvo.isContentEditable || !!alvo.closest("input, textarea, select, [contenteditable]:not([contenteditable=false])"));

//algum dialog, menu ou lista de select aberto (inclusive a busca rápida): o C não abre nada
const algoAberto = () => !!document.querySelector("[role=dialog], [role=alertdialog], [role=menu], [role=listbox]");

//C (RF-57): sem Ctrl/Alt/Meta, sem repetição, sem composição, fora de campo e com nada aberto
const ehAtalhoCriar = (e: KeyboardEvent) =>
    (e.key === "c" || e.key === "C") && !e.ctrlKey && !e.altKey && !e.metaKey && !e.repeat
    && !e.isComposing && e.keyCode !== 229 && !e.defaultPrevented && !emCampo(e.target) && !algoAberto();

//Ctrl+K / Cmd+K (RF-58): vale também dentro de campo; o navegador não abre a busca dele
const ehAtalhoBusca = (e: KeyboardEvent) => (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "k" || e.key === "K");

//Layout de toda rota logada (o /login não usa): menu, atalhos C e Ctrl+K, o dialog único de criar tarefa e a busca
export default function Layout({ children }: LayoutProps) {
    const navigate = useNavigate();

    //dialog de criar: `key` nova a cada abertura faz o formulário nascer vazio; as opções são lidas ao abrir (D-13)
    const [criarAberto, setCriarAberto] = useState(false);
    const [aberturaCriar, setAberturaCriar] = useState(0);
    const [opcoes, setOpcoes] = useState<OpcoesTarefa>(OPCOES_VAZIAS);
    const [buscaAberta, setBuscaAberta] = useState(false);
    const [aberturaBusca, setAberturaBusca] = useState(0);

    const abrirCriar = () => {
        setAberturaCriar((n) => n + 1);
        setOpcoes(OPCOES_VAZIAS);
        setCriarAberto(true);
        Promise.all([fetchProjetos(1, 100), fetchStatus("tarefa"), fetchLabels()])
            .then(([paginaProjetos, statusOptions, labels]) => setOpcoes({ projetos: paginaProjetos.data, statusOptions, labels }))
            .catch((error) => toast.error(comMotivo("Erro ao buscar projetos, status e labels", error)));
    }

    //criada, vai para a página da tarefa nova; a falha mantém o dialog aberto com a mensagem da API (RF-34)
    const criarTarefa = async (dados: DadosNovaTarefa) => {
        try {
            const nova = await createTarefa(dados);
            toast.success("Tarefa criada com sucesso!");
            navigate(`/tarefas/${nova.id}`);
            return true;
        } catch (error) {
            toast.error(comMotivo("Erro ao criar tarefa", error));
            return false;
        }
    }

    const abrirBusca = () => {
        if (buscaAberta) return;
        setAberturaBusca((n) => n + 1);
        setBuscaAberta(true);
    }

    //o efeito registra a versão atual dos handlers a cada render (eles leem o estado de agora)
    useEffect(() => {
        const aoTeclar = (e: KeyboardEvent) => {
            if (ehAtalhoBusca(e)) {
                e.preventDefault();
                abrirBusca();
            } else if (ehAtalhoCriar(e)) {
                e.preventDefault();
                abrirCriar();
            }
        };
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    });

    return (
        <CriarTarefaContext.Provider value={abrirCriar}>
            <div className="flex h-screen overflow-hidden bg-[#0B0C0E]">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
            <DialogNewTarefa key={`criar-${aberturaCriar}`} open={criarAberto} onOpenChange={setCriarAberto} onCreateTarefa={criarTarefa} {...opcoes} />
            <BuscaRapida key={`busca-${aberturaBusca}`} open={buscaAberta} onOpenChange={setBuscaAberta} />
        </CriarTarefaContext.Provider>
    );
}
