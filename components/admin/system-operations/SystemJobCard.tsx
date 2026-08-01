"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Loader2, PlayCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JobRunResult } from "@/types/admin.type";

interface SystemJobCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  runLabel?: string;
  onRun: () => Promise<JobRunResult>;
}

export function SystemJobCard({
  title,
  description,
  icon,
  runLabel = "Chạy ngay",
  onRun,
}: SystemJobCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<JobRunResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleRun() {
    setIsRunning(true);
    try {
      const res = await onRun();
      setResult(res);
      setIsOpen(true);
      toast.success(res.summary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thao tác thất bại");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen((p) => !p)}
              className="gap-1 text-muted-foreground"
            >
              Kết quả
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
              />
            </Button>
          )}
          <Button onClick={handleRun} disabled={isRunning} size="sm" className="gap-2">
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {runLabel}
          </Button>
        </div>
      </CardHeader>

      {result && isOpen && (
        <CardContent className="border-t bg-muted/30 p-5 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant={result.totalChanged > 0 ? "success" : "secondary"}>
                {result.totalChanged} thay đổi
              </Badge>
              <span className="text-sm text-foreground">{result.summary}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng kết quả"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {result.changes.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-lg border bg-background divide-y">
              {result.changes.map((change, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-foreground truncate max-w-60">
                    {change.entityName}
                  </span>
                  <Badge variant="outline">{change.fromStatus}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge
                    variant={change.toStatus.includes("Lỗi") ? "destructive" : "success"}
                  >
                    {change.toStatus}
                  </Badge>
                  {change.note && (
                    <span className="text-xs text-muted-foreground ml-auto">{change.note}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
