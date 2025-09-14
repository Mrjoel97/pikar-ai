declare module "vitest" {
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const afterEach: any;
}

declare module "@testing-library/react" {
  export const cleanup: any;
}

declare module "@testing-library/jest-dom/matchers" {
  const matchers: any;
  export = matchers;
}
