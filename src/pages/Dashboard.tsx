import DashboardHeader from "@/components/DashboardHeader";
import OverviewCards from "@/components/OverviewCards";
import UpcomingEvents from "@/components/UpcomingEvents";
import AssignmentsList from "@/components/AssignmentsList";
import ActiveHoursHistogram from "@/components/ActiveHoursHistogram";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Dashboard = () => {
  return (
    <div className="flex h-full flex-col p-4">
      <DashboardHeader />
      <OverviewCards />
      <div className="grid gap-6 lg:grid-cols-5 flex-1 mb-6"> {/* Changed to lg:grid-cols-5 */}
        <div className="lg:col-span-3 flex flex-col gap-6"> {/* Changed to lg:col-span-3 */}
          <ActiveHoursHistogram />
          <AssignmentsList />
        </div>
        <div className="lg:col-span-2 flex flex-col"> {/* Changed to lg:col-span-2 */}
          <UpcomingEvents />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;