// src/types/global.d.ts
/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}