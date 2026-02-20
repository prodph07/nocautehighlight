const isValid = (cpf) => {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\\d]+/g, '');
    console.log("Cleaned CPF:", cpf);
    if (cpf.length !== 11 || !!cpf.match(/(\\d)\\1{10}/)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        let digit = parseInt(cpf.substring(i - 1, i), 10);
        sum = sum + digit * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;

    let d10 = parseInt(cpf.substring(9, 10), 10);
    console.log("sum1", sum, "rem1", remainder, "d10", d10);
    if (remainder !== d10) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        let digit = parseInt(cpf.substring(i - 1, i), 10);
        sum = sum + digit * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;

    let d11 = parseInt(cpf.substring(10, 11), 10);
    console.log("sum2", sum, "rem2", remainder, "d11", d11);
    if (remainder !== d11) return false;

    return true;
};

console.log("Is valid?", isValid("08553402070"));
