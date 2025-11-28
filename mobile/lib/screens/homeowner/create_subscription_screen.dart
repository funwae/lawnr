import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class CreateSubscriptionScreen extends StatefulWidget {
  const CreateSubscriptionScreen({super.key});

  @override
  State<CreateSubscriptionScreen> createState() => _CreateSubscriptionScreenState();
}

class _CreateSubscriptionScreenState extends State<CreateSubscriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _notesController = TextEditingController();

  String? _selectedPropertyId;
  String? _selectedContractorId;
  final List<String> _availableServices = [
    'mowing',
    'hedge_trimming',
    'cleanup',
    'fertilizing',
    'edging',
    'mulching',
  ];
  final Set<String> _selectedServices = {};
  String _frequency = 'weekly';
  int? _customFrequencyValue;
  DateTime? _nextServiceDate;
  TimeOfDay? _preferredTimeFrom;
  TimeOfDay? _preferredTimeTo;
  double? _quotedPrice;
  bool _autoAcceptQuote = false;
  bool _isLoading = false;

  List<dynamic> _properties = [];
  List<dynamic> _contractors = [];

  @override
  void initState() {
    super.initState();
    _loadProperties();
    _loadContractors();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadProperties() async {
    try {
      final response = await _apiService.getProperties();
      setState(() {
        _properties = response['properties'] ?? [];
        if (_properties.isNotEmpty && _selectedPropertyId == null) {
          _selectedPropertyId = _properties[0]['id'];
        }
      });
    } catch (e) {
      print('Error loading properties: $e');
    }
  }

  Future<void> _loadContractors() async {
    try {
      final response = await _apiService.searchContractors();
      setState(() {
        _contractors = response['contractors'] ?? [];
      });
    } catch (e) {
      print('Error loading contractors: $e');
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _nextServiceDate = picked;
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

  Future<void> _submitSubscription() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedPropertyId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a property')),
      );
      return;
    }

    if (_selectedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one service')),
      );
      return;
    }

    if (_nextServiceDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select next service date')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final subscriptionData = {
        'property_id': _selectedPropertyId,
        'contractor_id': _selectedContractorId,
        'service_types': _selectedServices.toList(),
        'frequency': _frequency,
        'frequency_value': _frequency == 'custom' ? _customFrequencyValue : null,
        'next_service_date': _nextServiceDate!.toIso8601String().split('T')[0],
        'preferred_time_from': _preferredTimeFrom != null
            ? '${_preferredTimeFrom!.hour.toString().padLeft(2, '0')}:${_preferredTimeFrom!.minute.toString().padLeft(2, '0')}'
            : null,
        'preferred_time_to': _preferredTimeTo != null
            ? '${_preferredTimeTo!.hour.toString().padLeft(2, '0')}:${_preferredTimeTo!.minute.toString().padLeft(2, '0')}'
            : null,
        'quoted_price': _quotedPrice,
        'auto_accept_quote': _autoAcceptQuote,
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      };

      await _apiService.createSubscription(subscriptionData);

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Recurring service created successfully!'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating subscription: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Recurring Service'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Property selection
              DropdownButtonFormField<String>(
                value: _selectedPropertyId,
                decoration: const InputDecoration(
                  labelText: 'Property *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.home),
                ),
                items: _properties.map((property) {
                  return DropdownMenuItem<String>(
                    value: property['id']?.toString(),
                    child: Text(
                      property['address_line1'] ?? 'Property',
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedPropertyId = value;
                  });
                },
                validator: (value) {
                  if (value == null) {
                    return 'Please select a property';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Contractor selection (optional)
              DropdownButtonFormField<String>(
                value: _selectedContractorId,
                decoration: const InputDecoration(
                  labelText: 'Preferred Contractor (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                items: [
                  const DropdownMenuItem(
                    value: null,
                    child: Text('Any Contractor'),
                  ),
                  ..._contractors.map((contractor) {
                    return DropdownMenuItem(
                      value: contractor['id'],
                      child: Text(
                        contractor['business_name'] ?? contractor['full_name'] ?? 'Contractor',
                      ),
                    );
                  }),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedContractorId = value;
                  });
                },
              ),
              const SizedBox(height: 24),

              // Service selection
              const Text(
                'Services *',
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

              // Frequency
              const Text(
                'Frequency *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'weekly', label: Text('Weekly')),
                  ButtonSegment(value: 'biweekly', label: Text('Bi-weekly')),
                  ButtonSegment(value: 'monthly', label: Text('Monthly')),
                ],
                selected: {_frequency},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() {
                    _frequency = newSelection.first;
                  });
                },
              ),
              if (_frequency == 'custom') ...[
                const SizedBox(height: 16),
                TextFormField(
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Every N weeks',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _customFrequencyValue = int.tryParse(value);
                    });
                  },
                ),
              ],
              const SizedBox(height: 24),

              // Next service date
              const Text(
                'Next Service Date *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _selectDate,
                icon: const Icon(Icons.calendar_today),
                label: Text(
                  _nextServiceDate != null
                      ? '${_nextServiceDate!.month}/${_nextServiceDate!.day}/${_nextServiceDate!.year}'
                      : 'Select Date',
                ),
              ),
              const SizedBox(height: 16),

              // Preferred time
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _selectTimeFrom,
                      icon: const Icon(Icons.access_time),
                      label: Text(
                        _preferredTimeFrom != null
                            ? _preferredTimeFrom!.format(context)
                            : 'From (Optional)',
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _selectTimeTo,
                      icon: const Icon(Icons.access_time),
                      label: Text(
                        _preferredTimeTo != null
                            ? _preferredTimeTo!.format(context)
                            : 'To (Optional)',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Price (optional)
              TextFormField(
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Expected Price (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                  prefixText: '\$',
                ),
                onChanged: (value) {
                  setState(() {
                    _quotedPrice = double.tryParse(value);
                  });
                },
              ),
              const SizedBox(height: 16),

              // Auto-accept quote
              CheckboxListTile(
                value: _autoAcceptQuote,
                onChanged: (value) {
                  setState(() {
                    _autoAcceptQuote = value ?? false;
                  });
                },
                title: const Text('Auto-accept quotes from preferred contractor'),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              const SizedBox(height: 16),

              // Notes
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Notes (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
              ),
              const SizedBox(height: 32),

              // Submit button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitSubscription,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Create Recurring Service'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

