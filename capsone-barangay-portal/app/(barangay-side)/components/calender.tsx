// Calendar.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventInput } from '@fullcalendar/core';

type Appointment = {
    id: string;
    title: string;
    date: string; // format: 'YYYY-MM-DD'
}

type Props = {
    appointments: Appointment[];
}

const AppointmentCalendar: React.FC<Props> = ({ appointments }) => {
  const events: EventInput[] = appointments.map(appt => ({
    id: appt.id,
    title: appt.title,
    date: appt.date,
  }));

  return (
    <div className="p-4 bg-white shadow rounded">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
      />
    </div>
  );
};

export default AppointmentCalendar;