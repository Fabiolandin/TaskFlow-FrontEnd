//horas guardadas como minutos inteiros (SPEC-023, §8 do pedido); conversão só na apresentação

//480 → "8h"; 270 → "4h30"; 45 → "0h45"
export const formatarMinutos = (minutos: number): string => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

//o que a pessoa digita vira minutos: "8", "8h", "4h30", "4:30", "4,5", "4.5", "30min"; inválido → null
export const lerHoras = (texto: string): number | null => {
    const t = texto.trim().toLowerCase().replace(/\s+/g, "");
    if (!t) return null;
    let m = t.match(/^(\d+)min$/);
    if (m) return Number(m[1]);
    m = t.match(/^(\d+)(?:h|:)(\d{1,2})?(?:min|m)?$/);
    if (m) {
        const minutos = m[2] ? Number(m[2]) : 0;
        return minutos < 60 ? Number(m[1]) * 60 + minutos : null;
    }
    m = t.match(/^(\d+(?:[.,]\d+)?)h?$/);
    if (m) return Math.round(Number(m[1].replace(",", ".")) * 60);
    return null;
};
