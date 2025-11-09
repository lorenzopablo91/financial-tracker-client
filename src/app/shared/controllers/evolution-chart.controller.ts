import { WalletHistoryData } from "../../models/wallet.interface";

// Función helper para formatear los datos para Chart.js
export function formatWalletHistoryForChart(data: WalletHistoryData[]) {
    return {
        labels: data.map(item =>
            new Date(item.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short'
            })
        ),
        datasets: [
            {
                label: 'TOTAL PORTAFOLIO',
                data: data.map(item => item.totalWallet),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: 'start',
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };
}
