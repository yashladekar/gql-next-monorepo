import { builder } from "./builder"

builder.scalarType("DateTime", {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => new Date(value as string | number),
})

builder.scalarType("JSON", {
  serialize: (value) => value,
  parseValue: (value) => value,
})
