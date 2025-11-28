import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class QuoteReviewScreen extends StatefulWidget {
  final String requestId;

  const QuoteReviewScreen({
    super.key,
    required this.requestId,
  });

  @override
  State<QuoteReviewScreen> createState() => _QuoteReviewScreenState();
}

class _QuoteReviewScreenState extends State<QuoteReviewScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _request;
  List<dynamic> _quotes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRequest();
  }

  Future<void> _loadRequest() async {
    try {
      final response = await _apiService.getServiceRequest(widget.requestId);
      setState(() {
        _request = response['request'];
        _quotes = response['quotes'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading quotes: $e')),
        );
      }
    }
  }

  Future<void> _acceptQuote(String quoteId) async {
    try {
      final response = await _apiService.acceptQuote(
        widget.requestId,
        quoteId,
      );

      if (mounted) {
        Navigator.pop(context, response);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Quote accepted! Job scheduled.'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error accepting quote: $e')),
        );
      }
    }
  }

  String _formatPrice(double price) {
    return '\$${price.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quotes & Bids'),
      ),
      body: _quotes.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.request_quote,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No quotes yet',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Contractors will be notified and can submit quotes.',
                    style: TextStyle(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadRequest,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _quotes.length,
                itemBuilder: (context, index) {
                  final quote = _quotes[index];
                  final contractorName = quote['contractor_name'] ??
                                        quote['business_name'] ??
                                        'Contractor';
                  final price = quote['quoted_price'] ?? 0.0;
                  final breakdown = quote['breakdown'] ?? {};

                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: const Color(0xFF00FF00),
                                child: Text(
                                  contractorName[0].toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      contractorName,
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    if (quote['business_name'] != null)
                                      Text(
                                        quote['business_name'],
                                        style: const TextStyle(
                                          color: Colors.grey,
                                          fontSize: 14,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Text(
                                _formatPrice(price),
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00FF00),
                                ),
                              ),
                            ],
                          ),
                          if (breakdown.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            const Divider(),
                            const SizedBox(height: 8),
                            if (breakdown['hours'] != null)
                              _buildBreakdownItem('Hours', breakdown['hours'].toString()),
                            if (breakdown['materials'] != null)
                              _buildBreakdownItem(
                                'Materials',
                                _formatPrice(breakdown['materials']),
                              ),
                            if (breakdown['extras'] != null)
                              _buildBreakdownItem(
                                'Extras',
                                _formatPrice(breakdown['extras']),
                              ),
                          ],
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () => _acceptQuote(quote['id']),
                              child: const Text('Accept Quote'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildBreakdownItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.grey),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

