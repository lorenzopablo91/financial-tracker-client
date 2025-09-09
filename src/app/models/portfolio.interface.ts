export interface PortfolioResponse {
    success: boolean;
    categories: PortfolioCategory[];
    metadata: PortfolioMetadata;
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

export interface PortfolioMetadata {
    iolActivos: number;
    letrasEncontradas: number;
    accionesEncontradas: number;
    cryptosEncontradas: number;
    cotizacionCCL: number;
    timestamp: string;
}