import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useAuth } from "@/context/AuthContext";
import { ChevronRight, LogOutIcon } from "lucide-react";

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

//cada tela monta o próprio Layout: a escolha de abrir/recolher Cadastros fica aqui enquanto a aba estiver aberta
let cadastrosAberto = true;

const classeItem = ({ isActive }: { isActive: boolean }) =>
    `flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium transition-colors ${isActive ? "bg-[#171A1E] text-[#E7E4DF]" : "text-[#8A9098] hover:bg-[#131619] hover:text-[#E7E4DF]"}`;

const Item = ({ to, rotulo, glifo, end }: ItemMenu) => (
    <NavLink to={to} end={end} className={classeItem}>
        <span aria-hidden="true" className="w-4 text-center text-[13px] text-[#61666C]">{glifo}</span>
        {rotulo}
    </NavLink>
);

export default function Sidebar() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

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

    return (
        <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[#1C1F23] bg-[#0E1012] p-3 text-white">
            <Link to="/" className="mb-6 flex items-center gap-2 rounded-md px-2.5 py-2 text-zinc-400 hover:text-white">
                <span className="font-heading text-[17px] font-bold tracking-[-.02em] text-[#E7E4DF]">Taskflow</span>
                <span className="text-[12px] text-[#61666C]">Dragão vermelho</span>
            </Link>

            <nav aria-label="Menu principal" className="flex h-full flex-col gap-0.5">
                {SOLTOS.map((item) => <Item key={item.to} {...item} />)}

                <Collapsible open={aberto} onOpenChange={alternar} className="mt-4">
                    <CollapsibleTrigger className="flex h-7 w-full items-center gap-1.5 rounded-md px-2.5 font-mono text-[11px] font-medium uppercase tracking-[.12em] text-[#61666C] hover:text-[#A9AEB4]">
                        Cadastros
                        <ChevronRight aria-hidden="true" className={`size-3.5 transition-transform ${aberto ? "rotate-90" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-0.5 flex flex-col gap-0.5">
                        {CADASTROS.map((item) => <Item key={item.to} {...item} />)}
                    </CollapsibleContent>
                </Collapsible>

                <Button variant="link" onClick={handleLogout} className="mt-auto justify-start gap-3 text-red-400 hover:text-red-300">
                    <LogOutIcon size={18} className="shrink-0" />
                    <span className="text-sm font-medium">Sair</span>
                </Button>
            </nav>
        </aside>
    );
}
