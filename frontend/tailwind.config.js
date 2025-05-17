/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        success: '#45b86d',
        pending: '#dad800',
        second: '#d78a54',
        third: '#fdf7e7',
        fourth: '#fffaed',
        fiveth: '#070709',
        sixth: '#efefef',
        seventh: '#bdbfba',
        eight: '#fdfdfd',
        colortrs: '#ffffffce',
        transparant:'#0f0f0f77',
        transparant2:'#f3f3f300',
        yellowshade: '#ffd000',
      },
    },
  },
    plugins: [
    require('flowbite/plugin')
  ],
}