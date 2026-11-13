//quais colunas opcionais a lista mostra (RF-78): o status é a bolinha ao lado do nome; Projeto some no projeto e nas sub-tarefas
export interface ColunasTarefa {
    mostrarProjeto?: boolean;
}

export const contarColunas = ({ mostrarProjeto = true }: ColunasTarefa) => 5 + (mostrarProjeto ? 1 : 0);
