/// <reference path="./custom-typings.d.ts" />
import chai from './config';
import { configureAssertOverride } from './assert';
export { describe } from './describe';

export default chai;
export { configureAssertOverride };

export interface Config extends Chai.Config {
  truncateVariableThreshold: number;
  truncateMsgThreshold: number;
  aggregateChecks: boolean;
  logFailures: boolean;
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
