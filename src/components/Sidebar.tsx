import { useState } from "react";
import { Home, Users, Menu, X, PlusIcon, Package, Truck, ShoppingCart, Package2Icon, LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export default function Sidebar() {
    const [open, setOpen] = useState(false);

    return (
        <aside
            className={`bg-[#0E1012] text-white transition-all duration-300 h-screen flex flex-col ${open ? "w-64" : "w-20"
                } p-4`}
        >
            {/* Toggle */}
            <button
                onClick={() => setOpen(!open)}
                className="mb-6 flex items-center justify-center w-full"
            >
                {open ? <X /> : <Menu />}
            </button>
            <nav className="flex flex-col gap-2 h-full">
                <Button asChild variant="link" className={`text-zinc-400 hover:text-white justify-start w-full gap-3 ${!open ? "px-2 justify-center" : ""}`}>
                    <Link to="/" className="flex items-center">
                        <Home size={20} className="shrink-0" />
                        {open && <span className="text-sm font-medium">Painel</span>}
                    </Link>
                </Button>

                <Button asChild variant="link" className={`text-zinc-400 hover:text-white justify-start w-full gap-3 ${!open ? "px-2 justify-center" : ""}`}>
                    <Link to="/minhas-tarefas" className="flex items-center">
                        <PlusIcon size={20} className="shrink-0" />
                        {open && <span className="text-sm font-medium">Minhas Tarefas</span>}
                    </Link>
                </Button>

                <Button asChild variant="link" className={`text-zinc-400 hover:text-white justify-start w-full gap-3 ${!open ? "px-2 justify-center" : ""}`}>
                    <Link to="/labels" className="flex items-center">
                        <Package size={20} className="shrink-0" />
                        {open && <span className="text-sm font-medium">Labels</span>}
                    </Link>
                </Button>

                <Button asChild variant="link" className={`text-zinc-400 hover:text-white justify-start w-full gap-3 ${!open ? "px-2 justify-center" : ""}`}>
                    <Link to="/usuarios" className="flex items-center">
                        <Users size={20} className="shrink-0" />
                        {open && <span className="text-sm font-medium">Usuários</span>}
                    </Link>
                </Button>

                {/* <Button variant="link" onClick={handleLogout} className={`mt-auto text-red-400 hover:text-red-300 justify-start w-full gap-3 ${!open ? "px-2 justify-center" : ""}`}>
                    <LogOutIcon size={20} className="shrink-0" />
                    {open && <span className="text-sm font-medium">Sair</span>}
                </Button> */}

            </nav>
        </aside>
    );
}
