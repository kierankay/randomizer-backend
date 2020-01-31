
class typeValidation {
    static checkArray(arr, varName) {
        if (!Array.isArray(arr)) {
            throw new Error(`${studentsList} must be an array`);
        }
    }

    static isNum(num, numName) {
        if (isNaN(num)) {
            throw new Error(`${numName} must be an integer`);
        }
    }
}

module.exports = typeValidation;