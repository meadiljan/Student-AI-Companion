import React from "react";
import DashboardHeader from "@/components/DashboardHeader";
import OverviewCards from "@/components/OverviewCards";
import UpcomingEvents from "@/components/UpcomingEvents";
import TasksList from "@/components/TasksList";
import ActiveHoursHistogram from "@/components/ActiveHoursHistogram";
import { useUser } from "@/contexts/UserContext";

const Dashboard = () => {
  const { user } = useUser();

  return (
    <div className="flex h-full flex-col p-4 pb-2">
      <DashboardHeader userName={user.name} userAvatar={user.avatar} />
      <OverviewCards />
      <div className="grid gap-6 lg:grid-cols-6 flex-1 min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <TasksList />
          <ActiveHoursHistogram />
        </div>
        <div className="lg:col-span-3 flex flex-col">
          <div className="flex flex-col h-full">
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;