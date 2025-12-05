import { HttpContextToken } from '@angular/common/http';

/**
 * Token para personalizar el mensaje del loader en peticiones HTTP
 * 
 * Uso:
 * this.http.get(url, {
 *   context: new HttpContext().set(LOADER_MESSAGE, 'Tu mensaje personalizado')
 * })
 */
export const LOADER_MESSAGE = new HttpContextToken<string>(() => '');

/**
 * Token para desactivar el loader en peticiones HTTP específicas
 * 
 * Uso:
 * this.http.get(url, {
 *   context: new HttpContext().set(SKIP_LOADER, true)
 * })
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/**
 * Token para desactivar los mensajes progresivos (10s, 30s, 60s, etc.)
 * Útil cuando tienes control total del mensaje
 * 
 * Uso:
 * this.http.get(url, {
 *   context: new HttpContext()
 *     .set(LOADER_MESSAGE, 'Procesando...')
 *     .set(SKIP_PROGRESSIVE_MESSAGES, true)
 * })
 */
export const SKIP_PROGRESSIVE_MESSAGES = new HttpContextToken<boolean>(() => false);