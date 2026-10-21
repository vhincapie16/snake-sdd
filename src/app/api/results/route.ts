import {
  postResult,
  methodNotAllowed,
} from "@/infrastructure/http/results-handlers";
import { createResultRepository } from "@/infrastructure/supabase/server-client";

export function POST(request: Request) {
  return postResult(request, createResultRepository);
}
export function GET() {
  return methodNotAllowed("POST");
}
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const HEAD = GET;
export const OPTIONS = GET;
