import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActiveUser } from "@/types/note";

interface ActiveUsersListProps {
  users: ActiveUser[];
}

const ActiveUsersList = ({ users }: ActiveUsersListProps) => {
  if (!users.length) return null;

  return (
    <div className="flex items-center space-x-1">
      <TooltipProvider>
        {users.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-opacity hover:opacity-80"
                style={{ backgroundColor: user.color + "30" }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: user.color }}
                />
                <span className="truncate max-w-24">{user.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-xs">
                <p className="font-bold">{user.name}</p>
                <p className="font-mono">ID: {user.id}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default ActiveUsersList;
