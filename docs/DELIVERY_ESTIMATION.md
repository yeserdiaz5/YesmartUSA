# Geolocation-Based Delivery Time Estimation

This feature provides real-time delivery time estimates based on the buyer's and seller's geolocation.

## Features

- **Automatic Geolocation**: Requests browser permission to get buyer's location
- **Distance Calculation**: Uses Haversine formula for accurate distance between coordinates
- **Configurable Parameters**: Delivery speed and preparation time can be adjusted via environment variables
- **Multiple Display Modes**: Full card view for product pages, compact view for checkout
- **Error Handling**: Graceful fallbacks for permission denied or location unavailable

## API Endpoint

### `POST /api/delivery-estimate`

Calculate delivery time estimation based on seller and buyer coordinates.

**Request Body:**
```json
{
  "sellerId": "uuid-of-seller",
  "lat": 25.7617,
  "lng": -80.1918
}
```

**Response (Success - 200):**
```json
{
  "distance_km": 40.48,
  "estimated_minutes": 75,
  "method": "geolocation",
  "seller_name": "TechGear Pro"
}
```

## Environment Variables

Configure these in your `.env.local` file or in Vercel's environment settings:

```env
# Optional: Average delivery speed in km/h (default: 40)
DELIVERY_SPEED_KMH=40

# Optional: Preparation time before delivery in minutes (default: 15)
PREP_TIME_MINUTES=15
```

## Testing

### Run Unit Tests

```bash
npx tsx tests/utils/deliveryEstimate.test.js
```

### Manual Testing with curl

```bash
curl -X POST http://localhost:3000/api/delivery-estimate \
  -H "Content-Type: application/json" \
  -d '{"sellerId": "seller-uuid-here", "lat": 25.7617, "lng": -80.1918}'
```
