declare global {
  interface Window {
    YT?: import('youtube').YT
  }
}

export * from 'youtube'

export { YT } from 'youtube'
