import { MadeWithDyad } from "@/components/made-with-dyad";

const Dashboard = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Welcome to UniPal!
        </h1>
        <p className="text-xl text-muted-foreground">
          Your personal AI-powered student assistant.
        </p>
        <p className="text-lg text-muted-foreground mt-2">
          Start by exploring the navigation on the left.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;