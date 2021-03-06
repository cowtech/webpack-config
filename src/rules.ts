import { imagesExtensions } from '@cowtech/webpack-utils'
import globby from 'globby'
import { resolve } from 'path'
import { RuleSetRule } from 'webpack'
import { babelRemoveFunction } from './babel-remove-function'
import { runHook } from './environment'
import { Babel, Options, Rules } from './types'

/*
Refresh the following two constants periodically by running with 'last 2 versions' and debug=true
Modifications:
  android: remove - Follows Chrome version
  opera: 60 - Use Chromium
  edge: 18 - 17 is legacy
  ie: remove - Is more than legacy
*/
export const minimumSupportedBrowsers = {
  chrome: '80',
  edge: '80',
  firefox: '75',
  ios: '12',
  opera: '67',
  safari: '12',
  samsung: '10.1'
}

export const unneededBabelPlugins = [
  '@babel/plugin-transform-regenerator',
  '@babel/transform-template-literals',
  '@babel/plugin-transform-function-name',
  '@babel/proposal-async-generator-functions',
  '@babel/proposal-object-rest-spread'
]

export async function checkTypescript(rulesOptions: Rules, srcFolder: string): Promise<boolean> {
  if (typeof rulesOptions.typescript === 'boolean') {
    return rulesOptions.typescript
  }

  return (await globby(resolve(srcFolder, './**/*.ts'))).length > 0
}

export async function checkReact(rulesOptions: Rules, srcFolder: string): Promise<boolean> {
  if (typeof rulesOptions.react === 'boolean') {
    return rulesOptions.react
  }

  return (await globby(resolve(srcFolder, './**/*.(jsx|tsx)'))).length > 0
}

export async function setupRules(options: Options): Promise<Array<RuleSetRule>> {
  const rulesOptions: Rules = options.rules ?? {}
  const babelOptions: Babel = options.babel ?? {}

  const useBabel = rulesOptions.babel ?? true
  const useTypescript = await checkTypescript(rulesOptions, options.srcFolder!)
  const useReact = await checkReact(rulesOptions, options.srcFolder!)

  const babelPresets: Array<Array<string | object> | string> = [
    [
      '@babel/preset-env',
      {
        targets: babelOptions.browsersWhiteList ?? minimumSupportedBrowsers,
        exclude: babelOptions.exclude ?? unneededBabelPlugins,
        modules: babelOptions.modules ?? false,
        debug: babelOptions.envDebug ?? false
      }
    ]
  ]

  const babelPlugins: Array<Function | string | [string, object]> = [
    ['@babel/plugin-proposal-class-properties', { loose: false }],
    '@babel/plugin-proposal-optional-catch-binding'
  ]

  if (options.environment === 'production') {
    const removeFunctions: Array<string> = babelOptions.removeFunctions ?? ['debugClassName']

    if (removeFunctions.length) {
      for (const name of removeFunctions) {
        babelPlugins.unshift(babelRemoveFunction(name))
      }
    }
  }

  const babelConfiguration = babelOptions.configuration ?? {}

  let rules: Array<RuleSetRule> = []

  if (useBabel) {
    rules.push({
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { presets: babelPresets, plugins: babelPlugins, ...babelConfiguration }
      }
    })
  }

  if (useTypescript) {
    rules.push({
      test: /\.ts$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { presets: babelPresets.concat('@babel/typescript'), plugins: babelPlugins, ...babelConfiguration }
      }
    })
  }

  if (useReact) {
    rules.push({
      test: /\.jsx$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: babelPresets.concat([['@babel/react', { runtime: 'automatic' }]]),
          plugins: babelPlugins,
          ...babelConfiguration
        }
      }
    })

    if (useTypescript) {
      rules.push({
        test: /\.tsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: babelPresets.concat([['@babel/react', { runtime: 'automatic' }]], '@babel/typescript'),
            plugins: babelPlugins,
            ...babelConfiguration
          }
        }
      })
    }
  }

  if (rulesOptions.images ?? true) {
    rules.push({
      test: imagesExtensions,
      type: 'asset/resource'
    })
  }

  if (rulesOptions.additional) {
    rules = rules.concat(rulesOptions.additional)
  }

  return runHook(rules, rulesOptions.afterHook)
}
