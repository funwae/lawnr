/**
 * Route Optimization Service
 * Implements TSP (Traveling Salesman Problem) solver using Nearest Neighbor heuristic
 * with optional 2-opt improvement
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Nearest Neighbor algorithm for TSP
 * Returns optimized order of waypoints
 */
function nearestNeighbor(waypoints, startIndex = 0) {
  if (waypoints.length <= 1) return waypoints;

  const visited = new Set([startIndex]);
  const route = [waypoints[startIndex]];
  let currentIndex = startIndex;

  while (visited.size < waypoints.length) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (let i = 0; i < waypoints.length; i++) {
      if (visited.has(i)) continue;

      const distance = calculateDistance(
        waypoints[currentIndex].latitude,
        waypoints[currentIndex].longitude,
        waypoints[i].latitude,
        waypoints[i].longitude
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    if (nearestIndex !== -1) {
      visited.add(nearestIndex);
      route.push(waypoints[nearestIndex]);
      currentIndex = nearestIndex;
    }
  }

  return route;
}

/**
 * 2-opt improvement algorithm
 * Tries to improve route by swapping edges
 */
function twoOpt(waypoints, maxIterations = 100) {
  if (waypoints.length <= 2) return waypoints;

  let improved = true;
  let iterations = 0;
  let bestRoute = [...waypoints];
  let bestDistance = calculateTotalDistance(waypoints);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < waypoints.length - 1; i++) {
      for (let j = i + 2; j < waypoints.length; j++) {
        const newRoute = [...bestRoute];
        // Reverse segment between i and j
        const segment = newRoute.slice(i + 1, j + 1).reverse();
        newRoute.splice(i + 1, j - i, ...segment);

        const newDistance = calculateTotalDistance(newRoute);
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/**
 * Calculate total distance for a route
 */
function calculateTotalDistance(waypoints) {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(
      waypoints[i].latitude,
      waypoints[i].longitude,
      waypoints[i + 1].latitude,
      waypoints[i + 1].longitude
    );
  }
  return totalDistance;
}

/**
 * Estimate travel time (assuming average speed of 50 km/h)
 */
function estimateTravelTime(distanceKm) {
  const averageSpeedKmh = 50;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.round(hours * 60);
  return minutes;
}

/**
 * Optimize route for given waypoints
 * @param {Array} waypoints - Array of {latitude, longitude, id?}
 * @param {Object} options - {startIndex, use2Opt}
 * @returns {Object} - {optimizedRoute, totalDistance, estimatedTime}
 */
export function optimizeRoute(waypoints, options = {}) {
  if (!waypoints || waypoints.length === 0) {
    throw new Error("Waypoints array is required");
  }

  if (waypoints.length === 1) {
    return {
      optimizedRoute: waypoints,
      totalDistance: 0,
      estimatedTime: 0,
    };
  }

  const { startIndex = 0, use2Opt = true } = options;

  // Validate waypoints
  waypoints.forEach((wp, index) => {
    if (typeof wp.latitude !== "number" || typeof wp.longitude !== "number") {
      throw new Error(
        `Invalid waypoint at index ${index}: latitude and longitude must be numbers`
      );
    }
  });

  // Apply Nearest Neighbor algorithm
  let optimizedRoute = nearestNeighbor(waypoints, startIndex);

  // Apply 2-opt improvement if requested
  if (use2Opt && waypoints.length > 2) {
    optimizedRoute = twoOpt(optimizedRoute);
  }

  // Calculate metrics
  const totalDistance = calculateTotalDistance(optimizedRoute);
  const estimatedTime = estimateTravelTime(totalDistance);

  return {
    optimizedRoute,
    totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
    estimatedTime,
  };
}
