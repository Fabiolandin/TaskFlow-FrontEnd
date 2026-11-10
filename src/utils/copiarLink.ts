//link absoluto da página de uma tarefa (RF-46)
export const linkDaTarefa = (id: number) => `${window.location.origin}/tarefas/${id}`;

//põe o texto na área de transferência; rejeita quando o navegador não deixa (quem chama mostra o aviso)
export const copiarTexto = async (texto: string) => {
    if (!navigator.clipboard) throw new Error("Área de transferência indisponível");
    await navigator.clipboard.writeText(texto);
};
