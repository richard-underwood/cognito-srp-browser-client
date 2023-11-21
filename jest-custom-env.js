const JSDomEnvironment = require('jest-environment-jsdom').TestEnvironment;

module.exports = class CustomTestEnvironment extends JSDomEnvironment {
  async setup() {
    await super.setup();
    if (typeof this.global.crypto.subtle === 'undefined') {
      const { subtle } = require('crypto');
      this.global.crypto.subtle = subtle;
    }
  }
};
