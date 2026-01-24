import { check, Checkers } from 'k6';
import exec from 'k6/execution';
import { Assert, AssertionArgs } from './types';
import chai from './config';
import { isFunction, regexTag, truncate } from './utils';

let customAssertCheck: typeof check | null = null;
function assertCheck<VT>(val: VT, sets: Checkers<VT>, tags?: object): boolean {
  if (customAssertCheck) {
    return customAssertCheck(val, sets, tags);
  }
  return check(val, sets, tags);
}
export function configureAssertOverride({
  customCheck
}: {
  customCheck: typeof check | null;
}) {
  customAssertCheck = customCheck;
}

const getObjectDisplay = (obj: object) => {
  return chai.util.objDisplay(obj) as unknown as string;
};

const truncateByVariableThreshold = (str: string) => {
  return truncate(str, chai.config.truncateVariableThreshold);
};

/**
 * Create the base expectation message template
 *
 * Example: "expected #{this} to be above 4"
 */
function createExpectationTemplate(context: object, params: AssertionArgs) {
  const [expression, successMessage, failureMessage, expected] = params;
  const negate = chai.util.flag(context, 'negate');
  const anonymizeMsgFunction = chai.util.flag(context, 'anonymizeMsgFunction');

  let message = negate ? failureMessage : successMessage;
  message = message || '';

  // Chai only prints messages when something fails, for this reason phrasing is often
  // assuming failure. k6 wants to collect both failed and successful checks so messages must be
  // neutral. for this reason we are changing the phrasing from
  //    expected { a: 1, b: 2, c: 3 } to have property 'b' of 2, but got 2
  // to expected { a: 1, b: 2, c: 3 } to have property 'b' of 2, got 2
  message = message.replace('but ', '');

  if (anonymizeMsgFunction) {
    message = anonymizeMsgFunction(message);
  }

  if (isFunction(message)) {
    message = message();
  }

  message = message || '';
  // dont replace {exp} tag just yet!
  // message = message.replace(regexTag('exp'), () =>
  //   truncateByVariableThreshold(getObjectDisplay(expected))
  // );

  return message;
}

/**
 * Create the final expectation message
 *
 * Example: "Number of crocs: expected 8 to be above 4"
 */
function createExpectationText(
  context: object,
  str = '',
  params: AssertionArgs
) {
  const object = chai.util.flag(context, 'object');
  const actual = chai.util.getActual(context, params);
  const message = chai.util.flag(context, 'message');

  const expected = params[3];

  let result = str
    .replace(regexTag('this'), () =>
      truncateByVariableThreshold(getObjectDisplay(object))
    )
    .replace(regexTag('act'), () =>
      truncateByVariableThreshold(getObjectDisplay(actual))
    )
    .replace(regexTag('exp'), () =>
      truncateByVariableThreshold(getObjectDisplay(expected))
    );

  if (message && !chai.config.aggregateChecks) {
    result = message ? message + ': ' + result : result;
  }

  return result;
}

/**
 * Create the test name
 *
 * Example: "expected Number of crocs to be above 4"
 */
function createTestName(context: object, str = '', expected: any) {
  const expectMessage = chai.util.flag(context, 'expect.message');
  const message = chai.util.flag(context, 'message');

  const subject = expectMessage || message || '${this}';

  let label: any = null;
  if (message && message !== subject) {
    label = message;
  }

  let testName = str
    .replace(regexTag('this'), () => subject)
    .replace(regexTag('act'), () => '${actual}');

  if (testName.includes("#{exp}")) {
    testName = testName.replace(regexTag('exp'), () => {
      if (label) return label;
      return truncateByVariableThreshold(getObjectDisplay(expected));
    });
  } else {
    // no #{exp} templating, data might have been baked
    if (label && (expected === null || expected === undefined)) {
      testName = scrubBakedDataWithLabel(testName, label);
    }
  }

  return truncateByVariableThreshold(testName);
}


function scrubBakedDataWithLabel(testName: string, label: string) {
  if (label) {
    // We can just iterate a list of regexes that target the END of the string.
    // This is safer than checking 'expected == null' because some methods (like .keys) 
    // DO pass expected but still bake the message.

    const scrubbers = [
      /(?:include|contain) .+$/, // .include('foo')
      /match .+$/,               // .match(/foo/)
      /close to .+$/,            // .closeTo(1, 0.1)
      /within .+$/,              // .within(1, 10)
      /by .+$/,                  // .by(5)
      /respond to .+$/,          // .respondTo('foo')
      /have (?:deep )?(?:own )?(?:nested )?property .+$/, // .property('foo')
      /keys .+$/                 // .keys('a', 'b')
    ];

    for (const regex of scrubbers) {
      if (regex.test(testName)) {
        // Example: "expected x to include 'admin'"
        // Match: "include 'admin'"
        // Replace with: "include {label}"

        testName = testName.replace(regex, (match) => {
          // Extract the verb (first word or known prefix)
          // Simple hack: take everything up to the first space of the match
          // "close to 1 +/- 0.5" -> verb is "close to"

          let verb = match.split(' ')[0];

          // Specific fixups for multi-word verbs
          if (match.startsWith("close to")) verb = "close to";
          if (match.startsWith("respond to")) verb = "respond to";
          if (match.startsWith("have property") || match.includes("property")) verb = "have property"; // simplistic

          // Actually, simpler approach:
          // Just look for the keywords in the match string
          if (match.includes("include") || match.includes("contain")) return `include ${label}`;
          if (match.includes("match")) return `match ${label}`;
          if (match.includes("close to")) return `close to ${label}`;
          if (match.includes("within")) return `within ${label}`;
          if (match.includes("by")) return `by ${label}`;
          if (match.includes("respond to")) return `respond to ${label}`;
          if (match.includes("keys")) return `have keys ${label}`;
          if (match.includes("property")) {
            // Preserve "have property" vs "not have property" logic from start of string?
            // The regex matches the END. 
            // "have property 'foo'" -> "have property {label}"
            return `have property ${label}`;
          }

          return match; // Fallback
        });
        break; // Stop after first match
      }
    }
  }
  return testName;
}


/**
 * Overriding Chai's main assert() function to inject check() calls for both
 * successful and failed assertions.
 *
 * The original chai.util.getMessage did not truncate strings.
 * We are overriding it to prevent users from shooting themselves in the foot by
 * asserting large request.body and getting it printed on the terminal as a check message.
 */
export function assert(): Assert {
  return function (
    expression,
    successMessage,
    failureMessage,
    expected,
    _actual,
    showDiff
  ) {
    showDiff = !expected && !_actual;

    const context = this as object;
    const params: AssertionArgs = [
      expression,
      successMessage,
      failureMessage,
      expected,
      _actual,
      showDiff
    ];

    const ok = chai.util.test(context, params);
    const actual = chai.util.getActual(context, params);

    console.log('assert', {
      expression,
      successMessage,
      failureMessage,
      expected,
      _actual,
      showDiff,
      ok,
      actual,
      context
    });

    const template = createExpectationTemplate(context, params);
    const testExpectation = createExpectationText(context, template, params);

    const testName = chai.config.aggregateChecks
      ? createTestName(context, template, expected)
      : testExpectation;

    if (testName) {
      assertCheck(null, {
        [testName]: () => ok
      });
    }
    if (!ok) {
      const truncatedExpectation = truncateByVariableThreshold(testExpectation);
      const operator = chai.util.getOperator(context, params);

      const error = {
        actual,
        expected,
        showDiff,
        operator
      };

      if (chai.config.logFailures) {
        console.warn(truncatedExpectation);
      }

      if (chai.config.exitOnError) {
        exec.test.abort(truncatedExpectation);
      }

      throw new chai.AssertionError(
        truncatedExpectation,
        error,
        chai.config.includeStack ? chai.assert : chai.util.flag(context, 'ssfi')
      );
    }
  };
}
