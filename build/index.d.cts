import chai from 'chai';
export { default } from 'chai';
import { check } from 'k6';

declare function configureAssertOverride({ customCheck }: {
    customCheck: typeof check | null;
}): void;

/**
 * Handle assertion grouping the K6 way
 */
declare function describe(name: string, fn: (...xs: unknown[]) => unknown): boolean;

interface Config extends Chai.Config {
    truncateVariableThreshold: number;
    truncateMsgThreshold: number;
    aggregateChecks: boolean;
    logFailures: boolean;
    exitOnError: boolean;
}
declare const expect: Chai.ExpectStatic;

export { type Config, configureAssertOverride, describe, expect };
