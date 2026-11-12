import { apiClient } from "@/api/apiClient";
import type { Usuario } from "@/pages/usuarios";

export const fetchUsuarios = async () => {
    return apiClient<Usuario[]>(`/usuarios`, {
        method: "GET",
    });
}

//só admin cria (RF-82); isAdmin ausente = comum
export const createUsuario = async(nome: string, email: string, senha: string, isAdmin?: boolean) => {
    return apiClient(`/usuarios`, {
        method: "POST",
        body: JSON.stringify(isAdmin === undefined ? { nome, email, senha } : { nome, email, senha, isAdmin }),
    });
}

export const deleteUsuario = async(id: number) => {
    return apiClient(`/usuarios/${id}`, {
        method: "DELETE",
    });
}

//senha vazia não vai (mantém a atual); isAdmin só vai quando um admin edita (RF-82);
//senhaAtual só vai quando a pessoa troca a própria senha (RF-93)
export const updateUsuario = async(id: number, nome: string, email: string, senha?: string, isAdmin?: boolean, senhaAtual?: string) => {
    const body: { nome: string; email: string; senha?: string; isAdmin?: boolean; senhaAtual?: string } = { nome, email };
    if (senha) body.senha = senha;
    if (senha && senhaAtual) body.senhaAtual = senhaAtual;
    if (isAdmin !== undefined) body.isAdmin = isAdmin;
    return apiClient(`/usuarios/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

//um usuário (id, nome, email, papel; nunca a senha): o menu e a tela de Usuários leem o logado daqui (RF-73, RF-86)
export const fetchUsuario = async (id: number) => {
    return apiClient<Usuario>(`/usuarios/${id}`, {
        method: "GET",
    });
}
