import { Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import { submitContractTx, simulateContractRead } from './transactions';

export async function createEvent(
  organizerPubKey: string,
  eventId: bigint,
  metadataRef: string,
  onStatus?: (status: string) => void,
) {
  const args = [
    new Address(organizerPubKey).toScVal(),
    nativeToScVal(eventId, { type: 'u64' }),
    nativeToScVal(metadataRef, { type: 'string' }),
  ];

  const hash = await submitContractTx('create_event', args, organizerPubKey, onStatus);
  return hash;
}

export async function issueTicket(
  organizerPubKey: string,
  eventId: bigint,
  ticketId: bigint,
  recipientPubKey: string,
  onStatus?: (status: string) => void,
) {
  const args = [
    new Address(organizerPubKey).toScVal(),
    nativeToScVal(eventId, { type: 'u64' }),
    nativeToScVal(ticketId, { type: 'u64' }),
    new Address(recipientPubKey).toScVal(),
  ];

  const hash = await submitContractTx('issue_ticket', args, organizerPubKey, onStatus);
  return hash;
}

export async function checkIn(
  operatorPubKey: string,
  ticketId: bigint,
  onStatus?: (status: string) => void,
) {
  const args = [new Address(operatorPubKey).toScVal(), nativeToScVal(ticketId, { type: 'u64' })];

  const hash = await submitContractTx('check_in', args, operatorPubKey, onStatus);
  return hash;
}

export async function deactivateEvent(
  organizerPubKey: string,
  eventId: bigint,
  onStatus?: (status: string) => void,
) {
  const args = [new Address(organizerPubKey).toScVal(), nativeToScVal(eventId, { type: 'u64' })];

  const hash = await submitContractTx('deactivate_event', args, organizerPubKey, onStatus);
  return hash;
}

export async function getTicket(ticketId: bigint) {
  const args = [nativeToScVal(ticketId, { type: 'u64' })];

  try {
    const val = await simulateContractRead('get_ticket', args);
    const native = scValToNative(val);
    return native;
  } catch (err: any) {
    if (err.message.includes('Error(Contract, #5)')) {
      throw new Error('Ticket not found');
    }
    throw err;
  }
}

export async function verifyTicket(ticketId: bigint) {
  const args = [nativeToScVal(ticketId, { type: 'u64' })];

  try {
    console.log('VERIFY TICKET ID:', ticketId.toString());

    const val = await simulateContractRead('verify_ticket', args);

    console.log('VERIFY RAW SCVAL:', val);

    const native = scValToNative(val);

    console.log('VERIFY NATIVE RESULT:', native);

    return native;
  } catch (err: any) {
    console.error('VERIFY TICKET ERROR:', err);

    if (err.message?.includes('Error(Contract, #5)')) {
      throw new Error('Ticket not found');
    }

    throw err;
  }
}
