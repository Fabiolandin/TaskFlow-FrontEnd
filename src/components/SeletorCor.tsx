import { Ban, Check } from "lucide-react";
import { Input } from "./ui/input";
import { AVISO_COR, corValida } from "@/fetchs/fetchStatus";

//cores prontas do painel (RF-64): da mais fria à mais quente, mais dois neutros
const CORES_PRONTAS = [
    "#E5484D", "#F76B15", "#FFC53D", "#46A758", "#12A594", "#00A2C7",
    "#3E63DD", "#6E56CF", "#AB4ABA", "#D6409F", "#8D8D8D", "#6E7379",
];

interface SeletorCorProps {
    valor: string;
    onChange: (cor: string) => void;
}

const anel = "ring-2 ring-white ring-offset-2 ring-offset-[#0E1012]";

//painel de cor do status (RF-64): grade pronta, "sem cor", seletor livre e o hex para quem quiser digitar
const SeletorCor = ({ valor, onChange }: SeletorCorProps) => {
    const atual = valor.trim().toUpperCase();
    const valida = corValida(valor);
    return (
        <div data-seletor-cor className="mb-2 flex flex-col gap-2">
            <div role="radiogroup" aria-label="Cor" className="flex flex-wrap items-center gap-2">
                <button type="button" role="radio" aria-checked={atual === ""} aria-label="Sem cor" title="Sem cor"
                    onClick={() => onChange("")}
                    className={`flex size-7 items-center justify-center rounded-full border border-[#333B44] text-[#6E7379] ${atual === "" ? anel : ""}`}>
                    <Ban aria-hidden="true" className="size-4" />
                </button>
                {CORES_PRONTAS.map((cor) => (
                    <button key={cor} type="button" role="radio" aria-checked={atual === cor} aria-label={cor} title={cor}
                        onClick={() => onChange(cor)}
                        className={`flex size-7 items-center justify-center rounded-full ${atual === cor ? anel : ""}`}
                        style={{ backgroundColor: cor }}>
                        {atual === cor && <Check aria-hidden="true" className="size-4 text-white" />}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <label title="Escolher outra cor" className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-[#333B44]"
                    style={{ backgroundColor: valida && atual ? atual : "transparent" }}>
                    <span className="sr-only">Escolher outra cor</span>
                    <input type="color" aria-label="Escolher outra cor" className="absolute inset-0 cursor-pointer opacity-0"
                        value={valida && atual ? atual.toLowerCase() : "#6e7379"}
                        onChange={(e) => onChange(e.target.value.toUpperCase())} />
                </label>
                <Input
                    aria-label="Cor em hex"
                    className="h-9 bg-[#151A1E] border-[#333B44] font-mono text-white"
                    type="text"
                    placeholder="Sem cor (ou #E5484D)"
                    value={valor}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
            {!valida && <p className="text-red-400 text-[12px]">{AVISO_COR}</p>}
        </div>
    );
};

export default SeletorCor;
