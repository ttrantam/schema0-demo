import { useLiveQuery } from "@tanstack/react-db";
import { bookingsCollection } from "@/query-collections/built-in/bookings";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, BookOpen } from "lucide-react";
import { useState } from "react";
import { selectBookingsSchema } from "@template/db/schema";
import type { z } from "zod/v4";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Booking = z.infer<typeof selectBookingsSchema>;

export default function BookingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: bookings, isPending, error } = useLiveQuery({
    collection: bookingsCollection,
  });

  const handleAddBooking = () => {
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error loading bookings: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-gray-600">View and manage your training session bookings</p>
        </div>
        <Button onClick={handleAddBooking} className="gap-2">
          <Plus className="h-4 w-4" />
          Book Session
        </Button>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Session Booking</CardTitle>
                    <CardDescription>
                      Session ID: {booking.sessionId}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">Booking Date:</span>{" "}
                  {new Date(booking.bookingDate).toLocaleDateString()}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Trainer ID:</span> {booking.trainerId}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">User ID:</span> {booking.userId}
                </div>
                {booking.notes && (
                  <div className="text-sm">
                    <span className="font-semibold">Notes:</span> {booking.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center py-8">
              <BookOpen className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600">No bookings yet. Book a session to get started!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
