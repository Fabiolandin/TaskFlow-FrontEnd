import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { PREF_MENU_RECOLHIDO, usePreferencia } from "@/utils/preferencias";
import { ChevronRight, LogOutIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";

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

const base = "flex h-8 items-center rounded-md text-[13.5px] font-medium transition-colors";
const cores = (ativo: boolean) => (ativo ? "bg-[#171A1E] text-[#E7E4DF]" : "text-[#8A9098] hover:bg-[#131619] hover:text-[#E7E4DF]");
const classeGlifo = "w-4 shrink-0 text-center text-[13px] text-[#61666C]";

const Item = ({ to, rotulo, glifo, end, recolhido, recuado }: ItemMenu & { recolhido: boolean; recuado?: boolean }) => (
    <NavLink to={to} end={end} aria-label={recolhido ? rotulo : undefined} title={recolhido ? rotulo : undefined}
        className={({ isActive }) => `${base} ${cores(isActive)} ${recolhido ? "w-8 justify-center" : `gap-2.5 px-2.5 ${recuado ? "pl-7" : ""}`}`}>
        <span aria-hidden="true" className={classeGlifo}>{glifo}</span>
        {!recolhido && rotulo}
    </NavLink>
);

export default function Sidebar() {
    const { logout } = useAuth();
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
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#61666C] hover:bg-[#131619] hover:text-[#E7E4DF]">
            {recolhido ? <PanelLeftOpen aria-hidden="true" className="size-4" /> : <PanelLeftClose aria-hidden="true" className="size-4" />}
        </button>
    );

    return (
        <aside data-menu={recolhido ? "recolhido" : "expandido"}
            className={`flex h-screen shrink-0 flex-col border-r border-[#1C1F23] bg-[#0E1012] py-3 text-white transition-[width] ${recolhido ? "w-14 items-center px-2" : "w-60 px-3"}`}>
            {recolhido ? (
                <div className="mb-6 flex flex-col items-center gap-2">{botaoRecolher}</div>
            ) : (
                <div className="mb-6 flex items-center gap-1">
                    <Link to="/" className="flex min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-zinc-400 hover:text-white">
                        <span className="font-heading text-[17px] font-bold tracking-[-.02em] text-[#E7E4DF]">Taskflow</span>
                        <span className="truncate text-[12px] text-[#61666C]">Dragão vermelho</span>
                    </Link>
                    <span className="ml-auto">{botaoRecolher}</span>
                </div>
            )}

            <nav aria-label="Menu principal" className={`flex h-full flex-col gap-0.5 ${recolhido ? "items-center" : ""}`}>
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
                            <ChevronRight aria-hidden="true" className={`ml-auto size-3.5 text-[#61666C] transition-transform ${aberto ? "rotate-90" : ""}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-0.5 flex flex-col gap-0.5">
                            {CADASTROS.map((item) => <Item key={item.to} {...item} recolhido={false} recuado />)}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                <Button variant="link" onClick={handleLogout} aria-label={recolhido ? "Sair" : undefined} title={recolhido ? "Sair" : undefined}
                    className={`mt-auto gap-3 text-red-400 hover:text-red-300 ${recolhido ? "justify-center px-0" : "justify-start"}`}>
                    <LogOutIcon size={18} className="shrink-0" />
                    {!recolhido && <span className="text-sm font-medium">Sair</span>}
                </Button>
            </nav>
        </aside>
    );
}
