import DialogNewProjeto from "@/components/DialogNewProjeto";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createProjeto, fetchProjetos, LIMITE_PROJETOS, type DadosProjeto, type PaginaProjetos } from "@/fetchs/fetchProjetos";
import { addMembros } from "@/fetchs/fetchMembros";
import { formatarDia } from "@/utils/formaters/fdata";

const PAGINA_VAZIA: PaginaProjetos = { data: [], total: 0, page: 1, totalPages: 0 };

const Projetos = () => {

    //States para o dialog
    const [open, setOpen] = useState(false);

    //página atual vinda da API: { data, total, page, totalPages }
    const [resposta, setResposta] = useState<PaginaProjetos>(PAGINA_VAZIA);
    const pagina = resposta.page;
    const totalPaginas = Math.max(resposta.totalPages, 1);

    const getDados = async (page: number) => {
        try {
            setResposta(await fetchProjetos(page));
        } catch {
            toast.error("Erro ao buscar projetos");
        }
    }

    //grava o projeto e depois os membros; devolve se o projeto foi gravado (o dialog fecha só nesse caso)
    const criarProjeto = async (dados: DadosProjeto, idsMembros: number[]) => {
        let idProjeto: number;
        try {
            idProjeto = (await createProjeto(dados)).id;
        } catch {
            toast.error("Erro ao criar projeto");
            return false;
        }

        //o projeto já existe: membro recusado vira aviso, não impede fechar (repetir criaria outro projeto)
        const naoAdicionados = await addMembros(idProjeto, idsMembros);
        if (naoAdicionados.length) {
            toast.error(`Projeto criado, mas ${naoAdicionados.length} membro(s) não foram adicionados: ${naoAdicionados[0].mensagem}`);
        } else {
            toast.success("Projeto criado com sucesso!");
        }

        //o projeto novo é o último (a API ordena por id): vai para a última página
        await getDados(Math.ceil((resposta.total + 1) / LIMITE_PROJETOS));
        return true;
    }

    useEffect(() => {
        let ativo = true;
        fetchProjetos(1)
            .then((primeira) => { if (ativo) setResposta(primeira) })
            .catch(() => toast.error("Erro ao buscar projetos"));
        return () => { ativo = false };
    }, []);

    return (
        <Layout>
            <div className="flex flex-row">
                <h1 className="text-2xl font-bold text-white">Projetos</h1>
                <p className="text-sm text-zinc-400 mt-2 ml-2">{resposta.total} no total</p>
                <Button variant="destructive" className="ml-auto" onClick={() => setOpen(true)}>
                    Novo Projeto
                </Button>
            </div>
            <div className="mt-4 p-4 grid grid-cols-3 gap-4">
                {resposta.data.map((projeto) => (
                    <article key={projeto.id} className="p-4 bg-[#0E1012] rounded-lg min-h-45 flex flex-col justify-between gap-2">
                        <div className="flex flex-row items-center justify-between mb-2">

                            <h2 className="text-xl font-bold text-white">{projeto.nome}</h2>
                            <p className="text-sm text-gray-300 flex items-center gap-1">
                                {projeto.status.cor && <span className="inline-block size-2 rounded-full" style={{ backgroundColor: projeto.status.cor }} />}
                                {projeto.status.nome}
                            </p>
                        </div>

                        <p className="text-zinc-400 text-sm">{projeto.descricao}</p>
                        <div className="flex flex-row flex-wrap gap-1">
                            {projeto.membros.length === 0 && <span className="text-[11px] text-zinc-500">Sem membros</span>}
                            {projeto.membros.map((membro) => (
                                <span key={membro.id} className="text-[11px] text-gray-400 rounded-md bg-[#151A1E] border border-[#333B44] px-2 py-0.5">{membro.nome}</span>
                            ))}
                        </div>
                        <hr className="border-gray-600" />
                        <div className="flex flex-row items-center gap-2">
                            <p className="text-sm text-zinc-400">Inicio: {formatarDia(projeto.data_inicio)}</p>
                        </div>

                    </article>
                ))}
            </div>

            <div className="flex flex-row items-center justify-center gap-4">
                <Button variant="ghost" className="text-gray-400" disabled={pagina <= 1} onClick={() => getDados(pagina - 1)}>
                    Anterior
                </Button>
                <p className="text-sm text-zinc-400">Página {pagina} de {totalPaginas}</p>
                <Button variant="ghost" className="text-gray-400" disabled={pagina >= totalPaginas} onClick={() => getDados(pagina + 1)}>
                    Próxima
                </Button>
            </div>

            <DialogNewProjeto open={open} onOpenChange={setOpen} onCreateProjeto={criarProjeto} />
        </Layout>
    );
};

export default Projetos;
