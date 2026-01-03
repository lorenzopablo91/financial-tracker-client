export const OPERATIONS_TYPES = {
    Criptomoneda: {
        name: 'CRIPTOMONEDAS',
        color: '#FF9F40',
        icon: 'currency_bitcoin',
        type: 'Criptomoneda'
    },
    Cedear: {
        name: 'CEDEARS',
        color: '#4BC0C0',
        icon: 'attach_money',
        type: 'Cedear'
    },
    Accion: {
        name: 'ACCIONES',
        color: '#9966FF',
        icon: 'bar_chart',
        type: 'Accion'
    },
    FCI: {
        name: 'FONDO COMUN INVERSION',
        color: '#36A2EB',
        icon: 'show_chart',
        type: 'FCI'
    }
};

export const OPERATION_COLORS: Record<string, string> = {
  COMPRA: '#4CAF50',
  VENTA: '#FF9800',
  APORTE: '#2196F3',
  RETIRO: '#f44336'
};

export const OPERATION_ICONS: Record<string, string> = {
  COMPRA: 'shopping_cart',
  VENTA: 'sell',
  APORTE: 'arrow_downward',
  RETIRO: 'arrow_upward'
};
