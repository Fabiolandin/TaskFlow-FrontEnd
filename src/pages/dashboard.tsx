import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Layout from "@/components/Layout";
import { ApiError } from "@/api/apiClient";
import { fetchDashboard, type Dashboard } from "@/fetchs/fetchDashboard";
import { useAoCriarTarefa } from "@/context/CriarTarefaContext";
import { useTokens } from "@/utils/tokens";

//o recharts desenha em atributos SVG, que não aceitam var(): os tokens são lidos e relidos ao trocar o tema (RF-68)
const TOKENS = ["texto", "texto-suave", "borda-forte", "elevado", "hover", "superficie", "status-reserva",
    "tom-ambar-texto", "tom-verde-texto", "tom-vermelho-texto", "tom-azul-texto"] as const;

//altura de cada barra do gráfico por projeto; com muitos projetos, o cartão rola por dentro (RF-71)
const ALTURA_PROJETO = 36;

type Estado =
    | { tipo: "carregando" }
    | { tipo: "erro"; mensagem: string }
    | { tipo: "pronto"; dados: Dashboard["tarefas"] };

const mensagemDoErro = (error: unknown) =>
    (error instanceof ApiError && error.mensagemDaApi) || "Não foi possível carregar o Dashboard";

const Cartao = ({ titulo, valor, tom }: { titulo: string; valor: number | undefined; tom?: string }) => (
    <div data-cartao className="rounded-cartao border border-borda bg-superficie px-4 py-3">
        <p className="text-[12px] text-texto-suave">{titulo}</p>
        <p className="mt-1 font-mono text-2xl font-semibold leading-none text-texto" style={tom ? { color: `var(--tf-tom-${tom}-texto)` } : undefined}>
            {valor ?? "—"}
        </p>
    </div>
);

//altura útil do corpo do cartão, medida: o gráfico rolável recebe um número exato e não entra em laço de redimensionar
const useAlturaDe = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [altura, setAltura] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new ResizeObserver(() => setAltura(el.clientHeight));
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, altura] as const;
};

//cartão de gráfico: no xl ocupa a altura que sobra da linha (RF-71); abaixo disso, altura fixa.
//Com `rolagem`, o filho recebe a altura do corpo e rola por dentro quando precisa de mais (espaço da barra reservado)
const Grafico = ({ titulo, children, rolagem }: { titulo: string; children: ReactNode | ((altura: number) => ReactNode); rolagem?: boolean }) => {
    const [ref, altura] = useAlturaDe();
    return (
        <section data-grafico className="flex h-72 min-h-0 flex-col rounded-cartao border border-borda bg-superficie p-4 xl:h-auto">
            <h2 className="mb-2 font-heading text-[14px] font-semibold text-texto">{titulo}</h2>
            <div ref={ref} data-grafico-corpo className={`min-h-0 flex-1 ${rolagem ? "overflow-y-auto [scrollbar-gutter:stable]" : ""}`}>
                {typeof children === "function" ? (altura > 0 ? children(altura) : null) : children}
            </div>
        </section>
    );
};

//painel inicial: números gerais das tarefas, lidos ao abrir a página (SPEC-009, RF-40); cabe numa tela (RF-71)
const DashboardPage = () => {
    const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
    //tarefa criada pela tecla C: os números são relidos (RF-34)
    const [recarga, setRecarga] = useState(0);
    useAoCriarTarefa(() => setRecarga((n) => n + 1));
    const t = useTokens(TOKENS);

    useEffect(() => {
        let ativo = true;
        fetchDashboard()
            .then((resposta) => { if (ativo) setEstado({ tipo: "pronto", dados: resposta.tarefas }) })
            .catch((error) => { if (ativo) setEstado({ tipo: "erro", mensagem: mensagemDoErro(error) }) });
        return () => { ativo = false };
    }, [recarga]);

    const dados = estado.tipo === "pronto" ? estado.dados : undefined;

    const tick = { fill: t["texto-suave"], fontSize: 11 };
    const tooltip = { backgroundColor: t.elevado, border: `1px solid ${t["borda-forte"]}`, borderRadius: 8, color: t.texto };
    const itemTooltip = { color: t.texto };
    const cursor = { fill: t.hover };

    const porStatus = (dados?.porStatus ?? []).map((s) => ({ ...s, cor: s.cor ?? t["status-reserva"] }));
    const abertasXConcluidas = [
        { nome: "Abertas", total: dados?.abertas ?? 0, cor: t["tom-ambar-texto"] },
        { nome: "Concluídas", total: dados?.concluidas ?? 0, cor: t["tom-verde-texto"] },
    ];
    //do maior para o menor total (RF-71)
    const porProjeto = [...(dados?.porProjeto ?? [])].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
    const alturaProjetos = porProjeto.length * ALTURA_PROJETO + 40;

    return (
        <Layout>
            <div data-painel className="flex flex-col gap-4 xl:h-full xl:min-h-0">
                <h1 className="font-heading text-2xl font-semibold tracking-[-.02em] text-texto">Painel</h1>

                {estado.tipo === "erro" && (
                    <div role="alert" className="rounded-cartao border border-tom-vermelho-texto/40 bg-tom-vermelho-fundo p-4 text-tom-vermelho-texto">
                        {estado.mensagem}
                    </div>
                )}

                {estado.tipo !== "erro" && (
                    <>
                        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4" aria-busy={estado.tipo === "carregando"}>
                            <Cartao titulo="Total" valor={dados?.total} />
                            <Cartao titulo="Abertas" valor={dados?.abertas} tom="ambar" />
                            <Cartao titulo="Concluídas" valor={dados?.concluidas} tom="verde" />
                            <Cartao titulo="Atrasadas" valor={dados?.atrasadas} tom="vermelho" />
                        </div>

                        {estado.tipo === "carregando" && <p className="text-texto-suave">Carregando...</p>}

                        {dados && dados.total === 0 && (
                            <p className="rounded-cartao border border-borda bg-superficie p-4 text-texto-suave">
                                Nenhuma tarefa cadastrada ainda.
                            </p>
                        )}

                        {dados && dados.total > 0 && (
                            <div data-graficos className="grid grid-cols-1 gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-3">
                                <Grafico titulo="Tarefas por status">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={porStatus} margin={{ top: 18, right: 4, left: -18, bottom: 0 }}>
                                            <XAxis dataKey="nome" tick={tick} stroke={t["borda-forte"]} interval={0} />
                                            <YAxis allowDecimals={false} tick={tick} stroke={t["borda-forte"]} />
                                            <Tooltip contentStyle={tooltip} itemStyle={itemTooltip} labelStyle={itemTooltip} cursor={cursor} />
                                            <Bar dataKey="total" name="Tarefas" minPointSize={3} radius={[4, 4, 0, 0]} label={{ position: "top", fill: t.texto, fontSize: 11 }}>
                                                {porStatus.map((s) => <Cell key={s.id} fill={s.cor} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grafico>

                                <Grafico titulo="Abertas × concluídas">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip contentStyle={tooltip} itemStyle={itemTooltip} labelStyle={itemTooltip} />
                                            <Pie
                                                data={abertasXConcluidas}
                                                dataKey="total"
                                                nameKey="nome"
                                                innerRadius="55%"
                                                outerRadius="75%"
                                                stroke={t.superficie}
                                                label={({ x, y, textAnchor, name, value }) => (
                                                    <text x={x} y={y} textAnchor={textAnchor} fill={t.texto} fontSize={11}>{`${name}: ${value}`}</text>
                                                )}
                                            >
                                                {abertasXConcluidas.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Grafico>

                                <Grafico titulo="Tarefas por projeto" rolagem>
                                    {/* a altura cresce com os projetos; passando do cartão, ele rola por dentro e a página não */}
                                    {(altura: number) => (
                                        <ResponsiveContainer width="100%" height={Math.max(alturaProjetos, altura)}>
                                            <BarChart data={porProjeto} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }}>
                                                <XAxis type="number" allowDecimals={false} tick={tick} stroke={t["borda-forte"]} />
                                                <YAxis type="category" dataKey="nome" width={120} interval={0} tick={tick} stroke={t["borda-forte"]} />
                                                <Tooltip contentStyle={tooltip} itemStyle={itemTooltip} labelStyle={itemTooltip} cursor={cursor} />
                                                <Bar dataKey="total" name="Tarefas" fill={t["tom-azul-texto"]} minPointSize={3} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: "right", fill: t.texto, fontSize: 11 }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </Grafico>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}

export default DashboardPage;
