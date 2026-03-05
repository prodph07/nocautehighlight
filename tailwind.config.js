/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                heading: ['Oswald', 'sans-serif'],
            },
            colors: {
                brand: {
                    red: '#dc2626', // red-600
                    orange: '#f97316', // orange-500
                    dark: '#111111',
                    border: '#333333',
                }
            }
        },
    },
    plugins: [],
}
