import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';

class JobCalendar extends StatefulWidget {
  final Map<DateTime, List<dynamic>> jobsByDate;
  final Function(DateTime, List<dynamic>)? onDaySelected;
  final DateTime? focusedDay;
  final DateTime? selectedDay;

  const JobCalendar({
    super.key,
    required this.jobsByDate,
    this.onDaySelected,
    this.focusedDay,
    this.selectedDay,
  });

  @override
  State<JobCalendar> createState() => _JobCalendarState();
}

class _JobCalendarState extends State<JobCalendar> {
  late DateTime _focusedDay;
  late DateTime _selectedDay;
  CalendarFormat _calendarFormat = CalendarFormat.month;

  @override
  void initState() {
    super.initState();
    _focusedDay = widget.focusedDay ?? DateTime.now();
    _selectedDay = widget.selectedDay ?? DateTime.now();
  }

  @override
  Widget build(BuildContext context) {
    return TableCalendar(
      firstDay: DateTime.utc(2020, 1, 1),
      lastDay: DateTime.utc(2030, 12, 31),
      focusedDay: _focusedDay,
      selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
      calendarFormat: _calendarFormat,
      onFormatChanged: (format) {
        setState(() {
          _calendarFormat = format;
        });
      },
      onDaySelected: (selectedDay, focusedDay) {
        setState(() {
          _selectedDay = selectedDay;
          _focusedDay = focusedDay;
        });
        final jobs = widget.jobsByDate[selectedDay] ?? [];
        widget.onDaySelected?.call(selectedDay, jobs);
      },
      onPageChanged: (focusedDay) {
        setState(() {
          _focusedDay = focusedDay;
        });
      },
      eventLoader: (day) {
        return widget.jobsByDate[day] ?? [];
      },
      calendarStyle: CalendarStyle(
        todayDecoration: BoxDecoration(
          color: Colors.green.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        selectedDecoration: const BoxDecoration(
          color: Colors.green,
          shape: BoxShape.circle,
        ),
        markerDecoration: const BoxDecoration(
          color: Colors.green,
          shape: BoxShape.circle,
        ),
        outsideDaysVisible: false,
      ),
      headerStyle: const HeaderStyle(
        formatButtonVisible: true,
        titleCentered: true,
        formatButtonShowsNext: false,
      ),
      startingDayOfWeek: StartingDayOfWeek.monday,
    );
  }
}

