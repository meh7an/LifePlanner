import CalendarEvent from "../models/CalendarEvent.js";

// CREATE a new calendar event
export const createCalendarEvent = async (eventData) => {
  const event = new CalendarEvent(eventData);
  return await event.save();
};

// READ: Get all events for a specific calendar
export const getEventsByCalendar = async (calendarId) => {
  return await CalendarEvent.find({ calendarId });
};

// UPDATE an event by eventId
export const updateCalendarEvent = async (eventId, updateData) => {
  return await CalendarEvent.findOneAndUpdate({ eventId }, updateData, {
    new: true,
  });
};

// DELETE an event by eventId
export const deleteCalendarEvent = async (eventId) => {
  return await CalendarEvent.findOneAndDelete({ eventId });
};
