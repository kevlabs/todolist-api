import { DBParams } from './db';

function getDBParams(): DBParams {
  // retrieve db params from connection string if exists
  if (process.env.DATABASE_URL) {
    // user:password@host:port/database
    const matches = process.env.DATABASE_URL.match(
      /^\w+:\/\/([^:]+):([^@]+)@([^:]+):([\d]+)\/(.+)$/,
    );
    if (matches && matches.length === 6) {
      return {
        host: matches[3],
        port: parseInt(matches[4], 10),
        database: matches[5],
        user: matches[1],
        password: matches[2],
      };
    }
  }
  return {
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '', 10),
    database: process.env.DB_NAME || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
  };
}

export const dbParams: DBParams = getDBParams();
