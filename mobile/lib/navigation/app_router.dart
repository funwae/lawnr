import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/homeowner/home_screen.dart';
import '../screens/homeowner/property_list_screen.dart';
import '../screens/homeowner/add_property_screen.dart';
import '../screens/homeowner/property_detail_screen.dart';
import '../screens/homeowner/service_request_screen.dart';
import '../screens/homeowner/quote_review_screen.dart';
import '../screens/homeowner/job_tracking_screen.dart';
import '../screens/homeowner/payment_screen.dart';
import '../screens/homeowner/review_screen.dart';
import '../screens/homeowner/subscription_list_screen.dart';
import '../screens/homeowner/create_subscription_screen.dart';
import '../screens/notifications/notification_center_screen.dart';
import '../screens/support/support_screen.dart';
import '../screens/support/dispute_screen.dart';
import '../screens/contractor/contractor_home_screen.dart';
import '../screens/contractor/contractor_profile_setup_screen.dart';
import '../screens/contractor/incoming_requests_screen.dart';
import '../screens/contractor/quote_submission_screen.dart';
import '../screens/contractor/job_workflow_screen.dart';
import '../screens/contractor/expense_log_screen.dart';
import '../screens/contractor/analytics_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final authService = Provider.of<AuthService>(context, listen: false);
      final isAuthenticated = authService.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login' ||
                          state.matchedLocation == '/register';

      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }
      if (isAuthenticated && isLoginRoute) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) {
          final authService = Provider.of<AuthService>(context, listen: false);
          if (authService.userRole == 'contractor') {
            return const ContractorHomeScreen();
          }
          return const HomeScreen();
        },
      ),
      // Homeowner routes
      GoRoute(
        path: '/properties',
        builder: (context, state) => const PropertyListScreen(),
      ),
      GoRoute(
        path: '/properties/add',
        builder: (context, state) => const AddPropertyScreen(),
      ),
      GoRoute(
        path: '/properties/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return PropertyDetailScreen(propertyId: id);
        },
      ),
      GoRoute(
        path: '/properties/:id/request',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ServiceRequestScreen(propertyId: id);
        },
      ),
      GoRoute(
        path: '/requests/:id/quotes',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return QuoteReviewScreen(requestId: id);
        },
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return JobTrackingScreen(jobId: id);
        },
      ),
      GoRoute(
        path: '/jobs/:id/payment',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final amount = double.tryParse(state.uri.queryParameters['amount'] ?? '0') ?? 0.0;
          return PaymentScreen(jobId: id, amount: amount);
        },
      ),
      GoRoute(
        path: '/jobs/:id/review',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final contractorId = state.uri.queryParameters['contractor_id'] ?? '';
          return ReviewScreen(jobId: id, contractorId: contractorId);
        },
      ),
      // Notifications
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationCenterScreen(),
      ),
      // Subscriptions
      GoRoute(
        path: '/subscriptions',
        builder: (context, state) => const SubscriptionListScreen(),
      ),
      GoRoute(
        path: '/subscriptions/create',
        builder: (context, state) => const CreateSubscriptionScreen(),
      ),
      // Support & Disputes
      GoRoute(
        path: '/support',
        builder: (context, state) => const SupportScreen(),
      ),
      GoRoute(
        path: '/disputes/:jobId',
        builder: (context, state) {
          final jobId = state.pathParameters['jobId']!;
          return DisputeScreen(jobId: jobId);
        },
      ),
      // Contractor routes
      GoRoute(
        path: '/contractor/profile/setup',
        builder: (context, state) => const ContractorProfileSetupScreen(),
      ),
      GoRoute(
        path: '/contractor/requests',
        builder: (context, state) => const IncomingRequestsScreen(),
      ),
      GoRoute(
        path: '/requests/:id/quote',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return QuoteSubmissionScreen(requestId: id);
        },
      ),
      GoRoute(
        path: '/jobs/:id/workflow',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return JobWorkflowScreen(jobId: id);
        },
      ),
      GoRoute(
        path: '/expenses/log',
        builder: (context, state) {
          final jobId = state.uri.queryParameters['job_id'];
          return ExpenseLogScreen(jobId: jobId);
        },
      ),
      GoRoute(
        path: '/analytics',
        builder: (context, state) => const AnalyticsScreen(),
      ),
    ],
  );
}

