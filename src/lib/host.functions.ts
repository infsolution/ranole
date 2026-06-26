import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";

/* Returns the incoming Host header during SSR; null on the client. */
export const getCurrentHost = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const h = getRequestHost();
    return h ? h.toLowerCase().replace(/:\d+$/, "") : null;
  } catch {
    return null;
  }
});
