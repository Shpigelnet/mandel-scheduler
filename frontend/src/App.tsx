import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Home from './pages/Home';
import SchedulingTable from './pages/SchedulingTable';
import CalendarPage from './pages/CalendarPage';
import StaffPage from './pages/StaffPage';
import CoursesPage from './pages/CoursesPage';

export default function App() {
  return (
    <div className="flex min-h-screen bg-cream" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-x-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduling" element={<SchedulingTable />} />
          <Route path="/calendar/:calendarTypeId" element={<CalendarPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/courses" element={<CoursesPage />} />
        </Routes>
      </main>
    </div>
  );
}
