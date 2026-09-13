// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// jsdom doesn't implement these — framer-motion's whileInView and the
// scroll-spy/reduced-motion hooks all depend on them being present.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = window.IntersectionObserver || MockIntersectionObserver;

class MockMutationObserver {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
window.MutationObserver = window.MutationObserver || MockMutationObserver;

window.matchMedia =
  window.matchMedia ||
  function matchMedia() {
    return {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    };
  };

// jsdom has no canvas backend. The particle field and confetti already bail
// out when getContext returns null, but a no-op 2D context lets those code
// paths actually run under test instead of being skipped.
if (!HTMLCanvasElement.prototype.getContext.__mocked) {
  const noop = () => {};
  const mockContext = {
    setTransform: noop,
    clearRect: noop,
    fillRect: noop,
    beginPath: noop,
    arc: noop,
    fill: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };
  const getContext = function getContextMock() {
    return mockContext;
  };
  getContext.__mocked = true;
  HTMLCanvasElement.prototype.getContext = getContext;
}

// The sound library is opt-in and off by default, so this only guards against
// an accidental construction during a test.
window.AudioContext =
  window.AudioContext ||
  class MockAudioContext {
    constructor() {
      this.currentTime = 0;
      this.state = "running";
      this.destination = {};
    }
    createOscillator() {
      return {
        type: "sine",
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {
          return { connect() {} };
        },
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {
          return { connect() {} };
        },
      };
    }
    resume() {
      return Promise.resolve();
    }
  };

// Clipboard is used by the contact section's copy button.
if (!navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    writable: true,
  });
}
