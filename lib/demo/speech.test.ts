import { describe, expect, it } from "vitest";
import { spokenText } from "./speech";

describe("spoken captions", () => {
  it("says amounts, codes, references and minus signs the way a person would", () => {
    expect(spokenText("Total to repay ₹45 by 14 Nov.")).toBe("Total to repay 45 rupees by 14 Nov.");
    expect(spokenText("Declined (PRIOR_DEFAULT_CAP): capped at 500 coins.")).toBe("Declined (prior default cap): capped at 500 coins.");
    expect(spokenText("The lending partner paid it. Reference UTR0123456789.")).toBe("The lending partner paid it. Reference a bank reference.");
    expect(spokenText("Aura 56 to 52. -4: Repaid 6 days after the due date.")).toBe("Aura 56 to 52. minus 4: Repaid 6 days after the due date.");
    expect(spokenText("Settlement SET-ven-gupta-chai-20261030 is paid")).toBe("Settlement the settlement is paid");
  });
  it("leaves plain sentences alone", () => {
    expect(spokenText("Aarav scans Gupta Chai Tapri's QR.")).toBe("Aarav scans Gupta Chai Tapri's QR.");
  });
});
