"use client";

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { verifyTicket } from "../../../lib/stellar/contract";

interface Ticket {
  id: bigint;
  event_id: bigint;
  owner: string;
  issued_at: bigint;
  checked_in: boolean;
}

export default function TicketPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const { ticketId } = params;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTicket = async () => {
      try {
        setLoading(true);
        setError("");

        const result: any = await verifyTicket(BigInt(ticketId));

        console.log("TICKET PAGE RESULT:", result);

        let normalized: Ticket;

        if (Array.isArray(result)) {
          normalized = {
            id: BigInt(result[0]),
            event_id: BigInt(result[1]),
            owner: result[2],
            issued_at: BigInt(result[3]),
            checked_in: result[4] === true,
          };
        } else if (result instanceof Map) {
          normalized = {
            id: BigInt(result.get("id")),
            event_id: BigInt(result.get("event_id")),
            owner: result.get("owner"),
            issued_at: BigInt(result.get("issued_at")),
            checked_in: result.get("checked_in") === true,
          };
        } else {
          normalized = {
            id: BigInt(result.id),
            event_id: BigInt(result.event_id),
            owner: result.owner,
            issued_at: BigInt(result.issued_at),
            checked_in: result.checked_in === true,
          };
        }

        setTicket(normalized);
      } catch (err: any) {
        console.error("TICKET LOAD ERROR:", err);
        setError(err?.message || "Unable to verify ticket");
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md w-full">
          <div className="text-4xl mb-4">⛓️</div>

          <h1 className="text-xl font-bold text-gray-900">
            Verifying Ticket
          </h1>

          <p className="text-gray-500 mt-2">
            Checking ticket {ticketId} directly against Stellar Soroban Testnet...
          </p>

          <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">❌</div>

          <h1 className="text-2xl font-bold text-red-800">
            Invalid Ticket
          </h1>

          <p className="text-red-600 mt-3">
            {error || "This ticket could not be found on-chain."}
          </p>

          <p className="text-xs text-gray-400 mt-6">
            Ticket ID: {ticketId}
          </p>
        </div>
      </main>
    );
  }

  /*
   * The QR contains the ticket URL.
   *
   * During local development this should be your LAN address,
   * for example:
   *
   * http://10.148.109.208:3000/ticket/1011
   *
   * NEXT_PUBLIC_APP_URL should be changed when the app is deployed.
   */
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

  const qrPayload = `${appUrl}/ticket/${ticket.id.toString()}`;

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="bg-gray-950 text-white rounded-t-3xl px-6 py-8 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400 font-semibold">
            StellarPass
          </p>

          <h1 className="text-3xl font-bold mt-3">
            Digital Ticket
          </h1>

          <p className="text-gray-400 mt-2 text-sm">
            Blockchain-verified event ticket
          </p>
        </div>

        {/* Ticket body */}
        <div className="bg-white px-6 py-8">

          {/* Status */}
          {ticket.checked_in ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">
                ⚠️
              </div>

              <h2 className="font-bold text-red-800 text-lg">
                ALREADY CHECKED IN
              </h2>

              <p className="text-sm text-red-600 mt-2">
                This ticket has already been used for entry.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">
                ✅
              </div>

              <h2 className="font-bold text-green-800 text-lg">
                VALID TICKET
              </h2>

              <p className="text-sm text-green-600 mt-2">
                This ticket is valid for entry.
              </p>
            </div>
          )}

          {/* QR Code */}
          <div className="mt-8 text-center">
            <h2 className="text-lg font-bold text-gray-900">
              Entry QR Code
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Present this code at the event entrance.
            </p>

            <div className="mt-5 flex justify-center">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <QRCodeSVG
                  value={qrPayload}
                  size={240}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4 break-all">
              Ticket #{ticket.id.toString()}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 my-8" />

          {/* Ticket information */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Ticket Information
            </h2>

            <div className="space-y-5">

              {/* Ticket ID */}
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Ticket ID
                </p>

                <p className="font-mono text-gray-900 mt-1 text-lg">
                  {ticket.id.toString()}
                </p>
              </div>

              {/* Event ID */}
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Event ID
                </p>

                <p className="font-mono text-gray-900 mt-1 break-all">
                  {ticket.event_id.toString()}
                </p>
              </div>

              {/* Owner */}
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Ticket Owner
                </p>

                <p className="font-mono text-xs text-gray-700 mt-1 break-all bg-gray-50 rounded-lg p-3">
                  {ticket.owner}
                </p>
              </div>

              {/* Issued At */}
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Issued At
                </p>

                <p className="font-mono text-gray-900 mt-1">
                  {ticket.issued_at.toString()}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 rounded-b-3xl px-6 py-6 text-center">
          <p className="text-xs text-gray-500">
            Verified directly against Stellar Soroban Testnet.
          </p>

          <p className="text-xs text-gray-400 mt-2">
            StellarPass MVP • Blockchain-verified ticketing
          </p>
        </div>

      </div>
    </main>
  );
}