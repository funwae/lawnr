import 'package:flutter/material.dart';
import '../../components/media_upload_widget.dart';
import '../../services/api_service.dart';

class ServiceRequestScreen extends StatefulWidget {
  final String propertyId;

  const ServiceRequestScreen({
    super.key,
    required this.propertyId,
  });

  @override
  State<ServiceRequestScreen> createState() => _ServiceRequestScreenState();
}

class _ServiceRequestScreenState extends State<ServiceRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _notesController = TextEditingController();

  final List<String> _availableServices = [
    'mowing',
    'hedge_trimming',
    'cleanup',
    'fertilizing',
    'edging',
    'mulching',
  ];

  final Set<String> _selectedServices = {};
  String _schedulePreference = 'ASAP';
  DateTime? _preferredDate;
  TimeOfDay? _preferredTimeFrom;
  TimeOfDay? _preferredTimeTo;
  bool _isLoading = false;
  List<String> _uploadedMediaUrls = [];

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null) {
      setState(() {
        _preferredDate = picked;
      });
    }
  }

  Future<void> _selectTimeFrom() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) {
      setState(() {
        _preferredTimeFrom = picked;
      });
    }
  }

  Future<void> _selectTimeTo() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(
        hour: _preferredTimeFrom?.hour ?? 9,
        minute: (_preferredTimeFrom?.minute ?? 0) + 60,
      ),
    );
    if (picked != null) {
      setState(() {
        _preferredTimeTo = picked;
      });
    }
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one service')),
      );
      return;
    }

    if (_schedulePreference == 'scheduled' && _preferredDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a preferred date')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final requestData = {
        'property_id': widget.propertyId,
        'requested_services': _selectedServices.toList(),
        'schedule_preference': _schedulePreference,
        'preferred_date': _schedulePreference == 'scheduled' && _preferredDate != null
            ? _preferredDate!.toIso8601String().split('T')[0]
            : null,
        'preferred_time_from': _preferredTimeFrom != null
            ? '${_preferredTimeFrom!.hour.toString().padLeft(2, '0')}:${_preferredTimeFrom!.minute.toString().padLeft(2, '0')}'
            : null,
        'preferred_time_to': _preferredTimeTo != null
            ? '${_preferredTimeTo!.hour.toString().padLeft(2, '0')}:${_preferredTimeTo!.minute.toString().padLeft(2, '0')}'
            : null,
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        'media_urls': _uploadedMediaUrls,
      };

      final response = await _apiService.createServiceRequest(requestData);

      if (mounted) {
        Navigator.pop(context, response['request']);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Service request submitted! Contractors will be notified.'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error submitting request: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Service'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Service selection
              const Text(
                'Select Services *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _availableServices.map((service) {
                  final isSelected = _selectedServices.contains(service);
                  return FilterChip(
                    label: Text(service.replaceAll('_', ' ').toUpperCase()),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          _selectedServices.add(service);
                        } else {
                          _selectedServices.remove(service);
                        }
                      });
                    },
                    selectedColor: const Color(0xFF00FF00).withOpacity(0.3),
                    checkmarkColor: const Color(0xFF00FF00),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Schedule preference
              const Text(
                'Schedule Preference *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'ASAP',
                    label: Text('ASAP'),
                    icon: Icon(Icons.flash_on),
                  ),
                  ButtonSegment(
                    value: 'scheduled',
                    label: Text('Schedule'),
                    icon: Icon(Icons.calendar_today),
                  ),
                ],
                selected: {_schedulePreference},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() {
                    _schedulePreference = newSelection.first;
                  });
                },
              ),

              // Date and time selection (if scheduled)
              if (_schedulePreference == 'scheduled') ...[
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _selectDate,
                        icon: const Icon(Icons.calendar_today),
                        label: Text(
                          _preferredDate != null
                              ? '${_preferredDate!.month}/${_preferredDate!.day}/${_preferredDate!.year}'
                              : 'Select Date',
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _selectTimeFrom,
                        icon: const Icon(Icons.access_time),
                        label: Text(
                          _preferredTimeFrom != null
                              ? _preferredTimeFrom!.format(context)
                              : 'From',
                        ),
                      ),
                    ),
                  ],
                ),
                if (_preferredTimeFrom != null) ...[
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: _selectTimeTo,
                    icon: const Icon(Icons.access_time),
                    label: Text(
                      _preferredTimeTo != null
                          ? _preferredTimeTo!.format(context)
                          : 'To (Optional)',
                    ),
                  ),
                ],
              ],

              const SizedBox(height: 24),

              // Notes
              TextFormField(
                controller: _notesController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Special Instructions (Optional)',
                  hintText: 'Gate code, pets, access instructions...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
              ),

              const SizedBox(height: 24),

              // Media upload
              const Text(
                'Add Photos/Video (Optional)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Upload photos or video of your yard to help contractors provide accurate quotes.',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 16),

              MediaUploadWidget(
                propertyId: widget.propertyId,
                onMediaSelected: (urls) {
                  setState(() {
                    _uploadedMediaUrls = urls;
                  });
                },
              ),

              const SizedBox(height: 32),

              // Submit button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitRequest,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Submit Request'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

