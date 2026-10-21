import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/application/**",
                "@/infrastructure/**",
                "@/presentation/**",
                "next/**",
                "react",
                "react/**",
              ],
              message: "El dominio no puede depender de capas exteriores.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/infrastructure/**",
                "@/presentation/**",
                "next/**",
                "react",
                "react/**",
              ],
              message:
                "La aplicación solo puede depender del dominio y de sus propios contratos.",
            },
          ],
        },
      ],
    },
  },
]);
