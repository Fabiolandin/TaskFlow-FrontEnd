import { apiClient } from "@/api/apiClient";
import type { Usuario } from "@/pages/usuarios";

export const fetchUsuarios = async () => {
    return apiClient<Usuario[]>(`/usuarios`, {
        method: "GET",
    });
}

export const createUsuario = async(nome: string, email: string, senha: string) => {
    return apiClient(`/usuarios`, {
        method: "POST",
        body: JSON.stringify({ nome, email, senha }),
    });
}

export const deleteUsuario = async(id: number) => {
    return apiClient(`/usuarios/${id}`, {
        method: "DELETE",
    });
}

export const updateUsuario = async(id: number, nome: string, email: string, senha?: string) => {
    const body: any = { nome, email };
    if (senha) {
        body.senha = senha;
    }
    return apiClient(`/usuarios/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}