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
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <AssignmentsList />
        <div className="grid lg:grid-cols-2 gap-6 flex-1">
          <ActiveHoursHistogram />
          <UpcomingEvents />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;