module.exports.defer = () => {
    let resolve;
    let reject;

    const promise = new Promise((resolveFn, rejectFn) => {
        resolve = resolveFn;
        reject = rejectFn
    })

    return {
        promise,
        resolve,
        reject
    };
}