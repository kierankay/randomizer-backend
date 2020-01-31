function checkArray(arr, varName) {
    if (!Array.isArray(arr)) {
        throw new Error(`${studentsList} must be an array`);
    }
}

function checkNum(num, numName) {
    if (isNaN(num)) {
        throw new Error(`${numName} must be an integer`);
    }
}

module.exports = {
    checkArray,
    checkNum
}