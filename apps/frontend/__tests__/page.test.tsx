import { render, screen, waitFor } from '@testing-library/react'
import Home from '../app/page'

// Mock fetch
global.fetch = jest.fn()

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the hero section correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
    })

    render(<Home />)

    expect(screen.getByText('Discover Next-Gen Events')).toBeInTheDocument()
    expect(screen.getByText('Organizer Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Verify a Ticket')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
    })

    render(<Home />)
    expect(screen.getByText('Loading events...')).toBeInTheDocument()
  })

  it('renders a list of events when fetched successfully', async () => {
    const mockEvents = [
      {
        id: '1',
        name: 'Stellar Meetup',
        date: '2026-10-10',
        venue: 'Tech Hub',
        description: 'A great meetup about Stellar',
        organizer_address: 'GABC123',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockEvents),
    })

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Stellar Meetup')).toBeInTheDocument()
      expect(screen.getByText('📅 2026-10-10')).toBeInTheDocument()
      expect(screen.getByText('📍 Tech Hub')).toBeInTheDocument()
    })
  })

  it('displays empty state when no events exist', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
    })

    render(<Home />)

    await waitFor(() => {
      expect(
        screen.getByText('No events found. Be the first to create one!')
      ).toBeInTheDocument()
    })
  })
})
