"use client";

import React, { useEffect, useState } from "react";
import { useFreighter } from "../../../hooks/useFreighter";
import { issueTicket } from "../../../lib/stellar/contract";
import { QRCodeSVG } from "qrcode.react";

export default function EventDetails({ params }: { params: { id: string } }) {
  const { id } = params;
  const { pubKey, connect } = useFreighter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [recipient, setRecipient] = useState("");
  const [issueStatus, setIssueStatus] = useState("");
  const [issuedTicket, setIssuedTicket] = useState<{ ticketId: string, eventId: string } | null>(null);
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    fetch(`http://localhost:3001/api/events/${id}`)
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      setIssueStatus("Connect wallet first!");
      return;
    }
    if (!event.blockchain_id) {
      setIssueStatus("This event is not linked to a blockchain ID. Issue ticket failed.");
      return;
    }

    setIssueStatus("Preparing blockchain transaction...");
    setTxHash("");

    try {
      const ticketId = BigInt(Date.now());
      const eventId = BigInt(event.blockchain_id);

      const hash = await issueTicket(
        pubKey,
        eventId,
        ticketId,
        recipient,
        (s) => setIssueStatus(`Blockchain status: ${s}`)
      );

      setTxHash(hash);
      setIssueStatus("Success! Ticket issued on-chain.");
      setIssuedTicket({
        ticketId: ticketId.toString(),
        eventId: eventId.toString()
      });
      setRecipient("");
    } catch (err: any) {
      console.error(err);
      setIssueStatus("Blockchain transaction failed: " + err.message);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (!event) return <div className="text-center py-20 text-red-500">Event not found</div>;

  if (issuedTicket) {
    console.log(
      "QR VALUE:",
      `${window.location.origin}/ticket/${issuedTicket.ticketId}`
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
        <p className="text-gray-500 mb-6">{event.description}</p>

        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Date</p>
            <p className="text-gray-900">{event.date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Venue</p>
            <p className="text-gray-900">{event.venue}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500 font-medium mb-1">Organizer</p>
            <p className="text-gray-900 font-mono text-sm break-all bg-white p-2 border rounded">
              {event.organizer_address}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500 font-medium mb-1">Blockchain Event ID</p>
            <p className="text-gray-900 font-mono text-sm">
              {event.blockchain_id || "Not synced on-chain"}
            </p>
          </div>
        </div>
      </div>

      {/* Issuance Area */}
      {pubKey === event.organizer_address ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Issue Ticket</h2>
          <p className="text-gray-500 mb-6">Send a blockchain-verifiable ticket to an attendee.</p>

          <form onSubmit={handleIssueTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Public Key</label>
              <input required type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary" placeholder="G..." />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-white rounded-md font-medium hover:bg-cyan-500 transition-colors">
              Issue Ticket on Soroban
            </button>
          </form>

          {issueStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm text-center ${issueStatus.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {issueStatus}
            </div>
          )}
          {txHash && (
            <div className="mt-2 p-3 bg-green-50 text-green-700 rounded-md text-sm text-center break-all font-mono">
              Tx Hash: {txHash}
            </div>
          )}

          {issuedTicket && (
            <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Ticket Generated
              </h3>

              <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                <QRCodeSVG
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/ticket/${issuedTicket.ticketId}`}
                  size={200}
                />
              </div>

              <p className="text-sm text-gray-500 text-center max-w-sm mb-3">
                Scan this QR code to open and verify the ticket directly against
                the Stellar blockchain.
              </p>

              <p className="text-xs text-gray-400 font-mono break-all text-center">
                {window.location.origin}/ticket/{issuedTicket.ticketId}
              </p>
            </div>
          )}
        </div>
      ) : pubKey ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center p-6 bg-yellow-50 text-yellow-700 rounded-lg">
            You are connected as <span className="font-mono">{pubKey.substring(0, 5)}...</span> but you are not the organizer of this event. Only the organizer can issue tickets.
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center text-gray-500">
            Connect wallet to see if you can issue tickets.
          </div>
        </div>
      )}
    </div>
  );
}
