export interface Membro {
    id: number;
    nome: string;
    email: string;
}

const Membros: Membro[] = [
    { id: 1, nome: "João Silva", email: "joao.silva@example.com" },
    { id: 2, nome: "Maria Oliveira", email: "maria.oliveira@example.com" },
    { id: 3, nome: "Pedro Santos", email: "pedro.santos@example.com" },
    { id: 4, nome: "Ana Costa", email: "ana.costa@example.com" },
    { id: 5, nome: "Lucas Pereira", email: "lucas.pereira@example.com" }
];


export default Membros;