const { GraphQLScalarType, Kind } = require("graphql");
const authResolvers = require("./resolvers/auth");
const chatResolvers = require("./resolvers/chat");
const playerResolvers = require("./resolvers/players");
const fixtureResolvers = require("./resolvers/fixtures");
const predictionResolvers = require("./resolvers/predictions");
const connectionResolvers = require("./resolvers/connections");
const pollaResolvers = require("./resolvers/polla");

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        try { return JSON.parse(ast.value); } catch { return ast.value; }
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.OBJECT: {
        const obj = {};
        ast.fields.forEach((field) => {
          obj[field.name.value] = JSONScalar.parseLiteral(field.value);
        });
        return obj;
      }
      case Kind.LIST:
        return ast.values.map((v) => JSONScalar.parseLiteral(v));
      case Kind.NULL:
        return null;
      default:
        return null;
    }
  },
});

function mergeResolvers(...resolverSets) {
  // Generic merge: copy every type's field-resolvers (Query, Mutation,
  // and ALSO any type-specific resolver like PollaBet, Fixture, ...).
  // The previous implementation only copied Query and Mutation, so any
  // field resolver attached to a type (e.g. PollaBet.fixture) was
  // silently discarded — clients always saw null for that field.
  const merged = {};
  for (const resolvers of resolverSets) {
    for (const [typeName, fieldResolvers] of Object.entries(resolvers)) {
      if (!merged[typeName]) merged[typeName] = {};
      Object.assign(merged[typeName], fieldResolvers);
    }
  }
  return merged;
}

const resolvers = {
  JSON: JSONScalar,
  ...mergeResolvers(
    authResolvers,
    chatResolvers,
    playerResolvers,
    fixtureResolvers,
    predictionResolvers,
    connectionResolvers,
    pollaResolvers
  ),
};

module.exports = resolvers;
