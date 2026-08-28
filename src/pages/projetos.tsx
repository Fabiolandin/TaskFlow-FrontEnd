import DialogNewProjeto from "@/components/DialogNewProjeto";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ProjetosMock, { type Projeto } from "@/projetos";

const Projetos = () => {

    //States para o dialog
    const [open, setOpen] = useState(false);

    //state para receber lista de projetos dados mockados
    const [projetos, setProjetos] = useState<Projeto[]>(ProjetosMock);

    return (
        <Layout>
            <div className="flex flex-row">
            <h1 className="text-2xl font-bold text-white">Projetos</h1>
            <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                Novo Projeto
            </Button>
            </div>
            <div className="mt-4 p-4 grid grid-cols-3 gap-4">
            {projetos.map((projeto) => (
                <div key={projeto.id} className="p-4 bg-[#0E1012] rounded-lg h-45 flex flex-col justify-between">
                    <div className="flex flex-row items-center justify-between mb-2"> 

                    <h2 className="text-xl font-bold text-white">{projeto.nome}</h2>
                    <p className="text-sm text-gray-300">{projeto.status}</p>
                    </div>

                    <p className="text-zinc-400 text-sm">{projeto.descricao}</p>
                    <hr className="border-gray-600" />
                    <div className="flex flex-row items-center gap-2">
                    <p className="text-sm text-zinc-400">Inicio: {projeto.inicio}</p>
                        </div>

                </div>
            ))}
            </div>


            <DialogNewProjeto open={open} onOpenChange={setOpen} />
        </Layout>
    );
};

export default Projetos;
