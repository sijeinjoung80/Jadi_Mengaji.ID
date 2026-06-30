// Local override to solve the npm deprecated node-domexception warning.
// Node.js 18+ and browsers have DOMException natively built-in.
const NativeDOMException = typeof globalThis.DOMException !== 'undefined'
  ? globalThis.DOMException
  : (() => {
      // Small fallback in case of older platforms
      return class DOMException extends Error {
        constructor(message, name) {
          super(message);
          this.name = name || 'Error';
        }
      };
    })();

module.exports = NativeDOMException;
