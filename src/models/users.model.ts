import DB from '../lib/db';
import { ModelSchema, getRequiredColumns, validate, parseSQLResult, parseSQLResultOne, parseSQLQueryColumns } from '../lib/model';
import { isDate } from '../lib/utils';

export interface IUser {
  id: number;
  username: string;
  password: string;
  email: string;
  isDeleted: boolean;
}

export type ParsedUser = Pick<IUser, 'username' | 'email'>;

const userSchema: ModelSchema = {
  id: { validator: Number.isInteger },
  username: { validator: (val: any) => typeof val === 'string' && val.length <= 255, required: true },
  password: { validator: (val: any) => typeof val === 'string' && val.length <= 255, required: true },
  email: { validator: (val: any) => typeof val === 'string' && val.length <= 255, required: true },
  isDeleted: { validator: (val: any) => typeof val === 'boolean' },
};