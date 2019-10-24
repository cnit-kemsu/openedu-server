import { Pool } from '@kemsu/graphql-server';
import { dbConfig } from '../config';

export const pool = new Pool(dbConfig);