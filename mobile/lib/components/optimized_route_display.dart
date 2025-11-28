import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'route_display.dart';
import '../services/route_service.dart';

class OptimizedRouteDisplay extends StatelessWidget {
  final List<Map<String, dynamic>> jobs;
  final List<LatLng> optimizedWaypoints;
  final double totalDistance;
  final int estimatedTime;

  const OptimizedRouteDisplay({
    super.key,
    required this.jobs,
    required this.optimizedWaypoints,
    required this.totalDistance,
    required this.estimatedTime,
  });

  @override
  Widget build(BuildContext context) {
    final routePoints = RouteService.generateRoutePoints(optimizedWaypoints);
    final estimatedTimeStr = RouteService.estimateTravelTime(totalDistance);

    return Column(
      children: [
        Expanded(
          child: RouteDisplay(
            waypoints: optimizedWaypoints,
            routePoints: routePoints,
            totalDistance: totalDistance,
            estimatedTime: estimatedTimeStr,
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.black87,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Optimized Route Order',
                style: TextStyle(
                  color: Colors.green,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...optimizedWaypoints.asMap().entries.map((entry) {
                final index = entry.key;
                final waypoint = entry.value;
                final job = jobs.firstWhere(
                  (j) =>
                      (j['property']?['latitude'] == waypoint.latitude &&
                          j['property']?['longitude'] == waypoint.longitude) ||
                      (j['id'] == waypoint.id),
                  orElse: () => <String, dynamic>{},
                );

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[900],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: const TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              job['property']?['address_line1'] ?? 'Unknown Address',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (job['scheduled_date'] != null)
                              Text(
                                'Date: ${job['scheduled_date']}',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }
}

