import 'package:flutter_test/flutter_test.dart';
import 'package:lawnr/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const LawnrApp());

    // Verify app renders
    expect(find.byType(LawnrApp), findsOneWidget);
  });
}

