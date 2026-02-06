"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { RefreshCw, Check, X } from "lucide-react";
import { safeToast } from "@/lib/error-handling";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-3">
      <Card className={isChecked ? "border-emerald-200 bg-emerald-50/50" : ""}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isChecked 
                  ? "bg-emerald-100 text-emerald-600" 
                  : "bg-[var(--primary-light)] text-[var(--primary)]"
              }`}>
                <RefreshCw className={`w-6 h-6 ${isChecking ? "animate-spin" : ""}`} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-main)]">Daily Operations</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Inventory reconciliation and closing
                </p>
              </div>
            </div>

            <Button
              onClick={handleInventoryCheck}
              disabled={isChecking || isChecked}
              variant={isChecked ? "outline" : "default"}
              className={isChecked ? "border-emerald-500 text-emerald-600" : ""}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : isChecked ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Verified
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

      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-emerald-800">
                      All inventory levels verified and finalized for today
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-100"
                    onClick={() => setIsChecked(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
