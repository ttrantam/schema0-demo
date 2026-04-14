import { useLiveQuery } from "@tanstack/react-db";
import { sessionsCollection } from "@/query-collections/built-in/sessions";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { selectSessionsSchema } from "@template/db/schema";
import type { z } from "zod/v4";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Session = z.infer<typeof selectSessionsSchema>;

export default function SessionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: sessions, isPending, error } = useLiveQuery({
    collection: sessionsCollection,
  });

  const handleAddSession = () => {
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "full":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error loading sessions: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Sessions</h1>
          <p className="text-gray-600">
            Browse and manage available training sessions
          </p>
        </div>
        <Button onClick={handleAddSession} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Session
        </Button>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{session.title}</CardTitle>
                    <CardDescription>{session.sessionType}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.description && (
                  <p className="text-sm text-gray-600">{session.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {session.schedule.dayOfWeek} {session.schedule.startTime} -{" "}
                      {session.schedule.endTime}
                    </span>
                  </div>
                  {session.pricePerSession && (
                    <div>
                      <span className="font-semibold">Price:</span> $
                      {session.pricePerSession}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Participants:</span>{" "}
                    {session.currentParticipants || 0}/
                    {session.maxParticipants || "Unlimited"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center py-8">
              <Calendar className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600">No sessions yet. Create one to get started!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
