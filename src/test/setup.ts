import '@testing-library/jest-dom';

// Mantine uses window.matchMedia for color scheme detection — not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mantine Select (Combobox) ScrollArea uses ResizeObserver — not available in jsdom
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mantine Combobox calls scrollIntoView on option elements — not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = () => {};
