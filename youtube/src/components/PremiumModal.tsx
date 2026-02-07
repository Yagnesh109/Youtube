"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Check, Crown, Zap, Star } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { toast } from "sonner";

const plans = [
  {
    name: "Bronze",
    price: 59,
    limit: "7 Minutes",
    icon: <Zap className="w-6 h-6 text-orange-600" />,
    color: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 shadow-lg",
    btnColor: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
  },
  {
    name: "Silver",
    price: 99,
    limit: "10 Minutes",
    icon: <Star className="w-6 h-6 text-gray-700" />,
    color: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-lg",
    btnColor: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md"
  },
  {
    name: "Gold",
    price: 199,
    limit: "Unlimited",
    icon: <Crown className="w-6 h-6 text-yellow-600" />,
    color: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 shadow-lg",
    btnColor: "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md"
  }
];

const planLimits: Record<string, string> = {
  Free: "5 Minutes",
  Bronze: "7 Minutes",
  Silver: "10 Minutes",
  Gold: "Unlimited",
};


const PremiumModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user } = useUser();
  const currentPlan = user?.plan || "Free";
  const currentLimit = planLimits[currentPlan] || "5 Minutes";

  const handlePayment = async (planName: string, amount: number) => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }
    try {
      toast.loading(`Processing ${planName} upgrade...`);

      const { data } = await axiosInstance.post("/payment/order", {
        amount: amount,
        userId: user._id,
        plan: planName
      });

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to get payment URL");
      }

    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Payment failed to start");
    }
  };

  // Filter plans based on current user plan
  const getAvailablePlans = () => {
    const currentPlan = user?.plan || "Free";
    const planHierarchy = ["Free", "Bronze", "Silver", "Gold"];
    const currentIndex = planHierarchy.indexOf(currentPlan);

    return plans.filter((plan) => {
      const planIndex = planHierarchy.indexOf(plan.name);
      return planIndex > currentIndex;
    });
  };

  const availablePlans = getAvailablePlans();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto max-h-[90vh] border-0 shadow-2xl">
        <DialogHeader className="pb-6">
          <div className="mx-auto bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-full w-fit mb-6 shadow-lg">
            <Crown className="w-10 h-10 text-yellow-300" />
          </div>
          <DialogTitle className="text-center text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-center text-gray-700 text-lg font-medium">
            Extend your watch time limit. Current Plan: <span className="font-bold uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full">{user?.plan || "Free"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          {availablePlans.length > 0 ? (
            availablePlans.map((plan) => (
              <div key={plan.name} className={`relative flex flex-col p-8 rounded-2xl border-2 ${plan.color} transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white rounded-xl shadow-md">{plan.icon}</div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <p className="text-sm text-gray-600">/month</p>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex gap-3 items-center text-gray-700 font-medium">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Watch time: <strong className="text-gray-900">{plan.limit}</strong></span>
                  </li>
                  <li className="flex gap-3 items-center text-gray-700 font-medium">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Email Invoice</span>
                  </li>
                  <li className="flex gap-3 items-center text-gray-700 font-medium">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Instant Access</span>
                  </li>
                </ul>

                <Button
                  onClick={() => handlePayment(plan.name, plan.price)}
                  className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${plan.btnColor}`}
                >
                  Upgrade to {plan.name}
                </Button>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center">
              <div className="inline-flex flex-col items-center p-12 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-2 border-yellow-300 shadow-xl">
                <Crown className="w-20 h-20 text-yellow-600 mb-6" />
                <h3 className="text-3xl font-bold text-yellow-800 mb-3">Gold Plan Active</h3>
                <p className="text-yellow-700 text-lg mb-6">You're enjoying unlimited watch time!</p>
                <div className="bg-gradient-to-r from-yellow-200 to-yellow-300 px-6 py-3 rounded-full">
                  <span className="text-yellow-900 font-bold text-lg">All Features Unlocked</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <p className="text-blue-800 font-medium">
            <span className="text-blue-600 font-bold">
              {currentPlan} Plan:
            </span>{" "}
            {currentLimit} watch time limit

          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;