import DialogNewProjeto from "@/components/DialogNewProjeto";
import DialogMembrosProjeto from "@/components/DialogMembrosProjeto";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MarkdownTexto } from "@/components/DescricaoMarkdown";
import Progresso from "@/components/Progresso";
import { toast } from "sonner";
import { createProjeto, fetchProjetos, LIMITE_PROJETOS, type DadosProjeto, type PaginaProjetos, type Projeto } from "@/fetchs/fetchProjetos";
import { ApiError } from "@/api/apiClient";
import { formatarDia } from "@/utils/formaters/fdata";

const PAGINA_VAZIA: PaginaProjetos = { data: [], total: 0, page: 1, totalPages: 0 };

//o clique no nome (link) e no botão "Membros" não abre a página pelo cartão (RF-23, D-16)
const naoPropaga = (e: MouseEvent) => e.stopPropagation();

const Projetos = () => {
    const navigate = useNavigate();

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
                    <article key={projeto.id} data-projeto-id={projeto.id} onClick={() => navigate(`/projetos/${projeto.id}`)}
                        className="flex min-h-45 cursor-pointer flex-col gap-3 rounded-lg border border-[#1C1F23] bg-[#0E1012] p-4 transition-colors hover:border-[#2A2F35] hover:bg-[#101316]">
                        <div className="flex flex-row items-start justify-between gap-3">
                            <h2 className="min-w-0 font-heading text-[16px] font-semibold tracking-[-.01em] text-[#E7E4DF]">
                                <Link to={`/projetos/${projeto.id}`} onClick={naoPropaga} className="block truncate rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#3A3F45]">
                                    {projeto.nome}
                                </Link>
                            </h2>
                            <p className="flex shrink-0 items-center gap-1.5 text-[12px] text-[#A9AEB4]">
                                {projeto.status.cor && <span className="inline-block size-2 rounded-full" style={{ backgroundColor: projeto.status.cor }} />}
                                {projeto.status.nome}
                            </p>
                        </div>

                        {projeto.descricao && (
                            <MarkdownTexto texto={projeto.descricao} className="line-clamp-3 max-h-[4.8em] overflow-hidden text-[13px] leading-[1.6] text-[#8A9098] [&_li]:my-0 [&_p]:my-0 [&_pre]:my-0 [&_ul]:my-0 [&_ol]:my-0" />
                        )}

                        <Progresso progresso={projeto.progresso} />

                        <div className="flex flex-row flex-wrap gap-1">
                            {projeto.membros.length === 0 && <span className="text-[11px] text-zinc-500">Sem membros</span>}
                            {projeto.membros.map((membro) => (
                                <span key={membro.id} className="rounded-md border border-[#24272B] bg-[#121518] px-1.5 py-0.5 text-[11px] text-[#A9AEB4]">{membro.nome}</span>
                            ))}
                        </div>
                        <div className="mt-auto flex flex-row items-center gap-2 border-t border-[#1C1F23] pt-2">
                            <p className="font-mono text-[12px] text-[#7C8189]">Início: {formatarDia(projeto.data_inicio)}</p>
                            <Button variant="ghost" size="sm" className="ml-auto text-gray-400" onClick={(e) => { naoPropaga(e); abrirMembros(projeto); }}>
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
