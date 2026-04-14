import type { Route } from "./+types/_auth._index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Calendar, BookOpen, Users } from "lucide-react";

const TITLE_TEXT = `
fitness-lover - Connect PTs and Users
 `;

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Fitness Lover - Connect with Trainers" },
    {
      name: "description",
      content: "A fitness web platform connecting personal trainers and users",
    },
  ];
}

const features = [
  {
    icon: Award,
    title: "Find Trainers",
    description: "Browse certified personal trainers with specializations and ratings",
  },
  {
    icon: Calendar,
    title: "Training Sessions",
    description: "View available training sessions and schedules",
  },
  {
    icon: BookOpen,
    title: "Book Sessions",
    description: "Easy booking system for your fitness training",
  },
  {
    icon: Users,
    title: "Manage Users",
    description: "Create and manage user accounts and profiles",
  },
];

export default function Home() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Fitness Lover</h1>
          <p className="text-xl text-muted-foreground">
            Connect with certified personal trainers and book your fitness sessions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="h-6 w-6" />
                  <CardTitle>{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>1. Explore the <strong>Users</strong> section to manage user accounts</p>
            <p>2. Visit <strong>Trainers</strong> to browse and manage trainer profiles</p>
            <p>3. Check <strong>Sessions</strong> for available training sessions</p>
            <p>4. Use <strong>Bookings</strong> to manage training reservations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
