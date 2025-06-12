'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ChartBarIcon, CurrencyDollarIcon, UserGroupIcon, BellIcon } from '@heroicons/react/24/solid';

const analysisData = {
  title: "Post-Call Analysis",
  kpis: [
    { label: "Outcome", value: "Order Placed", icon: CheckCircleIcon },
    { label: "Revenue Generated", value: "$97.41", icon: CurrencyDollarIcon },
    { label: "Customer Sentiment", value: "Positive", icon: UserGroupIcon },
    { label: "Manager Notified", value: "High-Value Order", icon: BellIcon }
  ],
  summary: "The AI successfully identified an existing customer, recommended a relevant product for the 'Mother\'s Day' occasion, and processed a pickup order. The order was confirmed and a payment link was issued."
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const PostCallAnalysisCard = () => {
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="absolute inset-0 bg-white/80 backdrop-blur-sm p-6 flex flex-col justify-center items-center z-10"
    >
      <div className="w-full max-w-md bg-white border border-primary-200 shadow-xl p-6">
        <h3 className="text-2xl font-semibold text-neutral-900 flex items-center">
          <ChartBarIcon className="h-7 w-7 mr-3 text-primary-600"/>
          {analysisData.title}
        </h3>
        <p className="mt-2 text-sm text-neutral-600">{analysisData.summary}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          {analysisData.kpis.map((kpi, index) => (
            <div key={index} className="bg-neutral-50 p-3">
              <kpi.icon className="h-6 w-6 text-primary-500 mx-auto"/>
              <p className="text-sm text-neutral-500 mt-1">{kpi.label}</p>
              <p className="text-lg font-semibold text-neutral-800">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PostCallAnalysisCard; 