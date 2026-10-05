import { getSignalMoment, SIGNAL_TRANSMISSION_DURATION_MS, SIGNAL_MOMENTS } from "./signalTransmission";

describe("Signal 86 timeline", () => {
  it("moves through all four authored moments at their boundaries", () => {
    expect(getSignalMoment(0).id).toBe("wake");
    expect(getSignalMoment(5_599).id).toBe("wake");
    expect(getSignalMoment(5_600).id).toBe("tokens");
    expect(getSignalMoment(11_800).id).toBe("road");
    expect(getSignalMoment(18_200).id).toBe("continue");
    expect(getSignalMoment(SIGNAL_TRANSMISSION_DURATION_MS).id).toBe("continue");
    expect(SIGNAL_MOMENTS).toHaveLength(4);
  });
});
