import QRCode from "qrcode";
import {
  checkInQrConfigured,
  signCheckInToken,
} from "@/lib/checkin-token";

export async function renderPersoneroQrDataUrl(
  registroId: string,
): Promise<string | null> {
  if (!checkInQrConfigured()) return null;
  const token = signCheckInToken(registroId);
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
    color: { dark: "#0b2a36", light: "#ffffff" },
  });
}
