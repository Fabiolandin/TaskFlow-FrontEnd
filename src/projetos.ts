export interface Projeto {
    id: number;
    nome: string;
    descricao: string;
    status: string;
    membros: number[];
    tarefasAbertas: number;
    inicio: string;
}


const ProjetosMock = [
    {id: 1, nome: "Taskflow Web", descricao: "Desenvolvimento de aplicação web","status": "Em Andamento", membros: [1, 2], tarefasAbertas: 5, inicio: "2023-01-01"},
    {id: 2, nome: "API Taskflow v2", descricao: "Desenvolvimento de API, com foco nas soluções rápidas do taskflow e com novo sistema de pagamentos", "status": "Em Andamento", membros: [3, 4], tarefasAbertas: 3, inicio: "2023-01-01"},
    {id: 3, nome: "Taskflow Mobile", descricao: "Desenvolvimento de aplicação mobile, voltado para a experiência do usuário", "status": "Concluído", membros: [5], tarefasAbertas: 0, inicio: "2023-01-01"},
    {id: 4, nome: "Taskflow Admin", descricao: "Desenvolvimento de painel administrativo", "status": "Em Andamento", membros: [1, 3, 5], tarefasAbertas: 7, inicio: "2023-01-01"},
    {id: 5, nome: "Taskflow Analytics", descricao: "Desenvolvimento de sistema de análise", "status": "Em Andamento", membros: [2, 4], tarefasAbertas: 4, inicio: "2023-01-01"},
    {id: 6, nome: "Taskflow Reports", descricao: "Desenvolvimento de sistema de relatórios", "status": "Concluído", membros: [1, 2, 3, 4, 5], tarefasAbertas: 0, inicio: "2023-01-01"}
]

export default ProjetosMock;