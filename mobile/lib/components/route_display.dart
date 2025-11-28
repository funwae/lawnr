import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import 'map_widget.dart';

class RouteDisplay extends StatelessWidget {
  final List<LatLng> waypoints;
  final List<LatLng> routePoints;
  final double totalDistance;
  final String estimatedTime;

  const RouteDisplay({
    super.key,
    required this.waypoints,
    required this.routePoints,
    required this.totalDistance,
    required this.estimatedTime,
  });

  const RouteDisplay({
    super.key,
    required this.waypoints,
    required this.routePoints,
    required this.totalDistance,
    required this.estimatedTime,
  });

  @override
  Widget build(BuildContext context) {
    final polylines = routePoints.isNotEmpty
        ? [
            Polyline(
              points: routePoints,
              strokeWidth: 4.0,
              color: Colors.green,
            ),
          ]
        : [];

    final markers = waypoints.asMap().entries.map((entry) {
      final index = entry.key;
      final point = entry.value;
      return Marker(
        point: point,
        width: 40,
        height: 40,
        child: Container(
          decoration: BoxDecoration(
            color: index == 0
                ? Colors.green
                : index == waypoints.length - 1
                    ? Colors.red
                    : Colors.blue,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
          child: Center(
            child: Text(
              '${index + 1}',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      );
    }).toList();

    final center = waypoints.isNotEmpty
        ? waypoints[waypoints.length ~/ 2]
        : const LatLng(45.5017, -73.5673);

    return Column(
      children: [
        Expanded(
          child: MapWidget(
            center: center,
            zoom: 12.0,
            markers: markers,
            polylines: polylines,
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.black87,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Column(
                children: [
                  const Text(
                    'Distance',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  Text(
                    '${totalDistance.toStringAsFixed(1)} km',
                    style: const TextStyle(
                      color: Colors.green,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Column(
                children: [
                  const Text(
                    'Est. Time',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  Text(
                    estimatedTime,
                    style: const TextStyle(
                      color: Colors.green,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

