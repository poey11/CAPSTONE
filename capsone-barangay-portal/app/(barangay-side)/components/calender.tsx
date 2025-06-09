// Calendar.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventInput } from '@fullcalendar/core';
import { useRouter } from 'next/navigation';
import { EventContentArg } from '@fullcalendar/core';

type Appointment = {
    id: string;
    title: string;
    date: string; // format: 'YYYY-MM-DD'
    requestStatus?: string; // Optional field for 
    statusPriority?: number; // Optional field for sorting
}

type Props = {
    appointments: Appointment[];
}




const AppointmentCalendar: React.FC<Props> = ({ appointments }) => {
  const router = useRouter();
  const events: EventInput[] = appointments.map(appt => ({
    id: appt.id,
    title: appt.title,
    date: appt.date,
    extendedProps: {
      requestStatus: appt.requestStatus // Optional field for sorting
    }
  }));
  
  const eventClassName = ({event}: { event: any }) => {
    const status = event.extendedProps.requestStatus;
    const base = ['cursor-pointer', 'text-white', 'rounded', 'px-2', 'py-1'];

    switch (status) {
      case 'Pending':
        return [...base, 'bg-blue-500'];
      case 'Pick-up':
        return [...base, 'bg-fuchsia-500'];
      case 'Completed':
        return [...base, 'bg-green-600', 'line-through', 'opacity-70'];
      case 'Rejected':
        return [...base, 'bg-red-500', 'line-through', 'opacity-70'];
      default:
        return [...base, 'bg-gray-400'];
    }

  }
  const renderEventContent = (eventInfo: EventContentArg) => {
    const status = eventInfo.event.extendedProps.requestStatus;
    const isCrossedOut = status === 'Completed' || status === 'Rejected';
    return (
      <div className="truncate">
        <span className={isCrossedOut ? 'line-through' : ''}>
          {eventInfo.event.title}
        </span>
      </div>
    );
  };
  const hanndleClickEvent = (info: any) => {
    const appointmentId = info.event.id;
    router.push(`/dashboard/ServicesModule/OnlineRequests/ViewRequest?id=${appointmentId}`);
  }

  return (
    <div className="p-4 bg-white shadow rounded">
      <FullCalendar
        key={JSON.stringify(appointments)} // to re-render when appointments change
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={hanndleClickEvent}
        eventClassNames={eventClassName}
        eventContent={renderEventContent}  // 👈 add this line
        height="auto"
      />

    </div>
  );
};



export default AppointmentCalendar;