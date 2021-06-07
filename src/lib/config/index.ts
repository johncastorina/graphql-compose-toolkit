import {
  IGQLInputConfig,
  TModelTC,
  TModelTCRegistry,
  GQLComposeConfigWithModelTC,
} from '../@types';

import {
  StandardQueryResolvers,
  StandardMutationResolvers,
} from '../constants';

import { makeGQLComposeMongoosePipeline } from '../factories';

export const makeGQLComposeToolKit = ({
  schemaComposer,
  tcResolverMethodFormatFN = (n, s) => `${n}${s}`,
  standardQueryResolvers = StandardQueryResolvers,
  standardMutationResolvers = StandardMutationResolvers,
}: IGQLInputConfig) => {
  const ModelTCs: TModelTCRegistry = {};
  const Schemas: GQLComposeConfigWithModelTC[] = [];
  const addModelTC = (name: string, TCModel: TModelTC) => {
    ModelTCs[name] = TCModel;
  };

  const gqlComposeMoongoosePipeline = makeGQLComposeMongoosePipeline({
    schemaComposer,
    tcResolverMethodFormatFN,
    addModelTC,
    standardQueryResolvers,
    standardMutationResolvers,
  });

  return {
    gqlComposeMoongoosePipeline,
    getModelTC: (name: string) => {
      const isModelTC = ModelTCs.hasOwnProperty(name);
      if (!isModelTC) throw Error(`ModelTC ${name} Does Not Exist`);
      return ModelTCs[name];
    },
    addModelTC,
    addSchema: (schema: GQLComposeConfigWithModelTC) => Schemas.push(schema),
    addSchemas: (schemas: GQLComposeConfigWithModelTC[]) =>
      Schemas.concat(schemas),
    hasSchema: (schema: GQLComposeConfigWithModelTC) =>
      Schemas.indexOf(schema) !== -1,
    getAllSchemas: () => Schemas,
  };
};
