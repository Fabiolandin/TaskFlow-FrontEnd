export interface UsuarioMock {
    id: number;
    nome: string;
    email: string;
}

const UsuariosMock: UsuarioMock[] = [
    {id: 1, nome: "Fabio Landin", email: "flandin1990@gmail.com"},
    {id: 2, nome: "Marcos Alves", email: "marcoalves@gmail.com"},
    {id: 3, nome: "Gustavo Linducci", email: "liduccig@gmail.com"},
    {id: 4, nome: "Marcela Silva", email: "marcelasilva@gmail.com"},
    {id: 5, nome: "Kaique Fiks", email: "kfiks@gmail.com"},
]

export default UsuariosMock;
