// Tailwind v4 ships its PostCSS plugin as a separate package and handles vendor
// prefixing internally (via Lightning CSS), so autoprefixer is no longer needed.
export default { plugins: { "@tailwindcss/postcss": {} } };
