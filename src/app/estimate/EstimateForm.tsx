"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionPressable } from "@/design/motion/Pressable";

export function EstimateForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
        <CardDescription>Tell us about your painting project needs</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input id="fullName" placeholder="Jane Doe" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input id="email" type="email" placeholder="jane@example.com" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <Input id="phone" type="tel" placeholder="(555) 000-0000" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="projectType" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Project Type
              </label>
              <Input id="projectType" placeholder="Residential / Commercial / Public Sector" required />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="details" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Project Details & Scope
            </label>
            <Input id="details" placeholder="Describe the area, square footage, timelines, or color preferences..." />
          </div>

          <div className="pt-4">
            <MotionPressable>
              <Button type="submit" size="lg" className="w-full bg-[#E65100] hover:bg-[#CC4400]">
                Submit Estimate Request
              </Button>
            </MotionPressable>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
