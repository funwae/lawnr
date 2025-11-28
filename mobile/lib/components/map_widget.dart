import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class MapWidget extends StatelessWidget {
  final LatLng? center;
  final double zoom;
  final List<Marker> markers;
  final List<Polyline> polylines;
  final Function(LatLng)? onTap;
  final bool interactive;

  const MapWidget({
    super.key,
    this.center,
    this.zoom = 13.0,
    this.markers = const [],
    this.polylines = const [],
    this.onTap,
    this.interactive = true,
  });

  @override
  Widget build(BuildContext context) {
    final defaultCenter = center ?? const LatLng(45.5017, -73.5673); // Montreal default

    return FlutterMap(
      mapController: MapController(),
      options: MapOptions(
        initialCenter: defaultCenter,
        initialZoom: zoom,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all,
        ),
        onTap: onTap != null
            ? (tapPosition, point) {
                onTap!(point);
              }
            : null,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.lawnr.app',
        ),
        if (polylines.isNotEmpty)
          PolylineLayer(
            polylines: polylines,
          ),
        if (markers.isNotEmpty)
          MarkerLayer(
            markers: markers,
          ),
      ],
    );
  }
}

