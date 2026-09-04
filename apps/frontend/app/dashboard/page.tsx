'use client';

import React, { useState } from 'react';
import { useFreighter } from '../../hooks/useFreighter';
import { createEvent, issueTicket, deactivateEvent } from '../../lib/stellar/contract';

export default function Dashboard() {
  const { pubKey, connect } = useFreighter();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [desc, setDesc] = useState('');

  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  const [eventId, setEventId] = useState('');
  const [recipient, setRecipient] = useState('');

  const [issueMessage, setIssueMessage] = useState('');
  const [issuedTicketId, setIssuedTicketId] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [deactivateMessage, setDeactivateMessage] = useState('');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pubKey) {
      setStatus('Connect wallet first!');
      return;
    }

    try {
      setIsCreating(true);
      setStatus('Saving metadata...');
      setTxHash('');

      const res = await fetch('http://localhost:3001/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          date,
          venue,
          description: desc,
          organizer_address: pubKey,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save metadata');
      }

      const data = await res.json();
      const metadataRef = data.id;

      // Generate blockchain Event ID
      const generatedEventId = BigInt(Date.now());

      setStatus('Metadata saved. Preparing blockchain transaction...');

      const hash = await createEvent(pubKey, generatedEventId, metadataRef, (s) =>
        setStatus(`Blockchain status: ${s}`),
      );

      // Save blockchain ID in backend
      await fetch(`http://localhost:3001/api/events/${metadataRef}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockchain_id: generatedEventId.toString(),
        }),
      });

      // Automatically select this event for ticket issuance
      setEventId(generatedEventId.toString());

      setTxHash(hash);

      setStatus(`Event created successfully. Event ID: ${generatedEventId.toString()}`);

      // Clear event form
      setName('');
      setDate('');
      setVenue('');
      setDesc('');
    } catch (err: any) {
      console.error(err);

      setStatus('Blockchain transaction failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleIssueTicket = async () => {
    if (!pubKey) {
      setIssueMessage('Connect wallet first!');
      return;
    }

    if (!eventId || !recipient) {
      setIssueMessage('Enter the Event ID and Recipient Wallet.');
      return;
    }

    try {
      setIsIssuing(true);
      setStatus('Preparing ticket issuance...');
      setIssueMessage('');
      setIssuedTicketId('');

      // Automatically generate Ticket ID
      const generatedTicketId = BigInt(Date.now());

      const hash = await issueTicket(pubKey, BigInt(eventId), generatedTicketId, recipient, (s) =>
        setStatus(s),
      );

      setIssuedTicketId(generatedTicketId.toString());

      setIssueMessage(
        `Ticket issued successfully!\n\nTicket #${generatedTicketId}\n\nTx Hash: ${hash}`,
      );

      setStatus('Ticket issued successfully.');
    } catch (error: any) {
      console.error(error);

      setIssueMessage(`Ticket issuance failed: ${error?.message || 'Unknown error'}`);

      setStatus('');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleDeactivateEvent = async () => {
    if (!pubKey) {
      setDeactivateMessage('Connect wallet first!');
      return;
    }

    if (!eventId) {
      setDeactivateMessage('Enter the Event ID to deactivate.');
      return;
    }

    try {
      setIsDeactivating(true);
      setStatus('Preparing event deactivation...');
      setDeactivateMessage('');

      const hash = await deactivateEvent(pubKey, BigInt(eventId), (s) => setStatus(s));

      setDeactivateMessage(`Event deactivated successfully!\n\nTx Hash: ${hash}`);

      setStatus('Event deactivated successfully.');
    } catch (error: any) {
      console.error(error);

      setDeactivateMessage(`Event deactivation failed: ${error?.message || 'Unknown error'}`);

      setStatus('');
    } finally {
      setIsDeactivating(false);
    }
  };

  const ticketUrl = issuedTicketId ? `${window.location.origin}/ticket/${issuedTicketId}` : '';

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>

          <p className="text-gray-600 mt-1">Manage your events and tickets</p>

          <div className="mt-3">
            {!pubKey ? (
              <button onClick={connect} className="px-4 py-2 bg-gray-900 text-white rounded-md">
                Connect Freighter
              </button>
            ) : (
              <span className="text-sm font-mono text-gray-600">
                {pubKey.substring(0, 6)}...
                {pubKey.substring(pubKey.length - 4)}
              </span>
            )}
          </div>
        </div>

        {/* CREATE EVENT */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Create New Event</h3>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>

              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>

                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>

                <input
                  required
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>

              <textarea
                required
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>

            <button
              type="submit"
              disabled={!pubKey || isCreating}
              className="w-full py-3 bg-primary text-white rounded-md font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isCreating && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isCreating ? 'Deploying...' : 'Deploy Event to Soroban'}
            </button>

            {status && (
              <div
                className={`p-3 rounded-md text-sm text-center ${
                  status.includes('failed')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {status}
              </div>
            )}

            {txHash && (
              <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm text-center break-all font-mono">
                Tx Hash: {txHash}
              </div>
            )}
          </form>
        </div>

        {/* ISSUE TICKET */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Issue Ticket</h3>

          <div className="space-y-4">
            {/* EVENT ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event ID</label>

              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Create an event first"
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />

              {eventId && <p className="text-xs text-green-600 mt-1">✓ Event selected</p>}
            </div>

            {/* RECIPIENT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Wallet
              </label>

              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="G..."
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>

            {/* ISSUE */}
            <button
              onClick={handleIssueTicket}
              disabled={!pubKey || !eventId || !recipient || isIssuing}
              className="w-full py-3 bg-primary text-white rounded-md font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isIssuing && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isIssuing ? 'Issuing...' : 'Issue Ticket'}
            </button>

            {/* RESULT */}
            {issueMessage && (
              <div
                className={`p-4 rounded-md text-sm text-center whitespace-pre-line break-all font-mono ${
                  issueMessage.includes('failed')
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {issueMessage}
              </div>
            )}

            {/* VIEW TICKET */}
            {issuedTicketId && (
              <div className="border border-green-200 bg-green-50 rounded-xl p-5 text-center">
                <p className="text-green-800 font-bold text-lg">🎟️ Ticket Ready</p>

                <p className="text-sm text-green-700 mt-1">Ticket #{issuedTicketId}</p>

                <a
                  href={ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
                >
                  View Ticket
                </a>

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(ticketUrl)}
                  className="block w-full mt-3 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-100"
                >
                  Copy Ticket Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DEACTIVATE EVENT */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-red-600">Deactivate Event</h3>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Deactivating an event prevents any further tickets from being checked in. This action
              requires the event organizer&apos;s signature.
            </p>

            {/* EVENT ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event ID</label>

              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Enter Event ID"
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>

            <button
              onClick={handleDeactivateEvent}
              disabled={!pubKey || !eventId || isDeactivating}
              className="w-full py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isDeactivating && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isDeactivating ? 'Deactivating...' : 'Deactivate Event'}
            </button>

            {/* RESULT */}
            {deactivateMessage && (
              <div
                className={`p-4 rounded-md text-sm text-center whitespace-pre-line break-all font-mono ${
                  deactivateMessage.includes('failed')
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {deactivateMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
