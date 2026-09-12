import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseJsonObject } from "../_shared/json.ts";

Deno.test("rejects a response without a JSON object", () => {
  assertEquals(parseJsonObject("I cannot identify this package."), null);
});