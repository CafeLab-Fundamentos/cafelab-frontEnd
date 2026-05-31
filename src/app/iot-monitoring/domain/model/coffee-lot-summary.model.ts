/**
 * Minimal coffee-lot projection used only within the IoT-Monitoring bounded context.
 * Keeps this module independent from the coffee-lot module.
 */
export interface CoffeeLotSummary {
  id: number;
  lotName: string;
}
