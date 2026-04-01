// =============================================================================
// DMSuite — ZRA Smart Invoice VSDC Proxy API Route
// Server-side proxy for communicating with the local VSDC device.
// Keeps VSDC configuration server-side and validates all requests.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  VSDC_ENDPOINTS,
  validateTPIN,
  validateBranchId,
} from "@/lib/zra-vsdc";

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VSDCProxyRequest {
  endpoint: keyof typeof VSDC_ENDPOINTS;
  config: {
    baseUrl: string;
    tpin: string;
    bhfId: string;
    deviceSerialNo?: string;
  };
  payload?: Record<string, unknown>;
}

// ━━━ POST Handler ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VSDCProxyRequest;

    // Validate required fields
    if (!body.endpoint || !body.config?.baseUrl || !body.config?.tpin || !body.config?.bhfId) {
      return NextResponse.json(
        { error: "Missing required fields: endpoint, config.baseUrl, config.tpin, config.bhfId" },
        { status: 400 },
      );
    }

    // Validate endpoint is a known VSDC endpoint
    const endpointPath = VSDC_ENDPOINTS[body.endpoint];
    if (!endpointPath) {
      return NextResponse.json(
        { error: `Unknown endpoint: ${body.endpoint}. Valid: ${Object.keys(VSDC_ENDPOINTS).join(", ")}` },
        { status: 400 },
      );
    }

    // Validate TPIN format (10 digits)
    if (!validateTPIN(body.config.tpin)) {
      return NextResponse.json(
        { error: "Invalid TPIN format. Must be exactly 10 digits." },
        { status: 400 },
      );
    }

    // Validate branch ID format (3 digits)
    if (!validateBranchId(body.config.bhfId)) {
      return NextResponse.json(
        { error: "Invalid branch ID format. Must be exactly 3 digits." },
        { status: 400 },
      );
    }

    // Validate baseUrl is a valid URL (localhost or private network only for security)
    let vsdcUrl: URL;
    try {
      vsdcUrl = new URL(endpointPath, body.config.baseUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid baseUrl format" },
        { status: 400 },
      );
    }

    // Security: Only allow connections to localhost/private network VSDC devices
    const hostname = vsdcUrl.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    const isPrivateNetwork =
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    if (!isLocalhost && !isPrivateNetwork) {
      return NextResponse.json(
        { error: "VSDC baseUrl must point to localhost or a private network address" },
        { status: 400 },
      );
    }

    // Build the VSDC request payload
    const vsdcPayload = {
      tpin: body.config.tpin,
      bhfId: body.config.bhfId,
      ...(body.config.deviceSerialNo && { dvcSrlNo: body.config.deviceSerialNo }),
      ...(body.payload || {}),
    };

    // Forward to VSDC
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const vsdcResponse = await fetch(vsdcUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vsdcPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseData = await vsdcResponse.json();

      return NextResponse.json({
        success: responseData.resultCd === "000",
        resultCd: responseData.resultCd,
        resultMsg: responseData.resultMsg,
        resultDt: responseData.resultDt,
        data: responseData.data || null,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeout);

      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "VSDC device timed out. Ensure the device is running and accessible." },
          { status: 504 },
        );
      }

      return NextResponse.json(
        { error: `Failed to connect to VSDC device at ${body.config.baseUrl}. Ensure the device is running.` },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
