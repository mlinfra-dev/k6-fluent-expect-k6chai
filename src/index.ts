/// <reference path="./custom-typings.d.ts" />
import chai from './config';
import { configureAssertOverride } from './assert';
export { describe } from './describe';

export default chai;
export { configureAssertOverride };
export interface Assertion extends Chai.Assertion {
}

export const expect = (val: any, message?: string): Assertion => {
    return chai.expect(val, message) as unknown as Assertion;
};