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

export interface PortfolioHistoryData {
    date: Date;
    totalPortfolio: number;
}

export interface Asset {
    tipo: string;
    prefijo: string;
    nombre: string;
    cantidad: number;
    costoPromedioUSD: number;
    precioMercado: number;
    costoBase: number;
    valorActual: number;
    gananciaPerdida: number;
    gananciaPorc: number;
    color: string;
    icono: string;
    porcentajeComposicion: number;
}

export interface AssetStats {
    assetsCount: number;
    totalValue: number;
    totalCost: number;
    totalGain: number;
    totalGainPerc: number;
}

export interface Transaction {
    id: string;
    portafolioId: string;
    tipo: 'COMPRA' | 'VENTA' | 'APORTE' | 'RETIRO';
    fecha: string;
    createdAt: string;

    // Para COMPRA/VENTA
    activoColor?: string;
    activoIcono?: string;
    activoId?: string;
    activoNombre?: string;
    activoPrefijo?: string;
    activoTipo?: string;
    cantidad?: string;
    precioUSD?: string;
    precioARS?: string;
    tipoCambio?: string;

    // Monto de la operación
    montoUSD: string;

    // Para VENTA
    gananciaRealizada?: string | null;
    costoBaseVendido?: string | null;

    // Opcional
    notas?: string;
}
