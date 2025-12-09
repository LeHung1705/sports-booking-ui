import apiClient, { getBaseURL } from "./apiClient";
import axios from "axios";
import { VoucherPreviewRequest, VoucherPreviewResponse } from "../types/voucher";

export const voucherApi = {
  /**
   * Check if a voucher is valid (Preview)
   * POST /v1/vouchers/preview
   * Note: VoucherController is mapped to /v1/vouchers, while apiClient is /api/v1.
   * We need to adjust the URL.
   */
  previewVoucher: async (code: string, orderAmount: number, venueId: string): Promise<VoucherPreviewResponse> => {
    // Construct the correct URL for /v1/vouchers
    // Assuming apiClient.defaults.baseURL is ".../api/v1"
    const baseURL = getBaseURL();
    // Replace trailing /api/v1 with /v1/vouchers/preview or just use the root + /v1...
    // Safer: Remove "/api/v1" from the end and append "/v1/vouchers/preview"
    const rootURL = baseURL.replace(/\/api\/v1\/?$/, ""); 
    const url = `${rootURL}/v1/vouchers/preview`;

    // We use a separate axios call or apiClient with absolute URL (if apiClient supports it without prefixing)
    // However, apiClient adds headers (Authorization). We want those.
    // Axios allows absolute URLs in request config to override baseURL.
    const res = await apiClient.post<VoucherPreviewResponse>(url, {
        code,
        order_amount: orderAmount,
        venue_id: venueId
    } as VoucherPreviewRequest);
    
    return res.data;
  }
};
