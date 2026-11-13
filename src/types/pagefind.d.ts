declare module '@pagefind/default-ui' {
  export interface SearchResult {
    url: string
    sub_results: Array<{ url: string; [key: string]: unknown }>
    [key: string]: unknown
  }
  export class PagefindUI {
    constructor(options: {
      element: string
      baseUrl: string
      bundlePath: string
      showImages: boolean
      showSubResults: boolean
      processResult: (result: SearchResult) => SearchResult
    })
    destroy(): void
  }
}
