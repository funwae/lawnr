import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class ExpenseLogScreen extends StatefulWidget {
  final String? jobId;

  const ExpenseLogScreen({super.key, this.jobId});

  @override
  State<ExpenseLogScreen> createState() => _ExpenseLogScreenState();
}

class _ExpenseLogScreenState extends State<ExpenseLogScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();

  String _expenseType = 'fuel';
  DateTime? _expenseDate;
  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _expenseTypes = [
    {'value': 'fuel', 'label': 'Fuel', 'icon': Icons.local_gas_station},
    {'value': 'materials', 'label': 'Materials', 'icon': Icons.construction},
    {'value': 'equipment', 'label': 'Equipment', 'icon': Icons.build},
    {'value': 'labor', 'label': 'Labor', 'icon': Icons.person},
    {'value': 'other', 'label': 'Other', 'icon': Icons.more_horiz},
  ];

  @override
  void initState() {
    super.initState();
    _expenseDate = DateTime.now();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _expenseDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _expenseDate = picked;
      });
    }
  }

  Future<void> _submitExpense() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final expenseData = {
        'job_id': widget.jobId,
        'expense_type': _expenseType,
        'description': _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        'amount': double.parse(_amountController.text),
        'expense_date': _expenseDate!.toIso8601String().split('T')[0],
      };

      await _apiService.createExpense(expenseData);

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Expense logged successfully'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error logging expense: $e')),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Log Expense'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Expense type
              const Text(
                'Expense Type *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _expenseTypes.map((type) {
                  final isSelected = _expenseType == type['value'];
                  return FilterChip(
                    avatar: Icon(
                      type['icon'] as IconData,
                      size: 18,
                      color: isSelected ? Colors.black : Colors.grey,
                    ),
                    label: Text(type['label'] as String),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _expenseType = type['value'] as String;
                      });
                    },
                    selectedColor: const Color(0xFF00FF00).withOpacity(0.3),
                    checkmarkColor: const Color(0xFF00FF00),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Amount
              TextFormField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Amount *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                  prefixText: '\$',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Amount is required';
                  }
                  final amount = double.tryParse(value);
                  if (amount == null || amount <= 0) {
                    return 'Please enter a valid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Date
              const Text(
                'Date *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _selectDate,
                icon: const Icon(Icons.calendar_today),
                label: Text(
                  _expenseDate != null
                      ? '${_expenseDate!.month}/${_expenseDate!.day}/${_expenseDate!.year}'
                      : 'Select Date',
                ),
              ),
              const SizedBox(height: 16),

              // Description
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description (Optional)',
                  hintText: 'Add notes about this expense...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
              ),
              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitExpense,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Log Expense'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

