import { http, HttpResponse } from 'msw';

const TRACKER_BASE = 'https://api.easypost.com/v2/trackers';

function makeTracker(id: string, trackingCode: string) {
  return {
    id,
    object: 'Tracker',
    mode: 'test',
    tracking_code: trackingCode,
    status: 'in_transit',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    signed_by: null,
    weight: null,
    est_delivery_date: '2024-01-05T00:00:00Z',
    shipment_id: null,
    carrier: 'USPS',
    tracking_details: [
      {
        object: 'TrackingDetail',
        message: 'Arrived at facility',
        description: '',
        status: 'in_transit',
        datetime: '2024-01-02T10:00:00Z',
        source: 'USPS',
        carrier_code: '',
        tracking_location: {
          object: 'TrackingLocation',
          city: 'Los Angeles',
          state: 'CA',
          country: 'US',
          zip: '90001',
        },
      },
    ],
    carrier_detail: {
      object: 'CarrierDetail',
      service: 'Priority',
      container_type: null,
      est_delivery_date_local: null,
      est_delivery_time_local: null,
    },
    public_url: `https://track.easypost.com/djE6${id}`,
    fees: [],
  };
}

export const easypostHandlers = [
  // POST /v2/trackers — create tracker
  http.post(`${TRACKER_BASE}`, async ({ request }) => {
    const body = await request.json() as { tracker?: { tracking_code?: string } };
    const trackingCode = body?.tracker?.tracking_code ?? 'TEST123456789';
    const id = `trk_${Date.now()}`;
    return HttpResponse.json({ tracker: makeTracker(id, trackingCode) }, { status: 201 });
  }),

  // GET /v2/trackers/:id — retrieve tracker
  http.get(`${TRACKER_BASE}/:id`, ({ params }) => {
    const id = params['id'] as string;
    return HttpResponse.json(makeTracker(id, 'TEST123456789'));
  }),

  // POST /v2/trackers/:id/refresh — refresh tracker (not a real EasyPost endpoint, but included per spec)
  http.post(`${TRACKER_BASE}/:id/refresh`, ({ params }) => {
    const id = params['id'] as string;
    return HttpResponse.json(makeTracker(id, 'TEST123456789'));
  }),
];
