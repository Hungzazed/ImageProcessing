export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a1020',
        aurora: {
          50: '#eefbf5',
          100: '#d6f5e3',
          200: '#adebc7',
          300: '#76dca6',
          400: '#39c67f',
          500: '#17a863',
          600: '#118350',
          700: '#0f6642',
          800: '#0f5337',
          900: '#0d442f',
        },
        copper: {
          400: '#f4b183',
          500: '#ea8d5d',
          600: '#d96d3b',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px rgba(15, 23, 42, 0.55)',
      },
      backgroundImage: {
        'radial-soft': 'radial-gradient(circle at top left, rgba(23, 168, 99, 0.28), transparent 36%), radial-gradient(circle at top right, rgba(234, 141, 93, 0.18), transparent 30%), linear-gradient(180deg, #07111f 0%, #0a1020 48%, #050912 100%)',
      },
    },
  },
  plugins: [],
};
