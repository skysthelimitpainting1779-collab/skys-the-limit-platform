"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { HardHat, MapPin, CheckCircle2, ShieldCheck, Send, AlertTriangle } from "lucide-react";

export default function CrewPage() {
  const [checklist, setChecklist] = useState([
    { id: "item-1", label: "Floor & furniture masking verified", completed: true },
    { id: "item-2", label: "Surface sanding & dust removal complete", completed: true },
    { id: "item-3", label: "High-bond primer applied & inspected", completed: true },
    { id: "item-4", label: "Finish coat 1 dry & back-rolled", completed: false },
    { id: "item-5", label: "Final coat uniform coverage check", completed: false },
  ]);

  const [updateNote, setUpdateNote] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateNote.trim()) return;
    setSubmittedMessage(true);
    setUpdateNote("");
    setTimeout(() => setSubmittedMessage(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Today's Job Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge className="bg-emerald-600 text-white font-semibold">Today’s Assigned Job</Badge>
          <span className="text-xs font-mono text-muted-foreground">JOB-202</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sarah Jenkins — Fine Finish</h1>
        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" /> 1420 N Prospect Ave, Milwaukee, WI
        </p>
      </div>

      {/* Critical Access & Safety Notes */}
      <Card className="border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-foreground space-y-1">
          <div className="font-bold text-amber-500 uppercase tracking-wide">Critical Access Note</div>
          <div>Entry via side porch keybox (Code: 1779). Homeowner has 1 indoor cat; keep front door latch engaged at all times during spray operations.</div>
        </div>
      </Card>

      {/* Preparation & Quality Checklist */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" /> Prep & Quality Checklist
          </CardTitle>
          <CardDescription>Tap to complete mandatory quality milestones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklist(item.id)}
              className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                item.completed ? "border-emerald-500/50 bg-emerald-500/5" : "border-border bg-background"
              }`}
            >
              <Checkbox checked={item.completed} onCheckedChange={() => toggleChecklist(item.id)} />
              <span
                className={`text-sm font-medium ${
                  item.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Update Form */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-500" /> Submit Progress Update
          </CardTitle>
          <CardDescription>Log field progress or flag site issues for Operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g., Finished coat 1 back-roll on living room walls. Substrate dry-time 45 minutes before final coat..."
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              className="min-h-[100px]"
            />
            {submittedMessage && (
              <div className="p-3 border border-emerald-500/50 bg-emerald-500/10 text-emerald-600 rounded text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Update logged successfully to Convex audit stream.
              </div>
            )}
            <Button type="submit" className="w-full sm:w-auto bg-amber-500 text-black hover:bg-amber-400 font-semibold gap-2">
              <Send className="w-4 h-4" /> Log Progress Update
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
