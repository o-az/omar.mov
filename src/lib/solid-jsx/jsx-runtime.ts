import {
  type JSX,
  mergeProps,
  useContext,
  createContext,
  createComponent,
  type JSXElement,
  type ParentProps
} from 'solid-js'
import { Dynamic, isServer } from 'solid-js/web'
import { isFirstLetterCapital, isSVGElement, normalizeKeySvg } from './utilities.ts'

export const MDXContext = createContext<Record<string, (properties_: never) => JSX.Element>>(
  Object.create(null) as Record<string, never>
)

export const MDXProvider = (
  properties: ParentProps<{
    components: Record<string, (properties_: never) => JSX.Element>
  }>
): JSXElement => {
  const context = useContext(MDXContext)
  return createComponent(MDXContext.Provider, {
    get value() {
      return {
        ...context,
        ...properties.components
      }
    },
    get children() {
      return properties.children
    }
  })
}

export const useMDXComponents = (
  components: Record<string, (properties_: never) => JSX.Element>
): Record<string, (properties_: never) => JSX.Element> => {
  const contextComponents = useContext(MDXContext)
  return { ...contextComponents, ...components }
}

const REPLACED_COMPAT_SET = new Set(['mjx'])
const compatRegExp = new RegExp(`(?:${[...REPLACED_COMPAT_SET].join('|')})-.+`, 'g')

const expressionCache = Object.create(null) as Record<string, string>
const replaceDashWithUnderscore = <T>(expression: T): string | T =>
  typeof expression === 'string'
    ? (expressionCache[expression] ??
      (expressionCache[expression] = expression.replaceAll(compatRegExp, (match: string) =>
        match.replaceAll('-', '_')
      )))
    : expression

const getProperties = (
  properties: Record<string, unknown> & { children?: JSX.Element },
  type?: string
): ParentProps => {
  const properties_: Record<string, unknown> = {}
  for (const key of Object.keys(properties))
    properties_[jsxKeyToSolid(key, type)] =
      typeof properties[key] === 'object' && !Array.isArray(properties[key])
        ? getProperties(properties[key] as Record<string, unknown>, type)
        : replaceDashWithUnderscore(properties[key])
  return properties_
}

export const Fragment = (properties: ParentProps): JSX.Element => properties.children

// Void elements that don't have closing tags
const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
])

// Create element for client-side rendering without hydration
const createClientElement = (tag: string, props: ParentProps): Element => {
  const isSvg = isSVGElement(tag)
  const el = isSvg
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag)

  const { children, ...rest } = props

  // Apply props/attributes
  for (const [key, value] of Object.entries(rest)) {
    if (value == null || value === false) continue
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase()
      el.addEventListener(eventName, value as EventListener)
    } else if (key === 'className' || key === 'class') {
      el.setAttribute('class', String(value))
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign((el as HTMLElement).style, value)
    } else if (value === true) {
      el.setAttribute(key, '')
    } else {
      el.setAttribute(key, String(value))
    }
  }

  // Handle children
  if (children != null) {
    if (Array.isArray(children)) {
      // @ts-expect-error TODO: fix
      for (const child of children.flat(Infinity)) appendChildToElement(el, child)
    } else appendChildToElement(el, children)
  }

  return el
}

const appendChildToElement = (parent: Element, child: unknown): void => {
  if (child == null || child === false || child === true) return
  if (child instanceof Node) {
    parent.appendChild(child)
  } else if (typeof child === 'string' || typeof child === 'number') {
    parent.appendChild(document.createTextNode(String(child)))
  } else if (Array.isArray(child)) {
    for (const c of child.flat(Infinity)) {
      appendChildToElement(parent, c)
    }
  } else if (typeof child === 'function') {
    // Reactive child - resolve it
    appendChildToElement(parent, child())
  }
}

export const jsx = (
  type: string | ((properties_: ParentProps) => JSX.Element),
  properties: ParentProps
): JSX.Element => {
  if (typeof type === 'function') {
    return type.name === 'Fragment' ? Fragment(properties) : type(getProperties(properties))
  }

  const tag = replaceDashWithUnderscore(type) as string
  const props = isFirstLetterCapital(type) ? properties : getProperties(properties, type)

  if (isServer) {
    // On server, use Dynamic which works fine for SSR
    return createComponent(Dynamic, mergeProps(props, { component: tag }))
  }

  // On client, create DOM element directly to avoid hydration issues
  return createClientElement(tag, props) as unknown as JSX.Element
}

const jsxKeyToSolid = (key: string, type = ''): string =>
  isSVGElement(type)
    ? (key = key === 'xlinkHref' || key === 'xlink:href' ? 'href' : normalizeKeySvg(key))
    : key

// For the moment we do not distinguish static children from dynamic ones
export const jsxs = jsx

// For the moment there is not special development handling
// function jsxDEV(type, props , maybeKey, isStaticChildren, source, self)
export const jsxDEV = jsx
