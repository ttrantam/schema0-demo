import { useLiveQuery } from "@tanstack/react-db";
import { trainersCollection } from "@/query-collections/built-in/trainers";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { selectTrainersSchema } from "@template/db/schema";
import type { z } from "zod/v4";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Trainer = z.infer<typeof selectTrainersSchema>;

export default function TrainersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: trainers, isPending, error } = useLiveQuery({
    collection: trainersCollection,
  });

  const handleAddTrainer = async () => {
    // This would open a dialog to add a new trainer
    setIsDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error loading trainers: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personal Trainers</h1>
          <p className="text-gray-600">Manage fitness trainers and their sessions</p>
        </div>
        <Button onClick={handleAddTrainer} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Trainer
        </Button>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : trainers && trainers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => (
            <Card key={trainer.id}>
              <CardHeader>
                <CardTitle>
                  {trainer.firstName} {trainer.lastName}
                </CardTitle>
                <CardDescription>{trainer.specialization || "General Fitness"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">Email:</span> {trainer.email}
                </div>
                {trainer.hourlyRate && (
                  <div className="text-sm">
                    <span className="font-semibold">Rate:</span> ${trainer.hourlyRate}/hour
                  </div>
                )}
                {trainer.yearsExperience && (
                  <div className="text-sm">
                    <span className="font-semibold">Experience:</span>{" "}
                    {trainer.yearsExperience} years
                  </div>
                )}
                {trainer.rating && (
                  <div className="text-sm">
                    <span className="font-semibold">Rating:</span> {trainer.rating}/5
                  </div>
                )}
                {trainer.bio && (
                  <p className="mt-2 text-sm text-gray-600">{trainer.bio}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center py-8">
              <UsersIcon className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600">No trainers yet. Add one to get started!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
