import { HelpCoach as HelpCoachComponent } from "@/components/help/HelpCoach";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";

export function HelpCoach() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Help Coach</h2>
      <HelpCoachComponent 
        userId={user._id as Id<"users">}
        currentPage="dashboard"
        tier="solopreneur"
      />
    </section>
  );
}