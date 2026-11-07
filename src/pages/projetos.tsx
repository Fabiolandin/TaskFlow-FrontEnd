import DialogNewProjeto from "@/components/DialogNewProjeto";
import DialogMembrosProjeto from "@/components/DialogMembrosProjeto";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createProjeto, fetchProjetos, LIMITE_PROJETOS, type DadosProjeto, type PaginaProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { ApiError } from "@/api/apiClient";
import { formatarDia } from "@/utils/formaters/fdata";

const PAGINA_VAZIA: PaginaProjetos = { data: [], total: 0, page: 1, totalPages: 0 };

const Projetos = () => {

    //States para o dialog
    const [open, setOpen] = useState(false);
    //dialog de membros de um projeto existente (SPEC-013)
    const [openMembros, setOpenMembros] = useState(false);
    const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(null);

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

    //projeto e membros numa gravação só (RF-28); devolve se gravou (o dialog fecha só nesse caso)
    const criarProjeto = async (dados: DadosProjeto) => {
        try {
            await createProjeto(dados);
        } catch (error) {
            //nada foi gravado: mostra o motivo quando a API manda a message em texto
            const motivo = error instanceof ApiError ? error.mensagemDaApi : undefined;
            toast.error(motivo ? `Erro ao criar projeto: ${motivo}` : "Erro ao criar projeto");
            return false;
        }
        toast.success("Projeto criado com sucesso!");

        //o projeto novo é o último (a API ordena por id): vai para a última página
        await getDados(Math.ceil((resposta.total + 1) / LIMITE_PROJETOS));
        return true;
    }

    const abrirMembros = (projeto: Projeto) => {
        setProjetoSelecionado(projeto);
        setOpenMembros(true);
    }

    //cada clique no dialog já gravou; ao fechar, o cartão passa a mostrar os membros gravados, na mesma página
    const mudarDialogMembros = (aberto: boolean) => {
        setOpenMembros(aberto);
        if (!aberto) getDados(pagina);
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
                            <Button variant="ghost" size="sm" className="ml-auto text-gray-400" onClick={() => abrirMembros(projeto)}>
                                Membros
                            </Button>
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
            <DialogMembrosProjeto open={openMembros} onOpenChange={mudarDialogMembros} projeto={projetoSelecionado} />
        </Layout>
    );
};

export default Projetos;
