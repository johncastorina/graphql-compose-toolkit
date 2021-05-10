import { isNil, isEmpty, pipe } from 'ramda';

import { composeMongoose, ComposeMongooseOpts } from 'graphql-compose-mongoose';

import {
  ObjectTypeComposerRelationOpts,
  ObjectTypeComposerFieldConfigMapDefinition,
} from 'graphql-compose';

import {
  GraphQLComposeConfig,
  GQLComposeConfigWithModelTC,
  TRelation,
  IGQLComposeToolKitGlobalConfig,
} from '../@types';

// TODO:: use these functions instead of Ramda FN when porting to NPM package
// const isNil = (x: any): boolean => x === undefined || x === null || typeof x === 'undefined';
// const isEmpty = (x: any): boolean => {
//   if (x instanceof Array) {
//     return x.length === 0;
//   }

//   if (x instanceof Object) {
//     return Object.keys(x).length === 0;
//   }
//   return false;
// }
// // @ts-ignore
// const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x)

/**
 * Convert Mongoose Model to a ObjectTypeComposer
 * @param Config : GraphQLComposeConfig
 * @returns Config : GQLComposeConfigWithModelTC
 */
export const makeTCFromModel = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GraphQLComposeConfig): GQLComposeConfigWithModelTC => {
  const { addModelTC } = GlobalConfig;
  const { Model, removeFields, name: optionalName } = Config;
  const composeMongooseOpts: ComposeMongooseOpts = {
    removeFields,
  };
  const ModelTC = composeMongoose(Model, composeMongooseOpts);
  const name: string = optionalName || Model.modelName;

  addModelTC(`${name}`, ModelTC);

  return {
    ...Config,
    ModelTC,
    name,
  };
};

export const addStandardQueryResolvers = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { standardQueryResolvers, tcResolverMethodFormatFN } = GlobalConfig;

  const {
    ModelTC,
    name,
    useStandardQueryResolvers,
    commonMiddleware,
    allResolvers = {},
  } = Config;

  if (!useStandardQueryResolvers) return Config;

  const Query = {};

  standardQueryResolvers.forEach((operation): void => {
    Query[
      tcResolverMethodFormatFN(name, operation)
    ] = ModelTC.mongooseResolvers[operation]().withMiddlewares(
      commonMiddleware
    );
  });

  return {
    ...Config,
    allResolvers: {
      ...allResolvers,
      Query: {
        ...allResolvers?.Query,
        ...Query,
      },
    },
  };
};

export const addStandardMutationResolvers = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { standardMutationResolvers, tcResolverMethodFormatFN } = GlobalConfig;

  const {
    ModelTC,
    name,
    useStandardQueryResolvers,
    commonMiddleware,
    allResolvers = {},
  } = Config;

  if (!useStandardQueryResolvers) return Config;

  const Mutation = {};

  standardMutationResolvers.forEach(operation => {
    Mutation[
      tcResolverMethodFormatFN(name, operation)
    ] = ModelTC.mongooseResolvers[operation]().withMiddlewares(
      commonMiddleware
    );
  });

  return {
    ...Config,
    allResolvers: {
      ...allResolvers,
      Mutation: {
        ...allResolvers?.Mutation,
        ...Mutation,
      },
    },
  };
};

export const addStandardExtendedQueryResolvers = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { tcResolverMethodFormatFN } = GlobalConfig;

  const {
    ModelTC,
    name,
    QueryExtend,
    commonMiddleware,
    allResolvers = {},
  } = Config;
  if (isNil(QueryExtend) || isEmpty(QueryExtend)) return Config;

  const Query = {};

  QueryExtend?.forEach(({ operation, middleware = [], options = {} }) => {
    Query[
      tcResolverMethodFormatFN(name, operation)
    ] = ModelTC.mongooseResolvers[operation](options).withMiddlewares([
      ...commonMiddleware,
      ...middleware,
    ]);
  });

  return {
    ...Config,
    allResolvers: {
      ...allResolvers,
      Query: {
        ...allResolvers?.Query,
        ...Query,
      },
    },
  };
};

export const addStandardExtendedMutationResolvers = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { tcResolverMethodFormatFN } = GlobalConfig;

  const {
    ModelTC,
    name,
    MutationExtend = [],
    commonMiddleware,
    allResolvers = {},
  } = Config;

  if (isNil(MutationExtend) || isEmpty(MutationExtend)) return Config;
  const Mutation = {};
  MutationExtend?.forEach(({ operation, middleware = [], options = {} }) => {
    Mutation[
      tcResolverMethodFormatFN(name, operation)
    ] = ModelTC.mongooseResolvers[operation](options).withMiddlewares([
      ...commonMiddleware,
      ...middleware,
    ]);
  });

  return {
    ...Config,
    allResolvers: {
      ...allResolvers,
      Mutation: {
        ...allResolvers?.Mutation,
        ...Mutation,
      },
    },
  };
};

export const addRelations = (
  Config: GQLComposeConfigWithModelTC
): GQLComposeConfigWithModelTC => {
  const { ModelTC, relations, commonMiddleware } = Config;

  if (isNil(relations) || isEmpty(relations)) return Config;

  relations?.forEach(
    ({
      fieldName = '',
      middleware = [],
      opts: {
        resolver,
        prepareArgs,
        projection,
        description,
        deprecationReason,
      },
    }: TRelation) => {
      ModelTC.addRelation(fieldName, {
        prepareArgs,
        projection,
        description,
        deprecationReason,
        resolver: resolver.withMiddlewares([
          ...commonMiddleware,
          ...middleware,
        ]),
      } as ObjectTypeComposerRelationOpts<any, any, any, any>);
    }
  );

  return Config;
};

export const addCustomQueryResolvers = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { schemaComposer } = GlobalConfig;
  const { name: TCName, QueryCustom = [], commonMiddleware } = Config;
  if (isNil(QueryCustom) || isEmpty(QueryCustom)) return Config;
  QueryCustom.forEach(
    ({ name: customResolverName, type, args, resolve, middleware = [] }) => {
      const custom = schemaComposer
        .createResolver({
          name: `${TCName}${customResolverName}`,
          type,
          // @ts-ignore
          args,
          resolve,
        })
        .withMiddlewares([...commonMiddleware, ...middleware]);
      schemaComposer.Query.addFields({
        [`${TCName}${customResolverName}`]: custom,
      });
    }
  );
  return Config;
};

export const addCustomMutationResolvers = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { schemaComposer } = GlobalConfig;

  const { name: TCName, MutationCustom = [], commonMiddleware } = Config;
  if (isNil(MutationCustom) || isEmpty(MutationCustom)) return Config;
  MutationCustom.forEach(
    ({ name: customResolverName, type, args, resolve, middleware = [] }) => {
      const custom = schemaComposer
        .createResolver({
          name: `${TCName}${customResolverName}`,
          type,
          // @ts-ignore
          args,
          resolve,
        })
        .withMiddlewares([...commonMiddleware, ...middleware]);
      schemaComposer.Mutation.addFields({
        [`${TCName}${customResolverName}`]: custom,
      });
    }
  );

  return Config;
};

export const addCustomFields = (
  Config: GQLComposeConfigWithModelTC
): GQLComposeConfigWithModelTC => {
  const { ModelTC, CustomFields } = Config;

  if (isNil(CustomFields) || isEmpty(CustomFields)) return Config;
  ModelTC.addFields(
    CustomFields as ObjectTypeComposerFieldConfigMapDefinition<any, any>
  );

  return Config;
};

export const wrapCustomFieldResolvers = (
  Config: GQLComposeConfigWithModelTC
): GQLComposeConfigWithModelTC => {
  // const { ModelTC, CustomFields, commonMiddleware } = Config;
  // if (isNil(CustomFields) || isEmpty(CustomFields)) return Config;

  // Object.keys(CustomFields).forEach(key => {
  // TODO:: get middlewares onto custom field resolvers
  // })

  return Config;
};

export const addAllQueriesToSchemaComposer = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { schemaComposer } = GlobalConfig;
  const { allResolvers } = Config;
  if (isNil(allResolvers?.Query) || isEmpty(allResolvers?.Query)) return Config;
  schemaComposer.Query.addFields(allResolvers?.Query as any);
  return Config;
};

export const addAllMutationsToSchemaComposer = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) => (Config: GQLComposeConfigWithModelTC): GQLComposeConfigWithModelTC => {
  const { schemaComposer } = GlobalConfig;
  const { allResolvers } = Config;
  if (isNil(allResolvers?.Mutation) || isEmpty(allResolvers?.Mutation))
    return Config;

  schemaComposer.Mutation.addFields(allResolvers?.Mutation as any);
  return Config;
};

/**
 * Build standard operations and relations for Model
 */
export const makeGQLComposeMongooseStandardOpsPipeline = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) =>
  pipe(
    makeTCFromModel(GlobalConfig),
    addStandardQueryResolvers(GlobalConfig),
    addStandardMutationResolvers(GlobalConfig),
    addStandardExtendedQueryResolvers(GlobalConfig),
    addStandardExtendedMutationResolvers(GlobalConfig),
    addAllQueriesToSchemaComposer(GlobalConfig),
    addAllMutationsToSchemaComposer(GlobalConfig),
    addRelations
  );

/**
 * Build custom field resolvers and custom resolvers for ModelTC
 */
export const makeGQLComposeMongoosePipeline = (
  GlobalConfig: IGQLComposeToolKitGlobalConfig
) =>
  pipe(
    makeGQLComposeMongooseStandardOpsPipeline(GlobalConfig),
    addCustomQueryResolvers(GlobalConfig),
    addCustomMutationResolvers(GlobalConfig),
    addCustomFields,
    wrapCustomFieldResolvers,
    addAllQueriesToSchemaComposer(GlobalConfig),
    addAllMutationsToSchemaComposer(GlobalConfig)
  );
