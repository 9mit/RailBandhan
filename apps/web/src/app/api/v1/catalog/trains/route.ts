import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/server/http";
import { clientAddress, rateLimit } from "@/server/rate-limit";
import { getStore } from "@/server/store";
export async function GET(request: Request) {
  try {
    if (
      !(await rateLimit(`catalog:${clientAddress(request)}`, 120, 60000))
        .allowed
    )
      throw new AppError("rate_limited", "Please wait before trying again");
    const trains = await getStore().listTrains();
    return jsonOk({
      trains: trains
        .slice(0, 200)
        .map((t) => ({ id: t.id, number: t.number, name: t.name })),
    });
  } catch (e) {
    return jsonError(e);
  }
}
