import DashboardHeader from "@/components/DashboardHeader";
import OverviewCards from "@/components/OverviewCards";
import UpcomingEvents from "@/components/UpcomingEvents";
import AssignmentsList from "@/components/AssignmentsList";
import ActiveHoursHistogram from "@/components/ActiveHoursHistogram";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Dashboard = () => {
  return (
    <div className="flex h-full flex-col p-4 pb-2">
      <DashboardHeader />
      <OverviewCards />
      <div className="grid gap-6 lg:grid-cols-6 flex-1 min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          <AssignmentsList />
          <ActiveHoursHistogram />
        </div>
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <UpcomingEvents />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;