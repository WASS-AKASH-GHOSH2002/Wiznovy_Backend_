export class OrderNumberGenerator {
  /**
   * Generates a unique order number for purchases
   * Format: WIZ-YYYYMMDD-HHMMSS-XXX
   * Where XXX is a random 3-digit number
   */
  static generateOrderNumber(): string {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `WIZ-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
  }
}