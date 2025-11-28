import 'dart:math' as math;
import 'package:latlong2/latlong.dart';

class RouteService {
  static const double _earthRadiusKm = 6371.0;

  /// Calculate distance between two points using Haversine formula
  static double calculateDistance(LatLng point1, LatLng point2) {
    final lat1Rad = point1.latitude * (math.pi / 180);
    final lat2Rad = point2.latitude * (math.pi / 180);
    final deltaLatRad = (point2.latitude - point1.latitude) * (math.pi / 180);
    final deltaLonRad = (point2.longitude - point1.longitude) * (math.pi / 180);

    final a = math.sin(deltaLatRad / 2) * math.sin(deltaLatRad / 2) +
        math.cos(lat1Rad) *
            math.cos(lat2Rad) *
            math.sin(deltaLonRad / 2) *
            math.sin(deltaLonRad / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));

    return _earthRadiusKm * c;
  }

  /// Calculate total distance for a route
  static double calculateRouteDistance(List<LatLng> waypoints) {
    if (waypoints.length < 2) return 0.0;

    double totalDistance = 0.0;
    for (int i = 0; i < waypoints.length - 1; i++) {
      totalDistance += calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return totalDistance;
  }

  /// Estimate travel time (assuming average speed of 50 km/h)
  static String estimateTravelTime(double distanceKm) {
    const double averageSpeedKmh = 50.0;
    final hours = distanceKm / averageSpeedKmh;
    final minutes = (hours * 60).round();

    if (minutes < 60) {
      return '$minutes min';
    } else {
      final hrs = minutes ~/ 60;
      final mins = minutes % 60;
      return mins > 0 ? '$hrs h $mins min' : '$hrs h';
    }
  }

  /// Generate route points between waypoints (simplified - straight lines)
  static List<LatLng> generateRoutePoints(List<LatLng> waypoints) {
    if (waypoints.length < 2) return waypoints;

    List<LatLng> routePoints = [];
    for (int i = 0; i < waypoints.length - 1; i++) {
      routePoints.add(waypoints[i]);
      // Add intermediate points for smoother line (simplified)
      final steps = 10;
      for (int j = 1; j < steps; j++) {
        final ratio = j / steps;
        final lat = waypoints[i].latitude +
            (waypoints[i + 1].latitude - waypoints[i].latitude) * ratio;
        final lon = waypoints[i].longitude +
            (waypoints[i + 1].longitude - waypoints[i].longitude) * ratio;
        routePoints.add(LatLng(lat, lon));
      }
    }
    routePoints.add(waypoints.last);
    return routePoints;
  }
}


