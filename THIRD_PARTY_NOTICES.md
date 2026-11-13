# Third-party notices

## Astro Theme Pure

Local code was adapted from `astro-pure` version 1.4.9 by CWorld, published from
https://github.com/cworld1/astro-theme-pure/tree/main/packages/pure under Apache License 2.0.
The original license is retained in [LICENSE-astro-pure](LICENSE-astro-pure).

Derived modules are in `src/components/ui/`, `src/components/content/`,
`src/components/site/`, `src/components/search/`, `src/config/`, `src/lib/`,
`src/types/site.ts`, and the migrated Remark, external-link, image-caption and
SVG attribute plugins in `src/plugins/`.

Local modifications include project-specific module paths and component boundaries,
explicit configuration and integrations, bundled image/QR dependencies,
network fallback and component lifecycle handling, typed quote transforms,
theme preference handling, and regression tests. The local search build integration
uses Pagefind's public API directly.

Upstream source references for utilities adapted from other projects remain in their
respective files. Existing project design and source attributions are preserved.

## Duckquill

Table, alert, equation, code-block and diagram styling take inspiration from
[Duckquill](https://codeberg.org/daudix/duckquill) by Daudix (MIT license).
The local implementation adapts the design to Astro and the project's theme tokens;
it does not use Zola components or shortcodes. The upstream license is retained in
[LICENSE-duckquill](LICENSE-duckquill).
