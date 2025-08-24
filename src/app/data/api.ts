import { environment } from "../environments/environment";

export const API_CONFIG = {
    BINANCE: {
        BASE_URL: 'https://api.binance.com',
        API_KEY: environment.BINANCE_API_KEY || '',
        SECRET_KEY:environment.BINANCE_SECRET_KEY || '',
        REVALIDATE_TIME: 60
    }
};