import * as FS from "fs";
import * as GraphQLCodeGenerator from "graphql-codegen-core";
import * as Handlebars from "handlebars";

const plugin: GraphQLCodeGenerator.PluginFunction = (schema, documents) => {
  console.log(GraphQLCodeGenerator.transformDocumentsFiles(schema, documents));
  return Handlebars.compile(
    FS.readFileSync(`${__dirname}/Template.handlebars`).toString()
  )(GraphQLCodeGenerator.transformDocumentsFiles(schema, documents));
};

export { plugin };
