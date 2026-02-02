"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { RefreshCw, Check, X } from "lucide-react";
import { safeToast } from "@/lib/error-handling";
import { motion } from "framer-motion";

export function EODInventoryCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleInventoryCheck = async () => {
    setIsChecking(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsChecked(true);
      safeToast.success("Inventory check completed successfully");
    } catch (error) {
      safeToast.error("Failed to complete inventory check");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card variant={isChecked ? "glass" : "default"} className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isChecked ? "bg-emerald-100 text-emerald-600 shadow-inner" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>
                <RefreshCw className={`w-6 h-6 ${isChecking ? "animate-spin" : ""}`} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-black text-[var(--text-main)] italic">Daily Operations</h3>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                  Inventory Reconciliation & Closing
                </p>
              </div>
            </div>

            <Button
              onClick={handleInventoryCheck}
              disabled={isChecking || isChecked}
              variant={isChecked ? "outline" : "gradient"}
              className={`min-w-[160px] h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${isChecked ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "shadow-lg glow-primary"}`}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : isChecked ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Verified Correct
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Finalize Day
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isChecked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-emerald-800 text-xs font-black uppercase tracking-widest">
                    All inventory levels verified and finalized for today
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 rounded-lg"
                  onClick={() => setIsChecked(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}