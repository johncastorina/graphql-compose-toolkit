# graphql-compose-toolkit
Opinionated wrapper for GraphQL Compose Mongoose that provides an API controller factory.

Use an easy to read declarative style to build your GraphQL controllers for Mongoose Models.

# Installation
### NPM:
```
npm install graphql-compose graphql-compose-mongoose
```
### Yarn:
```
yarn add graphql-compose graphql-compose-mongoose
```
### Usage

#### Example with controller factory, a central controller registry, and multiple controllers
##### Controller Factory Setup
```
import { SchemaComposer } from 'graphql-compose';
import { makeGQLComposeToolKit } from './graphql-compose-toolkit';

export const schemaComposer = new SchemaComposer();

export const { 
  gqlComposeMoongoosePipeline,
  getModelTC,
  addSchema,
  addSchemas,
 } = makeGQLComposeToolKit({
  schemaComposer
});

```
Building a simple controller
```
import { PersonModel } from './models';
import { myMiddleware } from './middleware';
import { 
  gqComposeMongoosePipeline 
} from './controllerFactory';

// building a basic controller using the configured pipeline function
export const PersonController = graphqlComposePipeline({
  Model: PersonModel,
  name: 'Person',
  useStandardQueryResolvers: true,
  useStandardMutationResolvers: true,
  commonMiddleware: [myMiddleWare],  
});
```
```
import { CompanyModel } from './models';
import { myMiddleware } from './middleware';
import { 
  gqComposeMongoosePipeline 
} from './controllerFactory';

// building a basic controller using the configured pipeline function
export const CompanyController = graphqlComposePipeline({
  Model: CompanyModel,
  name: 'Company',
  useStandardQueryResolvers: true,
  useStandardMutationResolvers: true,
  commonMiddleware: [myMiddleWare],  
});
```
##### Central Controller Registry
```
import {    
  addSchemas  
} from './controllerFactory';

import { PersonController, CompanyController } from './controllers';

addSchemas([
  PersonController,
  CompanyController
]);
```
