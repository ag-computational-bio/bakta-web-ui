declare module 'igv' {
  function createBrowser(element: HTMLElement, config: unknown): Promise<IGVBrowser>
  function removeBrowser(element: IGVBrowser): void

  interface IGVBrowser {
    visibilityChange(): void
  }
}
