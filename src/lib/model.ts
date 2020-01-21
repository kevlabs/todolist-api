import camelCaseKeys from 'camelcase-keys';
import { snakeCase } from 'snake-case';

// MODEL SCHEMA

export interface ModelSchemaColumnSettings {
  validator: (value: any) => boolean;
  parser?: Function;
  required?: boolean;
};

// { columnName: settings }
export type ModelSchema = Record<string, ModelSchemaColumnSettings>;

// return only required columns in model schema
export function getRequiredColumns(schema: ModelSchema): ModelSchema {

  // append column to requiredColumns if required flag is truthy
  const columnReducer = (
    requiredColumns: ModelSchema,
    [column, columnSettings]: [string, ModelSchemaColumnSettings],
  ): ModelSchema => {

    columnSettings.required && (requiredColumns[column] = columnSettings);
    return requiredColumns;
  };

  return Object.entries(schema).reduce(columnReducer, {});
}

// MODEL VALIDATOR

export type ModelValidateColumn = {
  validator: (value: any) => boolean,
}

/**
 * Validates (front-end?) input
 * All columns in the 'columns' parameter must be present in the input object for the validation to
 * pass.
 * If the validation fails, an error is thrown
 * @param input (front-end?) input to be checked against validation criteria
 * @param columns columns (with validator function) that must be present in the input
 * @return An object containing only the keys specified in 'columns'
 */
export function validate(input: Record<string, any>, columns: Record<string, ModelValidateColumn> = {}, requireAll = true): Record<string, any> {

  const columnReducer = (
    validatedOutput: Record<string, any>,
    [columnName, { validator }]: [string, ModelValidateColumn],
  ): Record<string, any> => {

    // validate value from input
    if (!(columnName in input) && requireAll) throw Error(`Field ${columnName} is missing`);

    if (columnName in input) {
      if (!validator(input[columnName])) throw Error(`The value in field ${columnName} is invalid`);

      // append to safe output if validation passed
      validatedOutput[columnName] = input[columnName];
    }

    // return all validated values
    return validatedOutput;

  };

  // return validated columns
  return Object.entries(columns).reduce(columnReducer, {});

}

// MODEL PARSER

export type ModelParseColumn = {
  parser?: Function,
}

/**
 * Parses (SQL?) output
 * Use the function to return a subset of the output (e.g. safe output for client-side use)
 * @param input input to be checked against validation criteria (e.g. result from SQL query)
 * @param columns columns (optionally with parser function) that may or may not be present in the input
 * @return An object containing only the keys specified in 'columns'
 */
export function parse(input: Record<string, any>, columns: Record<string, ModelParseColumn> | string[] = {}): Record<string, any> {

  // first overload: columns is an array of column names
  // filters by column name only
  if (columns instanceof Array) {

    const columnReducer = (
      parsedOutput: Record<string, any>,
      columnName: string,
    ): Record<string, any> => {
      // parse value from input
      columnName in input && (parsedOutput[columnName] = input[columnName]);

      // return all parsed values
      return parsedOutput;
    };

    return columns.reduce(columnReducer, {});

  }

  // columns is an object

  const columnReducer = (
    parsedOutput: Record<string, any>,
    [columnName, { parser }]: [string, ModelParseColumn],
  ): Record<string, any> => {

    // parse value from input
    if (columnName in input) {
      parsedOutput[columnName] = parser !== undefined ? parser(input[columnName]) : input[columnName];
    }

    // return all parsed values
    return parsedOutput;

  };

  // return parsed columns
  return Object.entries(columns).reduce(columnReducer, {});

}

// PARSE SQL RESULTS
// see parse. Returns an array of parsed results. Keys of array item are camel-case
export function parseSQLResult(input: Record<string, any>[], columns: Record<string, ModelParseColumn> | string[]): Record<string, any>[] {

  return input.map(row => parse(camelCaseKeys(row), columns));

}

// see parse. Returns the first parsed results. Keys of the result are camel-case
export function parseSQLResultOne(input: Record<string, any>[], columns: Record<string, ModelParseColumn> | string[]): Record<string, any> {
  return parseSQLResult(input, columns)[0];
}

// returns an object with column names and $'s as well as an array of params for the query and the index of the next param
export function parseSQLQueryColumns(input: Record<string, any>, nextParamIndex = 1): { names: string, values: string, params: any[], nextParamIndex: number } {

  const output: { names: string, values: string, params: any[], nextParamIndex: number } = { names: '', values: '', params: [], nextParamIndex};

  const columnNames = Object.keys(input).map(column => snakeCase(column));
  output.names = columnNames.length > 1 ? `(${columnNames.join(', ')})` : columnNames[0];

  output.params = Object.values(input);

  const columnValues = output.params.map((_, i) => `$${i + 1}`);
  output.values = columnValues.length > 1 ? `(${columnValues.join(', ')})` : columnValues[0];

  output.nextParamIndex = nextParamIndex + output.params.length;

  return output;

}