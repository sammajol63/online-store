// globals.d.ts
interface Window {
  snap: {
    pay: (token: string, options?: object) => void;
  };
}
