export interface LabelMock {
    id: number;
    nome: string;
    createdAt: string
}

const LabelsMock: LabelMock[] = [
    {id: 1, nome: "BUG", createdAt:"2026-03-21"},
    {id: 2, nome: "Feature", createdAt:"2026-09-15"},
    {id: 3, nome: "Mapeamento", createdAt:"2026-10-10"},
    {id: 4, nome: "Teste", createdAt:"2026-08-13"},
    {id: 5, nome: "Refatoração", createdAt:"2025-07-27"},
    {id: 6, nome: "Cancelado", createdAt:"2022-09-30"},
    {id: 7, nome: "Bloqueado", createdAt:"2021-06-17"},
]

export default LabelsMock