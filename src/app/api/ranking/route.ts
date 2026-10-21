import {
  rankingResponse,
  methodNotAllowed,
} from "@/infrastructure/http/results-handlers";
import { createResultRepository } from "@/infrastructure/supabase/server-client";

export function GET() {
  return rankingResponse(createResultRepository);
}
export function POST() {
  return methodNotAllowed("GET");
}
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;
export const HEAD = POST;
export const OPTIONS = POST;
