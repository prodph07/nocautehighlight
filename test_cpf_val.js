const isValid = (cpf) => {
    cpf = cpf.replace(/[^\\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\\d)\\1{10}/)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};

console.log("08553402070: ", isValid("08553402070"));
const formatted = "085.534.020-70".replace(/\\D/g, '')
    .replace(/(\\d{3})(\\d)/, '$1.$2')
    .replace(/(\\d{3})(\\d)/, '$1.$2')
    .replace(/(\\d{3})(\\d{1,2})$/, '$1-$2')
    .substring(0, 14);
console.log("formatted length:", formatted.length, formatted);
console.log("085.534.020-70 valid?", isValid(formatted));
