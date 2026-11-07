import { useEffect, useState, type ReactElement } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/api/apiClient";
import { fetchDashboard, type Dashboard } from "@/fetchs/fetchDashboard";

//cor de reserva para status sem cor (Neutro do DESIGN.md) e cores dos cartões e do gráfico de abertas x concluídas
const COR_RESERVA = "#6E7379";
const COR_ABERTAS = "#E3C57F";
const COR_CONCLUIDAS = "#7FD1A6";
const COR_ATRASADAS = "#F2736C";
const COR_BARRA_PROJETO = "#9BB8F0";

//eixos e tooltip legíveis no tema escuro
const TICK = { fill: "#A1A1AA", fontSize: 12 };
const ESTILO_TOOLTIP = { backgroundColor: "#151A1E", border: "1px solid #333B44", borderRadius: 8, color: "#FFFFFF" };
const ESTILO_ITEM_TOOLTIP = { color: "#FFFFFF" };
const CURSOR_TOOLTIP = { fill: "rgba(255, 255, 255, 0.06)" };

type Estado =
    | { tipo: "carregando" }
    | { tipo: "erro"; mensagem: string }
    | { tipo: "pronto"; dados: Dashboard["tarefas"] };

const mensagemDoErro = (error: unknown) =>
    (error instanceof ApiError && error.mensagemDaApi) || "Não foi possível carregar o Dashboard";

interface CartaoProps {
    titulo: string;
    valor: number | undefined;
    cor?: string;
}

const Cartao = ({ titulo, valor, cor }: CartaoProps) => (
    <Card className="bg-[#151A1E] ring-[#333B44]">
        <CardHeader>
            <CardTitle className="text-sm font-normal text-zinc-400">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="font-mono text-3xl font-semibold text-white" style={cor ? { color: cor } : undefined}>
                {valor ?? "—"}
            </p>
        </CardContent>
    </Card>
);

interface GraficoProps {
    titulo: string;
    altura: number;
    children: ReactElement;
}

//contêiner com altura definida: o ResponsiveContainer precisa dela para desenhar
const Grafico = ({ titulo, altura, children }: GraficoProps) => (
    <Card className="bg-[#151A1E] ring-[#333B44]">
        <CardHeader>
            <CardTitle className="text-base text-white">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="w-full" style={{ height: altura }}>
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
);

//painel inicial: números gerais das tarefas, lidos ao abrir a página (SPEC-009, RF-40)
const DashboardPage = () => {
    const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

    useEffect(() => {
        let ativo = true;
        fetchDashboard()
            .then((resposta) => { if (ativo) setEstado({ tipo: "pronto", dados: resposta.tarefas }) })
            .catch((error) => { if (ativo) setEstado({ tipo: "erro", mensagem: mensagemDoErro(error) }) });
        return () => { ativo = false };
    }, []);

    const dados = estado.tipo === "pronto" ? estado.dados : undefined;

    const porStatus = (dados?.porStatus ?? []).map((s) => ({ ...s, cor: s.cor ?? COR_RESERVA }));
    const abertasXConcluidas = [
        { nome: "Abertas", total: dados?.abertas ?? 0, cor: COR_ABERTAS },
        { nome: "Concluídas", total: dados?.concluidas ?? 0, cor: COR_CONCLUIDAS },
    ];
    const porProjeto = dados?.porProjeto ?? [];
    //uma linha por projeto: a altura cresce com a quantidade para não estourar o layout
    const alturaProjetos = Math.max(288, porProjeto.length * 32 + 48);

    return (
        <Layout>
            <h1 className="mb-6 text-3xl font-bold text-white">Painel</h1>

            {estado.tipo === "erro" && (
                <div role="alert" className="rounded-lg border border-[#F2736C]/40 bg-[#341E1D] p-4 text-[#F2736C]">
                    {estado.mensagem}
                </div>
            )}

            {estado.tipo !== "erro" && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy={estado.tipo === "carregando"}>
                        <Cartao titulo="Total" valor={dados?.total} />
                        <Cartao titulo="Abertas" valor={dados?.abertas} cor={COR_ABERTAS} />
                        <Cartao titulo="Concluídas" valor={dados?.concluidas} cor={COR_CONCLUIDAS} />
                        <Cartao titulo="Atrasadas" valor={dados?.atrasadas} cor={COR_ATRASADAS} />
                    </div>

                    {estado.tipo === "carregando" && <p className="text-zinc-400">Carregando...</p>}

                    {dados && dados.total === 0 && (
                        <p className="rounded-lg border border-[#333B44] bg-[#151A1E] p-4 text-zinc-400">
                            Nenhuma tarefa cadastrada ainda.
                        </p>
                    )}

                    {dados && dados.total > 0 && (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <Grafico titulo="Tarefas por status" altura={288}>
                                <BarChart data={porStatus}>
                                    <XAxis dataKey="nome" tick={TICK} stroke="#333B44" />
                                    <YAxis allowDecimals={false} tick={TICK} stroke="#333B44" />
                                    <Tooltip contentStyle={ESTILO_TOOLTIP} itemStyle={ESTILO_ITEM_TOOLTIP} labelStyle={ESTILO_ITEM_TOOLTIP} cursor={CURSOR_TOOLTIP} />
                                    <Bar dataKey="total" name="Tarefas" minPointSize={3} label={{ position: "top", fill: "#FFFFFF", fontSize: 12 }}>
                                        {porStatus.map((s) => <Cell key={s.id} fill={s.cor} />)}
                                    </Bar>
                                </BarChart>
                            </Grafico>

                            <Grafico titulo="Abertas × concluídas" altura={288}>
                                <PieChart>
                                    <Tooltip contentStyle={ESTILO_TOOLTIP} itemStyle={ESTILO_ITEM_TOOLTIP} labelStyle={ESTILO_ITEM_TOOLTIP} />
                                    <Pie
                                        data={abertasXConcluidas}
                                        dataKey="total"
                                        nameKey="nome"
                                        innerRadius="55%"
                                        outerRadius="80%"
                                        stroke="#151A1E"
                                        label={({ x, y, textAnchor, name, value }) => (
                                            <text x={x} y={y} textAnchor={textAnchor} fill="#FFFFFF" fontSize={12}>{`${name}: ${value}`}</text>
                                        )}
                                    >
                                        {abertasXConcluidas.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                                    </Pie>
                                </PieChart>
                            </Grafico>

                            <div className="xl:col-span-2">
                                <Grafico titulo="Tarefas por projeto" altura={alturaProjetos}>
                                    <BarChart data={porProjeto} layout="vertical" margin={{ right: 24 }}>
                                        <XAxis type="number" allowDecimals={false} tick={TICK} stroke="#333B44" />
                                        <YAxis type="category" dataKey="nome" width={140} interval={0} tick={TICK} stroke="#333B44" />
                                        <Tooltip contentStyle={ESTILO_TOOLTIP} itemStyle={ESTILO_ITEM_TOOLTIP} labelStyle={ESTILO_ITEM_TOOLTIP} cursor={CURSOR_TOOLTIP} />
                                        <Bar dataKey="total" name="Tarefas" fill={COR_BARRA_PROJETO} minPointSize={3} label={{ position: "right", fill: "#FFFFFF", fontSize: 12 }} />
                                    </BarChart>
                                </Grafico>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
}

export default DashboardPage;
