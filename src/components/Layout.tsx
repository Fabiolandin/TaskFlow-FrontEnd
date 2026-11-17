import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MenuIcon } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DialogNewTarefa, { type OpcoesTarefa } from "@/components/DialogNewTarefa";
import BuscaRapida from "@/components/BuscaRapida";
import { comMotivo } from "@/api/apiClient";
import { avisarTarefaCriada, CriarTarefaContext, type InicioCriarTarefa } from "@/context/CriarTarefaContext";
import { createTarefa, type CamposTarefa, type DadosNovaTarefa } from "@/fetchs/fetchTarefas";
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
    //campos que a abertura deixa preenchidos (RF-61); o resto nasce vazio
    const [inicial, setInicial] = useState<Partial<CamposTarefa>>({});
    const [tarefaPai, setTarefaPai] = useState<InicioCriarTarefa["tarefaPai"]>(undefined);
    const [buscaAberta, setBuscaAberta] = useState(false);
    //gaveta do menu no celular; cada tela monta o próprio Layout, então trocar de rota já fecha
    const [menuAberto, setMenuAberto] = useState(false);
    const refAbrirMenu = useRef<HTMLButtonElement>(null);
    const fecharMenu = () => {
        setMenuAberto(false);
        refAbrirMenu.current?.focus();
    };
    const [aberturaBusca, setAberturaBusca] = useState(0);

    const abrirCriar = (inicio?: InicioCriarTarefa) => {
        setAberturaCriar((n) => n + 1);
        setInicial(inicio?.idProjeto ? { idProjeto: String(inicio.idProjeto) } : {});
        setTarefaPai(inicio?.tarefaPai);
        setOpcoes(OPCOES_VAZIAS);
        setCriarAberto(true);
        Promise.all([fetchProjetos(1, 100), fetchStatus("tarefa"), fetchLabels()])
            .then(([paginaProjetos, statusOptions, labels]) => setOpcoes({ projetos: paginaProjetos.data, statusOptions, labels }))
            .catch((error) => toast.error(comMotivo("Erro ao buscar projetos, status e labels", error)));
    }

    //criada, a tela não muda: aviso com a ação Abrir e a tela atual relê (RF-34); a falha mantém o dialog aberto com a mensagem da API
    const criarTarefa = async (dados: DadosNovaTarefa) => {
        try {
            const nova = await createTarefa(tarefaPai ? { ...dados, idTarefaPai: tarefaPai.id } : dados);
            toast.success("Tarefa criada", {
                description: nova.nome,
                action: { label: "Abrir", onClick: () => navigate(`/tarefas/${nova.id}`) },
            });
            avisarTarefaCriada(nova.id);
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
            <div className="flex h-dvh overflow-hidden bg-fundo">
                {/* desktop e tablet: menu fixo ao lado; celular: gaveta aberta pelo botão da barra do topo */}
                <div className="hidden md:flex"><Sidebar /></div>
                {menuAberto && (
                    //Esc fecha; o foco entra na gaveta ao abrir (vai para o primeiro link do menu) e volta ao botão ao fechar
                    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-40 flex md:hidden"
                        ref={(el) => { if (el && !el.contains(document.activeElement)) el.querySelector<HTMLElement>("nav a")?.focus(); }}
                        onKeyDown={(e) => { if (e.key === "Escape") fecharMenu(); }}>
                        <Sidebar gaveta onFechar={fecharMenu} />
                        <button type="button" aria-label="Fechar menu" className="flex-1 bg-black/50" onClick={fecharMenu} />
                    </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                    <header data-barra-movel className="flex h-12 shrink-0 items-center gap-2 border-b border-borda bg-superficie px-3 md:hidden">
                        <button ref={refAbrirMenu} type="button" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}
                            className="flex size-9 items-center justify-center rounded-md text-texto-fraco hover:bg-hover hover:text-texto">
                            <MenuIcon aria-hidden="true" className="size-5" />
                        </button>
                        <span className="font-heading text-[16px] font-bold text-texto">Taskflow</span>
                    </header>
                    <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
            <DialogNewTarefa key={`criar-${aberturaCriar}`} open={criarAberto} onOpenChange={setCriarAberto} onCreateTarefa={criarTarefa} inicial={inicial}
                titulo={tarefaPai ? `Nova sub-tarefa de ${tarefaPai.nome}` : undefined} projetoFixo={!!tarefaPai} {...opcoes} />
            <BuscaRapida key={`busca-${aberturaBusca}`} open={buscaAberta} onOpenChange={setBuscaAberta} />
        </CriarTarefaContext.Provider>
    );
}
