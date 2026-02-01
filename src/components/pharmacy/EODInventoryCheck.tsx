"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { RefreshCw, Check, X } from "lucide-react";
import { safeToast } from "@/lib/error-handling";

export function EODInventoryCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleInventoryCheck = async () => {
    setIsChecking(true);
    
    try {
      // Simulate inventory check API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsChecked(true);
      safeToast.success("End of day inventory check completed successfully");
    } catch (error) {
      safeToast.error("Failed to complete inventory check");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">End of Day Inventory Check</h3>
              <p className="text-sm text-gray-600">
                Verify inventory levels and close out the day
              </p>
            </div>
            <Button 
              onClick={handleInventoryCheck}
              disabled={isChecking || isChecked}
              className={isChecked ? "bg-green-600" : ""}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : isChecked ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Start Check
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isChecked && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Inventory verified and day closed successfully
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsChecked(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}