import 'package:flutter/material.dart';

class FAQItem extends StatefulWidget {
  final Map<String, dynamic> faq;

  const FAQItem({super.key, required this.faq});

  @override
  State<FAQItem> createState() => _FAQItemState();
}

class _FAQItemState extends State<FAQItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.grey[900],
      child: ExpansionTile(
        title: Text(
          widget.faq['question'] ?? 'Question',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          widget.faq['category'] ?? '',
          style: const TextStyle(
            color: Colors.green,
            fontSize: 12,
          ),
        ),
        trailing: Icon(
          _isExpanded ? Icons.expand_less : Icons.expand_more,
          color: Colors.green,
        ),
        onExpansionChanged: (expanded) {
          setState(() {
            _isExpanded = expanded;
          });
        },
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              widget.faq['answer'] ?? '',
              style: const TextStyle(
                color: Colors.white70,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

