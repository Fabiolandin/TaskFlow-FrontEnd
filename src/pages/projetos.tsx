import DialogNewProjeto from "@/components/DialogNewProjeto";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Projetos = () => {

    //States para o dialog
    const [open, setOpen] = useState(false);

    return (
        <Layout>
            <div className="flex flex-row">
            <h1 className="text-2xl font-bold text-white">Projetos</h1>
            <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                Novo Projeto
            </Button>
            </div>


            <DialogNewProjeto open={open} onOpenChange={setOpen} />
        </Layout>
    );
};

export default Projetos;
