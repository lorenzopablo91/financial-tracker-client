export interface AuthResponse {
    success: boolean;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
    user: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
}