"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSdk = exports.getMeshSDK = exports.getBuiltMesh = exports.documentsInSDL = exports.getMeshOptions = exports.rawConfig = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("@graphql-tools/utils");
const graphql_1 = require("graphql");
const runtime_1 = require("@graphql-mesh/runtime");
const store_1 = require("@graphql-mesh/store");
const path_1 = require("path");
const transpile_only_1 = (0, tslib_1.__importDefault)(require("ts-node/register/transpile-only"));
const cache_inmemory_lru_1 = (0, tslib_1.__importDefault)(require("@graphql-mesh/cache-inmemory-lru"));
const openapi_1 = (0, tslib_1.__importDefault)(require("@graphql-mesh/openapi"));
const transform_filter_schema_1 = (0, tslib_1.__importDefault)(require("@graphql-mesh/transform-filter-schema"));
const merger_bare_1 = (0, tslib_1.__importDefault)(require("@graphql-mesh/merger-bare"));
const oas_schema_cjs_1 = (0, tslib_1.__importDefault)(require("./sources/Wiki/oas-schema.cjs"));
const importedModules = {
    // @ts-ignore
    ["ts-node/register/transpile-only"]: transpile_only_1.default,
    // @ts-ignore
    ["@graphql-mesh/cache-inmemory-lru"]: cache_inmemory_lru_1.default,
    // @ts-ignore
    ["@graphql-mesh/openapi"]: openapi_1.default,
    // @ts-ignore
    ["@graphql-mesh/transform-filter-schema"]: transform_filter_schema_1.default,
    // @ts-ignore
    ["@graphql-mesh/merger-bare"]: merger_bare_1.default,
    // @ts-ignore
    [".mesh/sources/Wiki/oas-schema.cjs"]: oas_schema_cjs_1.default
};
const baseDir = (0, path_1.join)(__dirname, '..');
const importFn = (moduleId) => {
    const relativeModuleId = ((0, path_1.isAbsolute)(moduleId) ? (0, path_1.relative)(baseDir, moduleId) : moduleId).split('\\').join('/');
    if (!(relativeModuleId in importedModules)) {
        throw new Error(`Cannot find module '${relativeModuleId}'.`);
    }
    return Promise.resolve(importedModules[relativeModuleId]);
};
const rootStore = new store_1.MeshStore('.mesh', new store_1.FsStoreStorageAdapter({
    cwd: baseDir,
    importFn,
}), {
    readonly: true,
    validate: false
});
require("ts-node/register/transpile-only");
const cache_inmemory_lru_2 = (0, tslib_1.__importDefault)(require("@graphql-mesh/cache-inmemory-lru"));
const utils_2 = require("@graphql-mesh/utils");
const utils_3 = require("@graphql-mesh/utils");
const openapi_2 = (0, tslib_1.__importDefault)(require("@graphql-mesh/openapi"));
const transform_filter_schema_2 = (0, tslib_1.__importDefault)(require("@graphql-mesh/transform-filter-schema"));
const merger_bare_2 = (0, tslib_1.__importDefault)(require("@graphql-mesh/merger-bare"));
const utils_4 = require("@graphql-mesh/utils");
const additionalResolvers$0 = (0, tslib_1.__importStar)(require("../additional-resolvers.ts"));
exports.rawConfig = { "sources": [{ "name": "Wiki", "handler": { "openapi": { "source": "https://api.apis.guru/v2/specs/wikimedia.org/1.0.0/swagger.yaml", "operationIdFieldNames": true } } }], "additionalTypeDefs": "extend type Query {\n  viewsInPastMonth: Float!\n}\n", "additionalResolvers": ["./additional-resolvers.ts"], "require": ["ts-node/register/transpile-only"], "transforms": [{ "filterSchema": { "mode": "bare", "filters": ["Query.!{getMediaMathFormulaHash}"] } }] };
async function getMeshOptions() {
    const cache = new cache_inmemory_lru_2.default({
        ...(exports.rawConfig.cache || {}),
        store: rootStore.child('cache'),
    });
    const pubsub = new utils_2.PubSub();
    const sourcesStore = rootStore.child('sources');
    const logger = new utils_3.DefaultLogger('🕸️');
    const sources = [];
    const transforms = [];
    const wikiTransforms = [];
    const wikiHandler = new openapi_2.default({
        name: exports.rawConfig.sources[0].name,
        config: exports.rawConfig.sources[0].handler["openapi"],
        baseDir,
        cache,
        pubsub,
        store: sourcesStore.child(exports.rawConfig.sources[0].name),
        logger: logger.child(exports.rawConfig.sources[0].name),
        importFn
    });
    sources.push({
        name: 'Wiki',
        handler: wikiHandler,
        transforms: wikiTransforms
    });
    transforms.push(new transform_filter_schema_2.default({
        apiName: '',
        config: exports.rawConfig.transforms[0]["filterSchema"],
        baseDir,
        cache,
        pubsub,
        importFn
    }));
    const additionalTypeDefs = [(0, graphql_1.parse)(/* GraphQL */ `extend type Query {
  viewsInPastMonth: Float!
}`),];
    const merger = new merger_bare_2.default({
        cache,
        pubsub,
        logger: logger.child('BareMerger'),
        store: rootStore.child('bareMerger')
    });
    const additionalResolversRawConfig = [];
    additionalResolversRawConfig.push(additionalResolvers$0.resolvers || additionalResolvers$0.default || additionalResolvers$0);
    const additionalResolvers = await (0, utils_4.resolveAdditionalResolvers)(baseDir, additionalResolversRawConfig, importFn, pubsub);
    const liveQueryInvalidations = exports.rawConfig.liveQueryInvalidations;
    return {
        sources,
        transforms,
        additionalTypeDefs,
        additionalResolvers,
        cache,
        pubsub,
        merger,
        logger,
        liveQueryInvalidations,
    };
}
exports.getMeshOptions = getMeshOptions;
exports.documentsInSDL = [];
async function getBuiltMesh() {
    const meshConfig = await getMeshOptions();
    return (0, runtime_1.getMesh)(meshConfig);
}
exports.getBuiltMesh = getBuiltMesh;
async function getMeshSDK(sdkOptions) {
    const { schema } = await getBuiltMesh();
    return getSdk(schema, sdkOptions);
}
exports.getMeshSDK = getMeshSDK;
function handleExecutionResult(result, operationName) {
    if (result.errors) {
        const originalErrors = result.errors.map(error => error.originalError || error);
        throw new utils_1.AggregateError(originalErrors, `Failed to execute ${operationName}: \n\t${originalErrors.join('\n\t')}`);
    }
    return result.data;
}
function getSdk(schema, { globalContext, globalRoot, jitOptions = {} } = {}) {
    return {};
}
exports.getSdk = getSdk;
