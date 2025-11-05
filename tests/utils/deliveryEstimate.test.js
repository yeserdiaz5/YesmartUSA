/**
 * Tests for Delivery Estimate Utilities
 * Run with: npx tsx tests/utils/deliveryEstimate.test.js
 */

import assert from "assert"
import {
  calculateDistance,
  calculateDeliveryTime,
  validateCoordinates,
  parseSellerCoordinates,
} from "../../lib/utils/deliveryEstimate"

console.log("🧪 Running Delivery Estimate Tests...\n")

// Test 1: Calculate distance between Miami and Fort Lauderdale
console.log("Test 1: Calculate distance")
const miamiLat = 25.7617
const miamiLng = -80.1918
const ftLauderdaleLat = 26.1224
const ftLauderdaleLng = -80.1373

const distance = calculateDistance(miamiLat, miamiLng, ftLauderdaleLat, ftLauderdaleLng)
console.log(`  Distance between Miami and Fort Lauderdale: ${distance} km`)
assert(distance > 40 && distance < 45, `Expected ~43 km, got ${distance} km`)
console.log("  ✅ Distance calculation passed\n")

// Test 2: Calculate distance between same points (should be 0)
console.log("Test 2: Distance between same points")
const sameDistance = calculateDistance(miamiLat, miamiLng, miamiLat, miamiLng)
console.log(`  Distance: ${sameDistance} km`)
assert(sameDistance === 0, `Expected 0 km, got ${sameDistance} km`)
console.log("  ✅ Same point distance test passed\n")

// Test 3: Calculate delivery time with defaults
console.log("Test 3: Calculate delivery time with defaults")
const time1 = calculateDeliveryTime(40) // 40 km with default speed (40 km/h) and prep time (15 min)
console.log(`  Delivery time for 40 km: ${time1} minutes`)
// Expected: 15 min prep + 60 min travel = 75 min
assert(time1 === 75, `Expected 75 minutes, got ${time1} minutes`)
console.log("  ✅ Delivery time calculation passed\n")

// Test 4: Calculate delivery time with custom parameters
console.log("Test 4: Calculate delivery time with custom parameters")
const time2 = calculateDeliveryTime(60, 30, 10) // 60 km at 30 km/h with 10 min prep
console.log(`  Delivery time for 60 km at 30 km/h with 10 min prep: ${time2} minutes`)
// Expected: 10 min prep + 120 min travel = 130 min
assert(time2 === 130, `Expected 130 minutes, got ${time2} minutes`)
console.log("  ✅ Custom delivery time calculation passed\n")

// Test 5: Validate coordinates - valid cases
console.log("Test 5: Validate coordinates - valid cases")
assert(validateCoordinates(0, 0) === true, "Origin should be valid")
assert(validateCoordinates(90, 180) === true, "Max positive values should be valid")
assert(validateCoordinates(-90, -180) === true, "Max negative values should be valid")
assert(validateCoordinates(25.7617, -80.1918) === true, "Miami coordinates should be valid")
console.log("  ✅ Valid coordinates test passed\n")

// Test 6: Validate coordinates - invalid cases
console.log("Test 6: Validate coordinates - invalid cases")
assert(validateCoordinates(91, 0) === false, "Latitude > 90 should be invalid")
assert(validateCoordinates(-91, 0) === false, "Latitude < -90 should be invalid")
assert(validateCoordinates(0, 181) === false, "Longitude > 180 should be invalid")
assert(validateCoordinates(0, -181) === false, "Longitude < -180 should be invalid")
assert(validateCoordinates(NaN, 0) === false, "NaN latitude should be invalid")
assert(validateCoordinates(0, NaN) === false, "NaN longitude should be invalid")
console.log("  ✅ Invalid coordinates test passed\n")

// Test 7: Parse seller coordinates - valid cases
console.log("Test 7: Parse seller coordinates - valid cases")
const addr1 = { latitude: 25.7617, longitude: -80.1918 }
const coords1 = parseSellerCoordinates(addr1)
assert(coords1 !== null, "Should parse coordinates from latitude/longitude")
assert(coords1.latitude === 25.7617, "Latitude should match")
assert(coords1.longitude === -80.1918, "Longitude should match")

const addr2 = { lat: 26.1224, lng: -80.1373 }
const coords2 = parseSellerCoordinates(addr2)
assert(coords2 !== null, "Should parse coordinates from lat/lng")
assert(coords2.latitude === 26.1224, "Latitude should match")
assert(coords2.longitude === -80.1373, "Longitude should match")
console.log("  ✅ Parse seller coordinates passed\n")

// Test 8: Parse seller coordinates - invalid cases
console.log("Test 8: Parse seller coordinates - invalid cases")
assert(parseSellerCoordinates(null) === null, "Null address should return null")
assert(parseSellerCoordinates({}) === null, "Empty object should return null")
assert(parseSellerCoordinates({ city: "Miami" }) === null, "Address without coords should return null")
assert(parseSellerCoordinates({ latitude: 91, longitude: 0 }) === null, "Invalid latitude should return null")
console.log("  ✅ Invalid seller coordinates test passed\n")

// Test 9: Real-world scenario - New York to Boston
console.log("Test 9: Real-world scenario - New York to Boston")
const nyLat = 40.7128
const nyLng = -74.0060
const bostonLat = 42.3601
const bostonLng = -71.0589

const nyBostonDistance = calculateDistance(nyLat, nyLng, bostonLat, bostonLng)
console.log(`  Distance NY to Boston: ${nyBostonDistance} km`)
assert(nyBostonDistance > 300 && nyBostonDistance < 320, `Expected ~306 km, got ${nyBostonDistance} km`)

const nyBostonTime = calculateDeliveryTime(nyBostonDistance, 80, 20) // Highway speed
console.log(`  Delivery time at 80 km/h with 20 min prep: ${nyBostonTime} minutes`)
// Expected: 20 + (306/80)*60 ≈ 20 + 229.5 = 250 min
assert(nyBostonTime > 240 && nyBostonTime < 260, `Expected ~250 minutes, got ${nyBostonTime} minutes`)
console.log("  ✅ Real-world scenario test passed\n")

console.log("✨ All tests passed successfully!")
