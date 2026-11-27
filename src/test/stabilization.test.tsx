import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { AuthContext, useAuth, type AuthContextValue } from "@/app/auth/auth-context";
import { validateImage } from "@/app/lib/imageTools";

afterEach(cleanup);

describe("authentication context stability", () => {
  it("stays safely loading when a provider is temporarily absent", () => {
    let value: AuthContextValue | undefined;
    function Probe() {
      value = useAuth();
      return null;
    }
    render(<Probe />);
    expect(value).toMatchObject({ user: null, isStaff: false, loading: true });
  });

  it("never returns null if a provider loses its value during an update", () => {
    let value: AuthContextValue | undefined;
    function Probe() {
      value = useAuth();
      return null;
    }
    render(
      <AuthContext.Provider value={null as unknown as AuthContextValue}>
        <Probe />
      </AuthContext.Provider>,
    );
    expect(value).toMatchObject({ user: null, isStaff: false, loading: true });
  });
});

describe("typed image validation", () => {
  it("accepts the supported photo formats", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateImage(new File(["photo"], "photo", { type }))).toBeNull();
    }
  });

  it("rejects non-image uploads", () => {
    expect(validateImage(new File(["data"], "file.txt", { type: "text/plain" }))).not.toBeNull();
  });
});
