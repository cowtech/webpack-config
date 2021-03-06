import HtmlWebpackPlugin from 'html-webpack-plugin'
import { Chunk, Configuration, RuleSetRule, Stats, WebpackOptionsNormalized, WebpackPluginInstance } from 'webpack'

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type HookReturn<T> = void | null | T | Promise<void | null | T>
export type Hook<T> = (input: T) => HookReturn<T>

export type Target =
  | 'web'
  | 'webworker'
  | 'node'
  | 'async-node'
  | 'node-webkit'
  | 'atom'
  | 'electron'
  | 'electron-renderer'
  | 'electron-main'
  | ((compiler?: any) => void)

export type LibraryTarget = 'var' | 'this' | 'commonjs' | 'commonjs2' | 'amd' | 'umd' | 'window' | 'assign' | 'jsonp'

export type FilenameGenerator = (data: OutputData) => string

export interface HtmlWebpackTrackerPluginParameters {
  outputName: string
  plugin: HtmlWebpackPlugin.Options
}

export interface OutputData {
  chunk: Chunk
  hash: string
}

export interface Output {
  filename?: string | FilenameGenerator
  publicPath?: string
  target?: Target
  libraryTarget?: LibraryTarget
}

export interface Environment {
  environment: string
  version: string
  serviceWorkerEnabled: boolean
  [key: string]: any
}

export interface Rules {
  additional?: Array<RuleSetRule>
  babel?: boolean
  typescript?: boolean
  react?: boolean
  images?: boolean
  manifest?: boolean
  robots?: boolean
  afterHook?: Hook<Array<RuleSetRule>>
}

export interface Plugins {
  checkTypescript?: boolean
  additional?: Array<WebpackPluginInstance>
  concatenate?: boolean
  minify?: boolean
  hotModuleReload?: boolean
  splitChunks?: WebpackOptionsNormalized['optimization']['splitChunks']
  analyze?: boolean | string
  afterHook?: Hook<Array<WebpackPluginInstance>>
}

export interface IconsToLoad {
  [key: string]: Array<string>
}

export interface Icons {
  tags: { [key: string]: string }
  definitions: string
}

export interface ServiceWorker {
  enabled?: boolean
  src?: string
  dest?: string
  options?: object
  debug?: boolean
}

export interface Server {
  host?: string
  port?: number
  https?: boolean | { [key: string]: string | Buffer }
  compress?: boolean
  hot?: boolean | object
  history?: boolean | object
  firewall?: boolean | Array<string>
  options?: object
  afterHook?: Hook<Server>
}

export interface Babel {
  browsersWhiteList?: string | Array<string> | { [key: string]: string }
  removeFunctions?: Array<string>
  exclude?: Array<string>
  modules?: boolean
  configuration?: any
  envDebug?: boolean
}

export type ExtendedConfiguration = Configuration & {
  output: any
  devServer: any
}

export interface Options extends Output {
  environment?: string | object
  additionalEnvironment?: object
  version?: string
  env?: Environment
  entries?: Configuration['entry']
  index?: boolean | string
  rules?: Rules
  plugins?: Plugins
  stats?: Stats
  performance?: Configuration['performance']
  icons?: IconsToLoad | Icons
  serviceWorker?: ServiceWorker
  srcFolder?: string
  destFolder?: string
  sourceMaps?: string | false
  externals?: Configuration['externals']
  server?: Server
  babel?: Babel
  useESModules?: boolean
  uglify?: object
  afterHook?: Hook<ExtendedConfiguration>
}

export interface WebpackCliEnvironment {
  [key: string]: boolean | string
}
