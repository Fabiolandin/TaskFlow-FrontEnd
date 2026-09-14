import { apiClient } from "@/api/apiClient";
import type { Label } from "@/pages/labels";

export const fetchLabels = async () => {
    return apiClient<Label[]>(`/labels`, {
        method: "GET",
    });
}

export const createLabel = async(nome: string) => {
    return apiClient(`/labels`, {
        method: "POST",
        body: JSON.stringify({ nome }),
    });
}

export const deleteLabel = async(id: number) => {
    return apiClient(`/labels/${id}`, {
        method: "DELETE",
    });
}

export const updateLabel = async(id: number, nome: string) => {
    return apiClient(`/labels/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ nome }),
    });
}