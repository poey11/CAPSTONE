import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"],
    rules: {
      // Disable the whitespace text nodes rule
      "react/jsx-no-comment-textnodes": "off",
      "react/jsx-no-useless-fragment": "off",

      // Disable Next.js hydration whitespace error globally
      "@next/next/no-html-link-for-pages": "off",
    },
  }
];

export default eslintConfig;
