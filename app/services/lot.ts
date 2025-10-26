import { useNuxtApp } from '#app';

export type LotResponse = {
  id: number;
  itemId: number;
  itemName: string;
  code: string;
  expireDate: string | null;
  quantityOnHand: number;
};

export type LotCreateRequest = {
  itemId: number;
  code: string;
  expireDate?: string;
  quantity: number;
};

export type LotAdjustRequest = { delta: number };

export function useLotService() {
  const { $api } = useNuxtApp();

  async function createLot(req: LotCreateRequest): Promise<LotResponse> {
    return await $api('/api/lotes', { method: 'POST', body: req });
  }

  async function listLots(itemId: number): Promise<LotResponse[]> {
    const q = new URLSearchParams({ itemId: String(itemId) }).toString();
    const res: any = await $api(`/api/lotes?${q}`);
    return Array.isArray(res) ? (res as LotResponse[]) : [];
  }

  async function adjustLot(lotId: number, delta: number): Promise<LotResponse> {
    return await $api(`/api/lotes/${lotId}/adjust`, { method: 'PATCH', body: { delta } });
  }

  return { createLot, listLots, adjustLot };
}
