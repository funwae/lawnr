import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:lawnr/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('end-to-end test', () {
    testWidgets('app launches and shows login screen', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify login screen appears
      expect(find.text('Login'), findsOneWidget);
    });
  });
}

