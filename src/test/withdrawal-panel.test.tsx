import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ validate: vi.fn(), mutate: vi.fn() }));
vi.mock("@/app/data/api", () => ({ validatePickupCode: mocks.validate }));
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: mocks.mutate }) }));
import ValidatePanel from "@/app/components/admin/ValidatePanel";

describe("withdrawal submission", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);
  it("allows only one request while processing and refreshes after completion", async () => {
    let complete: (value: unknown) => void = () => {
      throw new Error("not initialized");
    };
    mocks.validate.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<ValidatePanel refresh={refresh} />);
    fireEvent.change(screen.getByLabelText(/Código/), { target: { value: "K7QM-4XPA" } });
    const form = container.querySelector("form");
    if (!form) throw new Error("Missing form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(mocks.validate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toBeDisabled();
    complete({ itemRef: "OBJ-TEST", itemName: "Caderno", claimant: "Test" });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
  it("keeps failed input for correction and permits retry without reloading", async () => {
    mocks.validate
      .mockRejectedValueOnce(new Error("Invalid code"))
      .mockResolvedValueOnce({ itemRef: "OBJ-TEST", itemName: "Caderno", claimant: "Test" });
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<ValidatePanel refresh={refresh} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "K7QM-4XPA" } });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("K7QM-4XPA");
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(mocks.validate).toHaveBeenCalledTimes(2);
  });
  it("does not report a completed withdrawal as failed if refreshing fails", async () => {
    mocks.validate.mockResolvedValue({
      itemRef: "OBJ-TEST",
      itemName: "Caderno",
      claimant: "Test",
    });
    render(<ValidatePanel refresh={vi.fn().mockRejectedValue(new Error("offline"))} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "K7QM-4XPA" } });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(mocks.validate).toHaveBeenCalledTimes(1);
  });
});
