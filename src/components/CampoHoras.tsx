import { useState } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { formatarMinutos, lerHoras } from "@/utils/minutos";

interface CampoHorasProps {
    rotulo: string;
    //minutos gravados; null = vazio
    valor: number | null;
    pode: boolean;
    onGravar: (minutos: number | null) => void;
    className?: string;
}

//horas digitadas como 8h, 4h30 ou 6; grava ao sair do campo, só se mudou; vazio grava null (RF-108, SPEC-024)
const CampoHoras = ({ rotulo, valor, pode, onGravar, className = "" }: CampoHorasProps) => {
    const [texto, setTexto] = useState<string | null>(null);
    const mostrado = texto ?? (valor === null ? "" : formatarMinutos(valor));
    const sair = () => {
        if (texto === null) return;
        const limpo = texto.trim();
        const minutos = limpo ? lerHoras(limpo) : null;
        setTexto(null);
        if (limpo && minutos === null) { toast.error("Horas inválidas: use 8h, 4h30 ou 6"); return; }
        if (minutos !== valor) onGravar(minutos);
    };
    return (
        <Input aria-label={rotulo} title={pode ? rotulo : "Só o administrador ou o responsável estimam"} disabled={!pode} placeholder="–"
            className={`border-transparent bg-transparent font-mono text-texto-2 hover:bg-elevado focus-visible:bg-elevado disabled:opacity-60 ${className}`}
            value={mostrado} onChange={(e) => setTexto(e.target.value)} onBlur={sair} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
    );
};

export default CampoHoras;
