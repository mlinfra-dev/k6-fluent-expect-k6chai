/// <reference path="./custom-typings.d.ts" />
import chai from './config';
import { configureAssertOverride } from './assert';
export { describe } from './describe';

export default chai;
export { configureAssertOverride };

export interface Config extends Chai.Config {
  /**
   * Variables interpolated into check message are truncated to this length. It prevents mistakes when the check name is very large, especially when aggregateChecks is false.
   *
   * Default: 100
   */
  truncateVariableThreshold: number;
  /**
   * Check message length is truncated to this value.
   *
   * Default: 300
   */
  truncateMsgThreshold: number;
  /**
   * The actual values are not interpolated into the check message. Disable for tests with 1 iteration.
   *
   * Default: true
   */
  aggregateChecks: boolean;
  /**
   * When the check fails, debug messages are printed.
   *
   * Default: false
   */
  logFailures: boolean;
  /**
   * Aborts the test entirely
   *
   * Calls `exec.test.abort(truncatedExpectation);`, where `exec is 'k6/execution' module`
   *
   * Default: false
   */
  exitOnError: boolean;
}

function expect_fn(val: any, msg?: string): Chai.Assertion {
  const assertion = chai.expect(val, msg);
  // expect.message flag is set to signal the "intent" (the subject) of expect() chain
  // later assertions in that chain can set message flags to signal the "label" of the assertion
  // thus allowing: expect(message.uid, "message.uid").to.equal(user.uid, "user.uid");
  // to emit `expected message.uid to be equal to user.uid` instead of `expected message.uid to be equal to {number}`
  chai.util.flag(assertion, 'expect.message', msg);
  return assertion;
}
expect_fn.fail = chai.expect.fail;

export const expect = expect_fn as Chai.ExpectStatic;
