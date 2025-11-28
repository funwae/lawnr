import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../components/faq_item.dart';

class FAQScreen extends StatefulWidget {
  const FAQScreen({super.key});

  @override
  State<FAQScreen> createState() => _FAQScreenState();
}

class _FAQScreenState extends State<FAQScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _faqs = [];
  List<String> _categories = [];
  String? _selectedCategory;
  String _searchQuery = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadFAQs();
    _loadCategories();
  }

  Future<void> _loadFAQs() async {
    try {
      setState(() => _loading = true);
      final queryParams = <String>[];
      if (_selectedCategory != null) {
        queryParams.add('category=$_selectedCategory');
      }
      if (_searchQuery.isNotEmpty) {
        queryParams.add('search=$_searchQuery');
      }
      final query = queryParams.isEmpty ? '' : '?${queryParams.join('&')}';

      final response = await _apiService.getFAQs(query);
      setState(() {
        _faqs = response['faqs'] ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading FAQs: $e')),
        );
      }
    }
  }

  Future<void> _loadCategories() async {
    try {
      final response = await _apiService.getFAQsCategories();
      setState(() {
        _categories = List<String>.from(response['categories'] ?? []);
      });
    } catch (e) {
      // Ignore category loading errors
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FAQ'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.green,
      ),
      body: Column(
        children: [
          // Search and filter
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.black87,
            child: Column(
              children: [
                TextField(
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                    _loadFAQs();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search FAQs...',
                    prefixIcon: const Icon(Icons.search, color: Colors.green),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.grey[900],
                  ),
                  style: const TextStyle(color: Colors.white),
                ),
                if (_categories.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildCategoryChip(null, 'All'),
                        ..._categories.map((cat) => _buildCategoryChip(cat, cat)),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // FAQ List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Colors.green))
                : _faqs.isEmpty
                    ? const Center(
                        child: Text(
                          'No FAQs found',
                          style: TextStyle(color: Colors.white70),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _faqs.length,
                        itemBuilder: (context, index) {
                          return FAQItem(faq: _faqs[index]);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String? category, String label) {
    final isSelected = _selectedCategory == category;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _selectedCategory = selected ? category : null;
          });
          _loadFAQs();
        },
        selectedColor: Colors.green,
        labelStyle: TextStyle(
          color: isSelected ? Colors.black : Colors.white,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }
}

