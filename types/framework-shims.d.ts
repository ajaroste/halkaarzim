declare const process: { env: Record<string, string | undefined> };

declare namespace React {
  type ReactNode = any;
  type CSSProperties = Record<string, string | number | undefined>;
}
declare namespace JSX {
  interface IntrinsicAttributes { key?: any }
  interface IntrinsicElements { [elemName: string]: any }
}

declare module "react" {
  export type CSSProperties = Record<string, string | number | undefined>;
  export type FormEvent<T = any> = {
    currentTarget: T;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
  };
  export type ChangeEvent<T = any> = {
    currentTarget: T;
    target: T;
    preventDefault(): void;
    stopPropagation(): void;
  };
  export type MouseEvent<T = any> = {
    currentTarget: T;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
  };
  export interface Context<T> { Provider: any; Consumer: any; }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useState<T>(initial: T): [T, (next: T | ((value: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useRef<T>(initial: T): { current: T };
}
declare module "react/jsx-runtime" { export const jsx: any; export const jsxs: any; export const Fragment: any; }
declare module "next" {
  export type Metadata = any;
  export type Viewport = any;
  export type NextConfig = any;
  export namespace MetadataRoute { type Robots = any; type Sitemap = any; }
}
declare module "next/link" { const Link: (props: any) => any; export default Link; }
declare module "next/script" { const Script: (props: any) => any; export default Script; }
declare module "next/navigation" { export function notFound(): never; }
declare module "next/server" { export const NextResponse: any; }
declare module "next/*" { const value: any; export default value; }
