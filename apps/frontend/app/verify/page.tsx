'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useSearchParams } from 'next/navigation';
import { useFreighter } from '../../hooks/useFreighter';
import { verifyTicket, checkIn } from '../../lib/stellar/contract';

function VerifyContent() {
  const { pubKey, connect } = useFreighter();
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const verifyFromPayload = async (input: string) => {
    if (!input.trim()) return;

    setStatus('Verifying on Soroban Testnet...');
    setVerificationResult(null);
    setTxHash('');

    try {
      let ticketId: bigint;
      let expectedEventId: bigint | null = null;

      try {
        // First try JSON
        const parsed = JSON.parse(input);

        if (!parsed.ticketId || !parsed.eventId) {
          throw new Error('Invalid QR payload');
        }

        ticketId = BigInt(parsed.ticketId);
        expectedEventId = BigInt(parsed.eventId);
      } catch {
        // If it isn't JSON, try URL format
        const urlMatch = input.match(/\/ticket\/(\d+)/i);

        if (urlMatch) {
          ticketId = BigInt(urlMatch[1]);
          // expectedEventId remains null, will be pulled directly from on-chain data
        } else {
          // Fall back to human-readable text
          const ticketMatch = input.match(/Ticket\s*ID\s*:\s*(\d+)/i);
          const eventMatch = input.match(/Event\s*ID\s*:\s*(\d+)/i);

          if (!ticketMatch || !eventMatch) {
            throw new Error('Invalid ticket payload. Expected JSON, URL, or plain text.');
          }

          ticketId = BigInt(ticketMatch[1]);
          expectedEventId = BigInt(eventMatch[1]);
        }
      }

      console.log('VERIFYING TICKET:', ticketId.toString());
      if (expectedEventId !== null) {
        console.log('EXPECTED EVENT:', expectedEventId.toString());
      } else {
        console.log('EXPECTED EVENT: (Will be fetched from chain)');
      }

      // Query the actual Soroban contract
      const ticket: any = await verifyTicket(ticketId);

      console.log('ON-CHAIN TICKET:', ticket);

      let onChainEventId: bigint;
      let checkedIn: boolean;

      /*
       * scValToNative may decode the contract struct differently
       * depending on SDK version.
       */

      if (Array.isArray(ticket)) {
        onChainEventId = BigInt(ticket[1]);
        checkedIn = ticket[4] === true;
      } else if (ticket instanceof Map) {
        onChainEventId = BigInt(ticket.get('event_id'));
        checkedIn = ticket.get('checked_in') === true;
      } else {
        onChainEventId = BigInt(ticket.event_id);
        checkedIn = ticket.checked_in === true;
      }

      console.log('ON-CHAIN EVENT:', onChainEventId.toString());

      console.log('CHECKED IN:', checkedIn);

      // Make sure this ticket actually belongs to the supplied event (if provided)
      if (expectedEventId !== null && onChainEventId !== expectedEventId) {
        throw new Error('Ticket does not belong to this event');
      }

      setVerificationResult({
        valid: true,
        ticketId: ticketId.toString(),
        eventId: onChainEventId.toString(),
        checkedIn,
      });

      setStatus('');
    } catch (err: any) {
      console.error('VERIFICATION ERROR:', err);

      setVerificationResult({
        valid: false,
        error: err?.message || 'Ticket verification failed',
      });

      setStatus('');
    }
  };

  useEffect(() => {
    const ticket = searchParams.get('ticket');

    if (ticket) {
      const qrPayload = `${window.location.origin}/ticket/${ticket}`;
      setPayload(qrPayload);
      verifyFromPayload(qrPayload);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyFromPayload(payload);
  };

  const startScanner = async () => {
    try {
      setScanning(true);
      setStatus('Opening camera...');

      // First confirm that the browser can access the camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      // We only needed this stream to confirm permission.
      // html5-qrcode will create its own camera stream.
      stream.getTracks().forEach((track) => track.stop());

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          console.log('QR SCANNED:', decodedText);

          try {
            await scanner.stop();
            scanner.clear();
          } catch (err) {
            console.error('SCANNER STOP ERROR:', err);
          }

          scannerRef.current = null;
          setScanning(false);

          setPayload(decodedText);

          await verifyFromPayload(decodedText);
        },
        () => {
          // QR not detected yet. Ignore this.
        },
      );

      setStatus('Point your camera at the ticket QR code.');
    } catch (err: any) {
      console.error('SCANNER ERROR:', err);

      setScanning(false);
      scannerRef.current = null;

      setStatus(
        `Unable to start QR scanner: ${err?.name || 'Error'} - ${
          err?.message || 'Unknown camera error'
        }`,
      );
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('STOP SCANNER ERROR:', err);
    }

    setScanning(false);
    setStatus('');
  };

  const handleCheckIn = async () => {
    if (!pubKey) return alert('Connect wallet first!');
    setStatus('Preparing check-in transaction...');
    try {
      const hash = await checkIn(pubKey, BigInt(verificationResult.ticketId), (s) =>
        setStatus(`Blockchain status: ${s}`),
      );
      setTxHash(hash);
      setStatus('Check-in confirmed on blockchain!');

      // Query again to get the actual state
      const ticket: any = await verifyTicket(BigInt(verificationResult.ticketId));

      let isCheckedIn = false;
      if (Array.isArray(ticket)) {
        isCheckedIn = ticket[4] === true;
      } else if (ticket instanceof Map) {
        isCheckedIn = ticket.get('checked_in') === true;
      } else {
        isCheckedIn = ticket.checked_in === true;
      }

      setVerificationResult({
        ...verificationResult,
        checkedIn: isCheckedIn,
      });
    } catch (err: any) {
      console.error(err);
      setStatus('Check-in failed: ' + err.message);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Ticket Verification</h2>
        <p className="text-gray-500 mb-6">
          Scan an attendee&apos;s QR code or paste the payload here to verify on-chain.
        </p>

        <div className="mb-6">
          {!scanning ? (
            <button
              type="button"
              onClick={startScanner}
              className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              📷 Scan QR Code
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="w-full py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
            >
              ✕ Stop Scanner
            </button>
          )}

          {scanning && (
            <div className="mt-4">
              <div
                id="qr-reader"
                className="w-full overflow-hidden rounded-xl border border-gray-300"
              />

              <p className="text-sm text-gray-500 text-center mt-3">
                Point your camera at the attendee&apos;s QR code.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary font-mono text-sm"
            placeholder='{"ticketId": "123", "eventId": "456"}'
          />
          <button
            type="submit"
            className="w-full py-3 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            Verify on Blockchain
          </button>
        </form>

        {status && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm text-center font-medium">
            {status}
          </div>
        )}
        {txHash && (
          <div className="mt-2 p-3 bg-green-50 text-green-700 rounded-md text-sm text-center break-all font-mono">
            Tx Hash: {txHash}
          </div>
        )}
      </div>

      {verificationResult && (
        <div
          className={`p-8 rounded-xl shadow-sm border ${verificationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
        >
          <div className="flex items-center justify-center mb-6">
            <span className="text-4xl mr-3">{verificationResult.valid ? '✅' : '❌'}</span>
            <h3
              className={`text-2xl font-bold ${verificationResult.valid ? 'text-green-800' : 'text-red-800'}`}
            >
              {verificationResult.valid ? 'VALID TICKET' : 'INVALID TICKET'}
            </h3>
          </div>

          {verificationResult.valid ? (
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <p>
                <strong>Ticket ID:</strong> {verificationResult.ticketId}
              </p>
              <p>
                <strong>Event ID:</strong> {verificationResult.eventId}
              </p>
              <p className="mt-2">
                <strong>Status:</strong>{' '}
                {verificationResult.checkedIn ? (
                  <span className="text-red-600 font-bold ml-2">ALREADY CHECKED IN</span>
                ) : (
                  <span className="text-green-600 font-bold ml-2">VALID FOR ENTRY</span>
                )}
              </p>
            </div>
          ) : (
            <div className="bg-red-100 p-4 text-red-700 rounded-lg text-center font-medium">
              <p>{verificationResult.error}</p>
            </div>
          )}

          {verificationResult.valid && !verificationResult.checkedIn && (
            <div className="mt-8">
              <p className="text-sm text-green-700 mb-3 text-center">
                Only authorized operators can check in attendees.
              </p>
              {!pubKey ? (
                <button
                  onClick={connect}
                  className="w-full py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  Connect Wallet to Check-In
                </button>
              ) : (
                <button
                  onClick={handleCheckIn}
                  className="w-full py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  Perform On-Chain Check-In
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Verify() {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
