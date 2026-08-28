import { Home, Users, PlusIcon, Package, Truck, ShoppingCart, Package2Icon, LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export default function Sidebar() {
    return (
        <aside
            className="bg-[#0E1012] text-white transition-all duration-300 h-screen flex flex-col w-64 p-4"
        >

                <Button asChild variant="link" className="text-zinc-400 hover:text-white justify-start w-full gap-3 mb-8">
                    <Link to="/" className="flex items-center">
                        <p className="text-sm font-medium">Taskflow</p>
                        <p>Dragão vermelho</p>
                    </Link>
                </Button>


                <nav className="flex flex-col gap-2 h-full">
                    <Button asChild variant="link" className="text-zinc-400 hover:text-white justify-start w-full gap-3">
                        <Link to="/" className="flex items-center">
                            <span className="text-sm font-medium">愛 Painel</span>
                        </Link>
                    </Button>

                    <Button asChild variant="link" className="text-zinc-400 hover:text-white justify-start w-full gap-3">
                        <Link to="/minhas-tarefas" className="flex items-center">
                            <span className="text-sm font-medium">友 Minhas Tarefas</span>
                        </Link>
                    </Button>

                    <Button asChild variant="link" className="text-zinc-400 hover:text-white justify-start w-full gap-3">
                        <Link to="/projetos" className="flex items-center">
                            <span className="text-sm font-medium">家 Projetos</span>
                        </Link>
                    </Button>

                    <Button asChild variant="link" className="text-zinc-400 hover:text-white justify-start w-full gap-3">
                        <Link to="/labels" className="flex items-center">
                            <span className="text-sm font-medium">学 Labels</span>
                        </Link>
                    </Button>

                    <Button asChild variant="link" className="text-zinc-400 hover:text-white justify-start w-full gap-3">
                        <Link to="/usuarios" className="flex items-center">
                            <span className="text-sm font-medium">夢 Usuários</span>
                        </Link>
                    </Button>

                    {/* <Button variant="link" onClick={handleLogout} className="mt-auto text-red-400 hover:text-red-300 justify-start w-full gap-3">
                    <LogOutIcon size={20} className="shrink-0" />
                    <span className="text-sm font-medium">Sair</span>
                </Button> */}

                </nav>
        </aside>
    );
}
