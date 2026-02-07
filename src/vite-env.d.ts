/// <reference types="vite/client" />
 
 // GTM dataLayer typing
 declare global {
   interface Window {
     dataLayer: Array<Record<string, unknown>>;
   }
 }
 
 export {};
