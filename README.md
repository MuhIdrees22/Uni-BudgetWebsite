# UniBudget - Student Expense Tracker

A modern, responsive web application for tracking student expenses, generated from Figma design.

## Features

- **Dashboard Overview**: View total balance, income, expenses, and remaining budget
- **Expense Breakdown**: Visual representation of spending categories with color-coded chart
- **Recent Transactions**: Table view of latest financial transactions
- **Navigation**: Clean sidebar navigation for Dashboard, Add Expense, Reports, and Settings
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Design Details

This HTML/CSS implementation faithfully recreates the Figma design with:
- Roboto font family
- Blue color scheme (#2563EB primary, #3B82F6 accent)
- 17px border radius for modern card design
- Box shadows for depth and visual hierarchy
- Hover effects and smooth transitions

## File Structure

```
unibudget-website/
├── index.html          # Main HTML file with embedded CSS
├── package.json        # Project configuration
└── README.md          # This file
```

## Getting Started

### Option 1: Simple HTTP Server
```bash
npm run start
# or
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### Option 2: Live Server (with auto-reload)
```bash
npm install
npm run dev
```
Then open `http://localhost:3000` in your browser.

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Customization

The design uses embedded CSS for simplicity. To customize:
1. Edit the `<style>` section in `index.html`
2. Modify colors, fonts, spacing, or layout as needed
3. Update content in the HTML structure

## Generated From

This code was automatically generated from the Figma design at:
https://www.figma.com/design/a0uxTuFn6mapPuy82qDfY2/UniBudget

## License

MIT License - feel free to use and modify for your projects.
