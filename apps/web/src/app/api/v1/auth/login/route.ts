import { authenticate } from "@/server/auth/endpoint";
export async function POST(request: Request) {
  return authenticate(request);
}
