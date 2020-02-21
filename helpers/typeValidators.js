
class typeValidation {
  static checkArray(arr, varName) {
    if (!Array.isArray(arr)) {
      throw new Error(`${varName} must be an array`);
    }
  }

  static isNum(num, numName) {
    if (Number.isNaN(num)) {
      throw new Error(`${numName} must be an integer`);
    }
  }
}

module.exports = typeValidation;
