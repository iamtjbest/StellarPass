import { rpc } from '@stellar/stellar-sdk';
import { STELLAR_RPC_URL } from './config';

export const server = new rpc.Server(STELLAR_RPC_URL, { allowHttp: true });
