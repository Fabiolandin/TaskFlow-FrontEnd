import type { Tarefa } from "@/fetchs/fetchTarefas";

//hierarquia na sprint: o "tema" é a tarefa raiz; cada tema ganha uma cor fixa, igual em backlog, filas e cronograma

//id da raiz (a própria tarefa quando não tem mãe)
export const idDoTema = (t: Pick<Tarefa, "id" | "ancestrais">) => t.ancestrais[0]?.id ?? t.id;

//ângulo de ouro espalha os tons: temas de ids próximos ficam com cores bem diferentes; funciona no tema claro e no escuro
export const corDoTema = (idTema: number) => `hsl(${Math.round((idTema * 137.508) % 360)} 62% 55%)`;
