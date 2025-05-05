import "@testing-library/jest-dom";
import { beforeAll, afterEach, vi } from "vitest";

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  global.IntersectionObserver = vi.fn().mockImplementation(function () {
    return {
      root: null,
      rootMargin: "",
      thresholds: [],
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn().mockReturnValue([]),
    };
  }) as unknown as typeof IntersectionObserver;

  global.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, "innerWidth", {
    writable: true,
    value: 1024,
  });

  vi.mock("peerjs", () => {
    const Peer = vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      connect: vi.fn().mockReturnValue({
        on: vi.fn(),
        send: vi.fn(),
      }),
      id: "mock-peer-id",
      destroy: vi.fn(),
    }));
    return { Peer };
  });

  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
    removeItem: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  global.localStorage = localStorageMock as any;
});

afterEach(() => {
  vi.clearAllMocks();
});
