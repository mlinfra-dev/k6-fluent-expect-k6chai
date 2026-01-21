/// <reference path="./custom-typings.d.ts" />
import chai from './config';
import { configureAssertOverride } from './assert';
export { describe } from './describe';

export default chai;
export const expect = chai.expect;
export { configureAssertOverride };
