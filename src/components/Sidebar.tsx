import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import Avatar from "./Avatar";
import { fetchUsuario } from "@/fetchs/fetchUsuarios";
import { resolverTema, TEMAS, useTema } from "@/utils/tema";
import { useAuth } from "@/context/AuthContext";
import { PREF_MENU_RECOLHIDO, usePreferencia } from "@/utils/preferencias";
import { CheckIcon, ChevronRight, LogOutIcon, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";

interface ItemMenu {
    to: string;
    rotulo: string;
    glifo: string;
    //"/" só fica ativo na própria rota
    end?: boolean;
}

//ordem do menu (RF-42): itens soltos e o grupo Cadastros
const SOLTOS: ItemMenu[] = [
    { to: "/", rotulo: "Painel", glifo: "愛", end: true },
    { to: "/minhas-tarefas", rotulo: "Minhas Tarefas", glifo: "友" },
    { to: "/tarefas", rotulo: "Tarefas", glifo: "仕" },
    { to: "/projetos", rotulo: "Projetos", glifo: "家" },
];
const CADASTROS: ItemMenu[] = [
    { to: "/labels", rotulo: "Labels", glifo: "学" },
    { to: "/status/tarefa", rotulo: "Status de tarefa", glifo: "道" },
    { to: "/status/projeto", rotulo: "Status de projeto", glifo: "路" },
    { to: "/usuarios", rotulo: "Usuários", glifo: "夢" },
];
const GLIFO_CADASTROS = "録";

//cada tela monta o próprio Layout: a escolha de abrir/recolher Cadastros fica aqui enquanto a aba estiver aberta
let cadastrosAberto = true;
//nome e email do logado, lidos uma vez por id (cada tela monta o próprio menu)
const cacheUsuario = new Map<number, { id: number; nome: string; email: string }>();

const base = "flex h-9 items-center rounded-controle text-[13.5px] font-medium transition-colors";
const cores = (ativo: boolean) => (ativo ? "bg-ativo text-texto" : "text-texto-fraco hover:bg-hover hover:text-texto");
const classeGlifo = "w-4 shrink-0 text-center text-[13px] text-texto-mudo";
//glifo do item ativo na cor de destaque da marca (RF-73)
const classeGlifoAtivo = (ativo: boolean) => `w-4 shrink-0 text-center text-[13px] ${ativo ? "text-marca-destaque" : "text-texto-mudo"}`;
const botaoRodape = "flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-borda-forte text-texto-fraco outline-none hover:bg-hover hover:text-texto focus-visible:ring-2 focus-visible:ring-foco data-[state=open]:bg-hover";

//peça de mahjong com o 中 (RF-73); no trilho, menor
const Peca = ({ pequena }: { pequena?: boolean }) => (
    <span aria-hidden="true" data-peca
        className={`flex shrink-0 items-center justify-center border border-peca-borda font-heading font-bold leading-none text-marca ${pequena ? "h-9 w-[27px] rounded-[5px] text-[19px]" : "h-[50px] w-[38px] rounded-[6px] text-[26px]"}`}
        style={{ background: "linear-gradient(170deg, var(--tf-peca-1), var(--tf-peca-2))", boxShadow: "0 3px 0 var(--tf-peca-sombra), 0 6px 14px rgba(0, 0, 0, .5)" }}>
        中
    </span>
);

const Item = ({ to, rotulo, glifo, end, recolhido, recuado }: ItemMenu & { recolhido: boolean; recuado?: boolean }) => (
    <NavLink to={to} end={end} aria-label={recolhido ? rotulo : undefined} title={recolhido ? rotulo : undefined}
        className={({ isActive }) => `${base} ${cores(isActive)} ${recolhido ? "w-8 justify-center" : `gap-2.5 px-2.5 ${recuado ? "pl-7" : ""}`}`}>
        {({ isActive }) => (
            <>
                <span aria-hidden="true" className={classeGlifoAtivo(isActive)}>{glifo}</span>
                {!recolhido && rotulo}
            </>
        )}
    </NavLink>
);

export default function Sidebar() {
    const { logout, usuario } = useAuth();
    const [tema, mudarTema] = useTema();
    const idLogado = usuario?.id;
    const [eu, setEu] = useState(() => (idLogado ? cacheUsuario.get(idLogado) ?? null : null));
    //sem nome e email (falha na leitura), o cartão mostra só o botão Sair (RF-73)
    useEffect(() => {
        if (!idLogado || cacheUsuario.has(idLogado)) return;
        let ativo = true;
        fetchUsuario(idLogado)
            .then((u) => { cacheUsuario.set(idLogado, u); if (ativo) setEu(u); })
            .catch(() => { /* o cartão fica só com o Sair */ });
        return () => { ativo = false };
    }, [idLogado]);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [recolhido, setRecolhido] = usePreferencia(PREF_MENU_RECOLHIDO, false);

    //numa rota do grupo, ele aparece aberto
    const naRotaDoGrupo = CADASTROS.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`));
    const [aberto, setAberto] = useState(naRotaDoGrupo || cadastrosAberto);
    const alternar = (valor: boolean) => {
        cadastrosAberto = valor;
        setAberto(valor);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const botaoRecolher = (
        <button type="button" onClick={() => setRecolhido(!recolhido)}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"} title={recolhido ? "Expandir menu" : "Recolher menu"}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-texto-mudo hover:bg-hover hover:text-texto">
            {recolhido ? <PanelLeftOpen aria-hidden="true" className="size-4" /> : <PanelLeftClose aria-hidden="true" className="size-4" />}
        </button>
    );

    return (
        <aside data-menu={recolhido ? "recolhido" : "expandido"}
            className={`flex h-screen shrink-0 flex-col border-r border-borda bg-superficie py-4 text-texto transition-[width] ${recolhido ? "w-14 items-center px-2" : "w-60 px-3"}`}>
            {recolhido ? (
                <div className="mb-6 flex flex-col items-center gap-3">
                    <Link to="/" aria-label="Taskflow, Painel" title="Taskflow"><Peca pequena /></Link>
                    {botaoRecolher}
                </div>
            ) : (
                <div className="mb-6 flex items-center gap-1 pl-1 pt-1">
                    <Link to="/" className="flex min-w-0 items-center gap-[11px] rounded-controle outline-none focus-visible:ring-2 focus-visible:ring-foco">
                        <Peca />
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="font-heading text-[19px] font-bold tracking-[-.02em] text-texto">Taskflow</span>
                            <span className="truncate font-mono text-[10px] uppercase tracking-[.14em] text-texto-mudo">Dragão vermelho</span>
                        </span>
                    </Link>
                    <span className="ml-auto self-start">{botaoRecolher}</span>
                </div>
            )}

            <nav aria-label="Menu principal" className={`flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto ${recolhido ? "items-center" : ""}`}>
                {SOLTOS.map((item) => <Item key={item.to} {...item} recolhido={recolhido} />)}

                {recolhido ? (
                    //no trilho, Cadastros é um glifo que abre os 4 itens num menu suspenso (RF-59)
                    <DropdownMenu>
                        <DropdownMenuTrigger aria-label="Cadastros" title="Cadastros"
                            className={`${base} ${cores(naRotaDoGrupo)} mt-4 w-8 justify-center outline-none`}>
                            <span aria-hidden="true" className={classeGlifo}>{GLIFO_CADASTROS}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                            {CADASTROS.map((c) => (
                                <DropdownMenuItem key={c.to} asChild>
                                    <Link to={c.to}>
                                        <span aria-hidden="true" className={classeGlifo}>{c.glifo}</span>{c.rotulo}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    //Cadastros com a forma dos itens soltos: glifo à frente e seta (RF-42)
                    <Collapsible open={aberto} onOpenChange={alternar} className="mt-0.5">
                        <CollapsibleTrigger data-cadastros className={`${base} ${cores(false)} w-full gap-2.5 px-2.5`}>
                            <span aria-hidden="true" className={classeGlifo}>{GLIFO_CADASTROS}</span>
                            Cadastros
                            <ChevronRight aria-hidden="true" className={`ml-auto size-3.5 text-texto-mudo transition-transform ${aberto ? "rotate-90" : ""}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-0.5 flex flex-col gap-0.5">
                            {CADASTROS.map((item) => <Item key={item.to} {...item} recolhido={false} recuado />)}
                        </CollapsibleContent>
                    </Collapsible>
                )}

            </nav>

            {/* rodapé: usuário logado, tema e sair (RF-73, RF-69) */}
            <div data-rodape-menu className={`mt-3 flex items-center gap-2.5 ${recolhido ? "flex-col" : "rounded-cartao border border-borda bg-hover p-2.5"}`}>
                {eu && <Avatar usuario={eu} tamanho={30} quadrado />}
                {eu && !recolhido && (
                    <span className="flex min-w-0 flex-col">
                        <span data-usuario-nome className="truncate text-[12.5px] font-medium text-texto">{eu.nome}</span>
                        <span data-usuario-email className="truncate text-[10.5px] text-texto-mudo">{eu.email}</span>
                    </span>
                )}
                <span className={`flex gap-1.5 ${recolhido ? "flex-col" : "ml-auto"}`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger aria-label="Tema" title="Tema" className={botaoRodape}>
                            {resolverTema(tema) === "claro" ? <Sun aria-hidden="true" className="size-3.5" /> : <Moon aria-hidden="true" className="size-3.5" />}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side={recolhido ? "right" : "top"} align="end">
                            {TEMAS.map((t) => (
                                <DropdownMenuItem key={t.valor} data-tema={t.valor} onSelect={() => mudarTema(t.valor)}>
                                    {t.rotulo}
                                    {t.valor === tema && <CheckIcon aria-hidden="true" className="ml-auto size-4 text-texto-fraco" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button type="button" onClick={handleLogout} aria-label="Sair" title="Sair" className={botaoRodape}>
                        <LogOutIcon aria-hidden="true" className="size-3.5" />
                    </button>
                </span>
            </div>
        </aside>
    );
}
