// MODEL VALIDATOR

type ModelValidateColumn = {
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
export function validate(input: Record<string, any>, columns: Record<string, ModelValidateColumn>): Record<string, any> {

  const columnReducer = (
    validatedOutput: Record<string, any>, [columnName, { validator }]: [string, ModelValidateColumn]
  ): Record<string, any> => {

    // validate value from input
    if (!(columnName in input)) throw Error(`Field ${columnName} is missing`);
    if (!validator(input[columnName])) throw Error(`The value in field ${columnName} is invalid`);

    // append to safe output if validation passed
    validatedOutput[columnName] = input[columnName];

    // return all validated values
    return validatedOutput;

  };

  // return validated columns
  return Object.entries(columns).reduce(columnReducer, {});

}

// MODEL PARSER

type ModelParseColumn = {
  parser?: Function,
}

/**
 * Parses (SQL?) output
 * Use the function to return a subset of the output (e.g. safe output for client-side use)

 * @param input input to be checked against validation criteria (e.g. result from SQL query)
 * @param columns columns (optionally with parser function) that may or may not be present in the input
 * @return An object containing only the keys specified in 'columns'
 */
export function parse(input: Record<string, any>, columns: Record<string, ModelParseColumn>): Record<string, any> {

  const columnReducer = (
    parsedOutput: Record<string, any>, [columnName, { parser }]: [string, ModelParseColumn]
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
