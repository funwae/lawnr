import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/notification_service.dart';
import 'firebase_messaging_handler.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'navigation/app_router.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/homeowner/home_screen.dart';
import 'screens/contractor/contractor_home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase (optional - won't crash if not configured)
  try {
    await Firebase.initializeApp();
    // Initialize notification service
    await NotificationService().initialize();
    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    // Firebase not configured - app will work without push notifications
    print('Firebase initialization skipped: $e');
  }

  runApp(const LawnrApp());
}

class LawnrApp extends StatelessWidget {
  const LawnrApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        Provider(create: (_) => ApiService()),
      ],
      child: MaterialApp.router(
        title: 'Lawnr',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.green,
          primaryColor: const Color(0xFF00FF00), // Neon green
          scaffoldBackgroundColor: Colors.black,
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF00FF00),
            secondary: Color(0xFF00FF00),
            surface: Color(0xFF1A1A1A),
            background: Colors.black,
          ),
          textTheme: const TextTheme(
            headlineLarge: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
            bodyLarge: TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00FF00),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        routerConfig: AppRouter.router,
      ),
    );
  }
}

