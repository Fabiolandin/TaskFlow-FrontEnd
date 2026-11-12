//quais colunas opcionais a lista mostra (RF-78): Status some na agrupada e no projeto; Projeto some no projeto
export interface ColunasTarefa {
    mostrarStatus?: boolean;
    mostrarProjeto?: boolean;
}

export const contarColunas = ({ mostrarStatus = true, mostrarProjeto = true }: ColunasTarefa) => 5 + (mostrarStatus ? 1 : 0) + (mostrarProjeto ? 1 : 0);
