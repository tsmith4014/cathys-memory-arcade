export type Signal = {
  track: string;
  title: string;
  url: string;
  source: string;
  published: string;
};

export type SignalPayload = {
  generatedAt: string;
  signals: Signal[];
};
