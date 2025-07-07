import pMap from 'p-map';
import { eventLoopSpinner } from 'event-loop-spinner';
/** Run a function each element in an array, with some level of concurrency.
 *
 * Defaults to a small, finite concurrency, so as to not to "overload" the database
 * connection pool or the http client, both of which have small, internal limits.
 *
 * Can be used with async functions that don't yield; will yield for you, if necessary.
 */
export async function cMap(input, mapper, options) {
    var _a;
    const concurrency = (_a = options === null || options === void 0 ? void 0 : options.concurrency) !== null && _a !== void 0 ? _a : 6;
    return await pMap(input, async (from) => {
        if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
        }
        return await mapper(from);
    }, { concurrency });
}
//# sourceMappingURL=c-map.js.map