import { jsonError, jsonOk } from "@/server/http";
import { assertCronAuthorized, runRetentionJob } from "@/server/jobs/retention";

export async function POST(request: Request) {
  try {
    assertCronAuthorized(request);
    const result = await runRetentionJob();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
