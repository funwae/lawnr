import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class JobMapMarker {
  static Marker create({
    required LatLng position,
    required String jobId,
    required String status,
    required VoidCallback onTap,
  }) {
    Color markerColor;
    IconData iconData;

    switch (status) {
      case 'scheduled':
        markerColor = Colors.blue;
        iconData = Icons.schedule;
        break;
      case 'on_way':
      case 'started':
        markerColor = Colors.orange;
        iconData = Icons.directions_car;
        break;
      case 'completed':
        markerColor = Colors.green;
        iconData = Icons.check_circle;
        break;
      case 'cancelled':
        markerColor = Colors.red;
        iconData = Icons.cancel;
        break;
      default:
        markerColor = Colors.grey;
        iconData = Icons.place;
    }

    return Marker(
      point: position,
      width: 50,
      height: 50,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: markerColor,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(
            iconData,
            color: Colors.white,
            size: 24,
          ),
        ),
      ),
    );
  }
}

