import { describe, expect, it, beforeEach } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import { WorkspaceProvider, useWorkspace } from "./store";

function wrapper({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}

describe("WorkspaceProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("hydrates to an empty workspace and marks hydrated=true", async () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    // useEffect runs after mount
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.projects).toEqual([]);
    expect(result.current.activity).toEqual([]);
    expect(result.current.hydrated).toBe(true);
  });

  it("createProject appends a project and writes an activity item", async () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });

    let id = "";
    act(() => {
      id = result.current.createProject("Launch Campaign", "Fall drop");
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toMatchObject({
      id,
      name: "Launch Campaign",
      description: "Fall drop",
      items: [],
    });
    expect(result.current.activity[0]).toMatchObject({
      type: "project-created",
      title: expect.stringContaining("Launch Campaign"),
    });
  });

  it("addItemToProject dedupes on (type, id)", async () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });

    let id = "";
    act(() => {
      id = result.current.createProject("P");
    });

    act(() => {
      result.current.addItemToProject(id, {
        type: "prompt",
        id: "p1",
        title: "Prompt one",
      });
      result.current.addItemToProject(id, {
        type: "prompt",
        id: "p1",
        title: "Prompt one",
      });
    });

    expect(result.current.projects[0].items).toHaveLength(1);
  });

  it("deleteProject removes it and preserves other projects", async () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });

    let keptId = "";
    let removedId = "";
    act(() => {
      keptId = result.current.createProject("Keep");
      removedId = result.current.createProject("Remove");
    });

    act(() => {
      result.current.deleteProject(removedId);
    });

    expect(result.current.projects.map((p) => p.id)).toEqual([keptId]);
  });

  it("caps activity at 50 items", async () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.recordActivity(
          "chat-sent",
          `Msg ${i}`,
          "assistant",
          "/assistant",
        );
      }
    });

    expect(result.current.activity).toHaveLength(50);
  });

  it("throws when useWorkspace is used outside a provider", () => {
    // Suppress the expected error log for cleaner output
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<TestConsumer />)).toThrow(
      /useWorkspace must be used within/,
    );
    console.error = originalError;
  });
});

function TestConsumer() {
  useWorkspace();
  return null;
}
