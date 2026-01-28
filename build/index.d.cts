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
declare const expect: Chai.ExpectStatic;

export { type Config, configureAssertOverride, describe, expect };
