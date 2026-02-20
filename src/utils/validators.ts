/**
 * Formats a string to standard CPF pattern: 000.000.000-00
 */
export const formatCPF = (value: string) => {
    return value
        .replace(/\\D/g, '') // Remove non-digits
        .replace(/(\\d{3})(\\d)/, '$1.$2')
        .replace(/(\\d{3})(\\d)/, '$1.$2')
        .replace(/(\\d{3})(\\d{1,2})$/, '$1-$2')
        .substring(0, 14); // Limit to max length
};

/**
 * Validates a CPF using the standard mathematical algorithm
 */
export const isValidCPF = (cpf: string) => {
    if (typeof cpf !== 'string') return false;

    // Clean to strictly numbers
    cpf = cpf.replace(/\\D+/g, '');

    if (cpf.length !== 11 || !!cpf.match(/(\\d)\\1{10}/)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10), 10)) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11), 10)) return false;

    return true;
};
