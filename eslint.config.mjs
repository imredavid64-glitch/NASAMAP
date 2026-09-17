import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

export default defineConfig([
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "package-lock.json"],
  },
  {
    plugins: { "@next/next": nextPlugin, react: reactPlugin, "react-hooks": hooksPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...reactPlugin.configs.flat["recommended"].rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
]);