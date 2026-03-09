export type ExpiringPreviewItem = {
  name: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: "expired" | "expiring_soon";
};
