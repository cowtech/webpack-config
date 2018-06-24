"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const globby = require("globby");
// @ts-ignore
const HtmlWebpackPlugin = require("html-webpack-plugin");
const lodash_1 = require("lodash");
const path_1 = require("path");
// @ts-ignore
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
// @ts-ignore
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const webpack_1 = require("webpack");
// @ts-ignore
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
// @ts-ignore
const workbox_webpack_plugin_1 = require("workbox-webpack-plugin");
const rules_1 = require("./rules");
exports.serviceWorkerDefaultInclude = [/\.(html|js|json|css)$/, /\/images.+\.(bmp|jpg|jpeg|png|svg|webp)$/];
exports.serviceWorkerDefaultExclude = [/\.map$/, /manifest\.json/, /bundle\.js/, /404\.html/];
async function resolveFile(options, key, pattern) {
    let file = lodash_1.get(options, key, true);
    if (file === true) {
        file = (await globby(path_1.resolve(options.srcFolder, pattern)))[0];
    }
    return typeof file === 'string' ? file : null;
}
async function setupPlugins(options) {
    const pluginsOptions = options.plugins || {};
    const swOptions = options.serviceWorker || {};
    const useTypescript = await rules_1.checkTypescript(options.rules || {}, options.srcFolder);
    const hasManifest = await resolveFile(options, 'rules.manifest', 'manifest.json');
    const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)');
    let plugins = [
        new webpack_1.EnvironmentPlugin({
            NODE_ENV: options.environment
        }),
        new webpack_1.DefinePlugin({
            ENV: JSON.stringify(options.env),
            VERSION: JSON.stringify(options.version),
            ICONS: JSON.stringify(options.icons)
        })
    ];
    if (indexFile) {
        plugins.push(new HtmlWebpackPlugin({
            template: indexFile,
            minify: { collapseWhitespace: true },
            inject: false,
            excludeAssets: [/\.js$/]
        }));
    }
    if (hasManifest) {
        plugins.push(new ReplaceInFileWebpackPlugin([
            {
                dir: options.destFolder,
                files: ['manifest.json'],
                rules: [
                    {
                        search: '$version',
                        replace: options.version
                    }
                ]
            }
        ]));
    }
    if (useTypescript) {
        plugins.push(new ForkTsCheckerWebpackPlugin({
            checkSyntacticErrors: true,
            async: false,
            workers: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE
        }));
    }
    if (lodash_1.get(pluginsOptions, 'concatenate', true))
        plugins.push(new webpack_1.optimize.ModuleConcatenationPlugin());
    if (options.environment === 'production') {
        if (lodash_1.get(pluginsOptions, 'minify', true)) {
            plugins.push(new UglifyJsPlugin({ uglifyOptions: lodash_1.get(options, 'uglify', {}) }));
        }
    }
    else {
        if (lodash_1.get(pluginsOptions, 'hotModuleReload', true)) {
            plugins.push(new webpack_1.HotModuleReplacementPlugin());
        }
    }
    const analyze = lodash_1.get(pluginsOptions, 'analyze', true);
    if (analyze) {
        if (path_1.basename(process.argv[1]) !== 'webpack') {
            plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                analyzerMode: typeof analyze === 'string' ? analyze : 'server',
                analyzerHost: lodash_1.get(options, 'server.host', 'home.cowtech.it'),
                analyzerPort: lodash_1.get(options, 'server.port', 4200) + 2,
                generateStatsFile: analyze === 'static',
                openAnalyzer: false
            }));
        }
        else {
            plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                analyzerMode: 'static',
                generateStatsFile: true,
                openAnalyzer: false
            }));
        }
    }
    if (lodash_1.get(swOptions, 'enabled', null) === true || options.environment === 'production') {
        let swSrc = await resolveFile(options, 'serviceWorker.src', './(service-worker|sw).(js|ts)');
        if (swSrc) {
            const swDest = lodash_1.get(swOptions, 'dest', 'sw.js');
            plugins.push(new workbox_webpack_plugin_1.InjectManifest(Object.assign({ swSrc,
                swDest, include: exports.serviceWorkerDefaultInclude, exclude: exports.serviceWorkerDefaultExclude }, lodash_1.get(swOptions, 'options', {}))), new ReplaceInFileWebpackPlugin([
                {
                    dir: options.destFolder,
                    files: [swDest],
                    rules: [
                        {
                            search: '$version',
                            replace: options.version
                        },
                        {
                            search: '$debug',
                            replace: options.environment === 'production' ? 'false' : 'true'
                        }
                    ]
                }
            ]));
        }
    }
    if (pluginsOptions.additional)
        plugins = plugins.concat(pluginsOptions.additional);
    if (pluginsOptions && typeof pluginsOptions.afterHook === 'function') {
        plugins = await pluginsOptions.afterHook(plugins);
    }
    return plugins;
}
exports.setupPlugins = setupPlugins;