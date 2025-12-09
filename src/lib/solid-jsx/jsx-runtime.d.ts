import * as solid_js from 'solid-js'
import { JSX, ParentProps, JSXElement } from 'solid-js'

declare const MDXContext: solid_js.Context<Record<string, (properties_: never) => JSX.Element>>
declare const MDXProvider: (
  properties: ParentProps<{
    components: Record<string, (properties_: never) => JSX.Element>
  }>
) => JSXElement
declare const useMDXComponents: (
  components: Record<string, (properties_: never) => JSX.Element>
) => Record<string, (properties_: never) => JSX.Element>
declare const Fragment: (properties: ParentProps) => JSX.Element
declare const jsx: (
  type: string | ((properties_: ParentProps) => JSX.Element),
  properties: ParentProps
) => JSX.Element
declare const jsxs: (
  type: string | ((properties_: ParentProps) => JSX.Element),
  properties: ParentProps
) => JSX.Element
declare const jsxDEV: (
  type: string | ((properties_: ParentProps) => JSX.Element),
  properties: ParentProps
) => JSX.Element

export { Fragment, MDXContext, MDXProvider, jsx, jsxDEV, jsxs, useMDXComponents }
