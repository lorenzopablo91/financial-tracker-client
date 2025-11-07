export interface PortfolioResponse {
    success: boolean;
    count: number;
    data: Portfolio[];
}

export interface Portfolio {
    id: string;
    nombre: string;
    descripcion: string;
    capitalInicial: string;
    gananciasRealizadas: string;
    activos: Activo[];
    _count: {
        operaciones: number;
        snapshots: number;
    };
}

export interface Activo {
    id: string;
    nombre: string;
    prefijo: string;
    cantidad: string;
    costoPromedioUSD: string;
    costoPromedioARS: string;
    tipoCambioPromedio: string;
    tipo: string;
    portafolioId: string;
}


export interface PortfolioCategory {
    name: string;
    amount: number;
    color: string;
    percentage: number;
    percentageGain: number;
    amountGain: number;
    icon: string;
    type: string;
}
