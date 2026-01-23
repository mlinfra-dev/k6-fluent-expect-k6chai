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
  chai.util.flag(assertion, 'expect.message', msg);
  return assertion;
}
expect_fn.fail = chai.expect.fail;

export const expect = expect_fn as Chai.ExpectStatic;
