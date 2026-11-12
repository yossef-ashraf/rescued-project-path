import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// The original app's addresses (including capitalised ones such as /Pulse) must keep opening a page.
describe("Original app addresses", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  const leaf = (path: string) => router.matchRoutes(path).at(-1)?.routeId;

  it.each([
    ["/Pulse", "/pulse"],
    ["/Timeline", "/timeline"],
    ["/tasks/todo", "/tasks/todo"],
    ["/courses/12/lessons/3", "/courses/$id/lessons/$lessonId"],
    ["/courses/materials/7", "/courses/materials/$id/"],
    ["/share/s/abc123", "/share/s/$token"],
    ["/months", "/months"],
  ])("%s opens %s", (path, routeId) => {
    expect(leaf(path)).toBe(routeId);
  });

  it("does not fall back to not-found for the settings users page", () => {
    expect(leaf("/settings/users")).not.toBe(rootRouteId);
  });
});
