// Type declarations for Vite raw imports
declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*.txt?raw" {
  const content: string;
  export default content;
}
