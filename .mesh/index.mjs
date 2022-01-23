import { AggregateError } from '@graphql-tools/utils';
import { parse } from 'graphql';
import { getMesh } from '@graphql-mesh/runtime';
import { MeshStore, FsStoreStorageAdapter } from '@graphql-mesh/store';
import { join, relative, isAbsolute, dirname } from 'path';
import { fileURLToPath } from 'url';
import ExternalModule_0 from 'ts-node/register/transpile-only';
import ExternalModule_1 from '@graphql-mesh/cache-inmemory-lru';
import ExternalModule_2 from '@graphql-mesh/openapi';
import ExternalModule_3 from '@graphql-mesh/transform-filter-schema';
import ExternalModule_4 from '@graphql-mesh/merger-bare';
import ExternalModule_5 from './sources/Wiki/oas-schema.cjs';
const importedModules = {
    // @ts-ignore
    ["ts-node/register/transpile-only"]: ExternalModule_0,
    // @ts-ignore
    ["@graphql-mesh/cache-inmemory-lru"]: ExternalModule_1,
    // @ts-ignore
    ["@graphql-mesh/openapi"]: ExternalModule_2,
    // @ts-ignore
    ["@graphql-mesh/transform-filter-schema"]: ExternalModule_3,
    // @ts-ignore
    ["@graphql-mesh/merger-bare"]: ExternalModule_4,
    // @ts-ignore
    [".mesh/sources/Wiki/oas-schema.cjs"]: ExternalModule_5
};
const baseDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const importFn = (moduleId) => {
    const relativeModuleId = (isAbsolute(moduleId) ? relative(baseDir, moduleId) : moduleId).split('\\').join('/');
    if (!(relativeModuleId in importedModules)) {
        throw new Error(`Cannot find module '${relativeModuleId}'.`);
    }
    return Promise.resolve(importedModules[relativeModuleId]);
};
const rootStore = new MeshStore('.mesh', new FsStoreStorageAdapter({
    cwd: baseDir,
    importFn,
}), {
    readonly: true,
    validate: false
});
import 'ts-node/register/transpile-only';
import MeshCache from '@graphql-mesh/cache-inmemory-lru';
import { PubSub } from '@graphql-mesh/utils';
import { DefaultLogger } from '@graphql-mesh/utils';
import OpenapiHandler from '@graphql-mesh/openapi';
import FilterSchemaTransform from '@graphql-mesh/transform-filter-schema';
import BareMerger from '@graphql-mesh/merger-bare';
import { resolveAdditionalResolvers } from '@graphql-mesh/utils';
import * as additionalResolvers$0 from '../additional-resolvers.ts';
export const rawConfig = { "sources": [{ "name": "Wiki", "handler": { "openapi": { "source": "https://api.apis.guru/v2/specs/wikimedia.org/1.0.0/swagger.yaml", "operationIdFieldNames": true } } }], "additionalTypeDefs": "extend type Query {\n  viewsInPastMonth: Float!\n}\n", "additionalResolvers": ["./additional-resolvers.ts"], "require": ["ts-node/register/transpile-only"], "transforms": [{ "filterSchema": { "mode": "bare", "filters": ["Query.!{getMediaMathFormulaHash}"] } }] };
export async function getMeshOptions() {
    const cache = new MeshCache({
        ...(rawConfig.cache || {}),
        store: rootStore.child('cache'),
    });
    const pubsub = new PubSub();
    const sourcesStore = rootStore.child('sources');
    const logger = new DefaultLogger('🕸️');
    const sources = [];
    const transforms = [];
    const wikiTransforms = [];
    const wikiHandler = new OpenapiHandler({
        name: rawConfig.sources[0].name,
        config: rawConfig.sources[0].handler["openapi"],
        baseDir,
        cache,
        pubsub,
        store: sourcesStore.child(rawConfig.sources[0].name),
        logger: logger.child(rawConfig.sources[0].name),
        importFn
    });
    sources.push({
        name: 'Wiki',
        handler: wikiHandler,
        transforms: wikiTransforms
    });
    transforms.push(new FilterSchemaTransform({
        apiName: '',
        config: rawConfig.transforms[0]["filterSchema"],
        baseDir,
        cache,
        pubsub,
        importFn
    }));
    const additionalTypeDefs = [parse(/* GraphQL */ `extend type Query {
  viewsInPastMonth: Float!
}`),];
    const merger = new BareMerger({
        cache,
        pubsub,
        logger: logger.child('BareMerger'),
        store: rootStore.child('bareMerger')
    });
    const additionalResolversRawConfig = [];
    additionalResolversRawConfig.push(additionalResolvers$0.resolvers || additionalResolvers$0.default || additionalResolvers$0);
    const additionalResolvers = await resolveAdditionalResolvers(baseDir, additionalResolversRawConfig, importFn, pubsub);
    const liveQueryInvalidations = rawConfig.liveQueryInvalidations;
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
export const documentsInSDL = /*#__PURE__*/ [];
export async function getBuiltMesh() {
    const meshConfig = await getMeshOptions();
    return getMesh(meshConfig);
}
export async function getMeshSDK(sdkOptions) {
    const { schema } = await getBuiltMesh();
    return getSdk(schema, sdkOptions);
}
function handleExecutionResult(result, operationName) {
    if (result.errors) {
        const originalErrors = result.errors.map(error => error.originalError || error);
        throw new AggregateError(originalErrors, `Failed to execute ${operationName}: \n\t${originalErrors.join('\n\t')}`);
    }
    return result.data;
}
export function getSdk(schema, { globalContext, globalRoot, jitOptions = {} } = {}) {
    return {};
}
