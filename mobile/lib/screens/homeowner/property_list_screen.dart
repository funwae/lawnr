import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../components/media_gallery_widget.dart';

class PropertyListScreen extends StatefulWidget {
  const PropertyListScreen({super.key});

  @override
  State<PropertyListScreen> createState() => _PropertyListScreenState();
}

class _PropertyListScreenState extends State<PropertyListScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _properties = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties() async {
    try {
      setState(() => _isLoading = true);
      final response = await _apiService.getProperties();
      setState(() {
        _properties = response['properties'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading properties: $e')),
        );
      }
    }
  }

  String _formatAddress(dynamic property) {
    final parts = <String>[];
    if (property['address_line1'] != null) parts.add(property['address_line1']);
    if (property['city'] != null) parts.add(property['city']);
    if (property['province'] != null) parts.add(property['province']);
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Properties'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              final result = await context.push('/properties/add');
              if (result != null) {
                _loadProperties();
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _properties.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.home_outlined,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No properties yet',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await context.push('/properties/add');
                          if (result != null) {
                            _loadProperties();
                          }
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Add Your First Property'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadProperties,
                  child: ListView.builder(
                    itemCount: _properties.length,
                    itemBuilder: (context, index) {
                      final property = _properties[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: InkWell(
                          onTap: () {
                            context.push('/properties/${property['id']}');
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _formatAddress(property),
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    if (property['yard_size_estimate'] != null)
                                      Chip(
                                        label: Text(
                                          property['yard_size_estimate']
                                              .toString()
                                              .toUpperCase(),
                                          style: const TextStyle(fontSize: 10),
                                        ),
                                        backgroundColor: const Color(0xFF00FF00)
                                            .withOpacity(0.2),
                                      ),
                                  ],
                                ),
                                if (property['postal_code'] != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    property['postal_code'],
                                    style: const TextStyle(color: Colors.grey),
                                  ),
                                ],
                                if (property['yard_notes'] != null) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    property['yard_notes'],
                                    style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 12,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    TextButton.icon(
                                      onPressed: () {
                                        context.push(
                                          '/properties/${property['id']}/request',
                                        );
                                      },
                                      icon: const Icon(Icons.add_task),
                                      label: const Text('Request Service'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

