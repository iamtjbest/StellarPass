"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface EventMetadata {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string;
  organizer_address: string;
}

export default function Home() {
  const [events, setEvents] = useState<EventMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch events", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Discover Next-Gen Events</h2>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          StellarPass uses Soroban smart contracts to issue verifiable, fraud-proof digital tickets.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard" className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-cyan-500 transition-colors">
            Organizer Dashboard
          </Link>
          <Link href="/verify" className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Verify a Ticket
          </Link>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h3>
        {loading ? (
          <p className="text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500">No events found. Be the first to create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="h-48 bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center">
                    <span className="text-4xl">🎟️</span>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>📅 {event.date}</span>
                      <span>📍 {event.venue}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
