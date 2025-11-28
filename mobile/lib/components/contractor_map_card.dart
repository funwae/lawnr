import 'package:flutter/material.dart';

class ContractorMapCard extends StatelessWidget {
  final String businessName;
  final String? description;
  final double? rating;
  final int ratingCount;
  final double? baseRate;
  final List<String> serviceTypes;
  final VoidCallback onViewDetails;
  final VoidCallback onClose;

  const ContractorMapCard({
    super.key,
    required this.businessName,
    this.description,
    this.rating,
    this.ratingCount = 0,
    this.baseRate,
    this.serviceTypes = const [],
    required this.onViewDetails,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      color: Colors.black87,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    businessName,
                    style: const TextStyle(
                      color: Colors.green,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: onClose,
                ),
              ],
            ),
            if (description != null) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (rating != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.yellow, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${rating!.toStringAsFixed(1)} ($ratingCount reviews)',
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                ],
              ),
            ],
            if (baseRate != null) ...[
              const SizedBox(height: 8),
              Text(
                '\$${baseRate!.toStringAsFixed(2)}/hour',
                style: const TextStyle(color: Colors.green, fontSize: 14),
              ),
            ],
            if (serviceTypes.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 4,
                runSpacing: 4,
                children: serviceTypes.take(3).map((service) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: Colors.green),
                    ),
                    child: Text(
                      service,
                      style: const TextStyle(color: Colors.green, fontSize: 12),
                    ),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onViewDetails,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.black,
                ),
                child: const Text('View Details'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

