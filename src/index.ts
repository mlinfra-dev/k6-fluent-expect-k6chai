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
export const expect = chai.expect;