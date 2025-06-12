'use client';

import React from 'react';
import { ChartBarIcon, PhoneArrowDownLeftIcon, PhoneArrowUpRightIcon, CurrencyDollarIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

const kpiData = [
  {
    title: 'Total Calls Handled',
    value: '1,283',
    icon: PhoneArrowDownLeftIcon,
    description: 'All inbound and outbound calls this month.',
  },
  {
    title: 'Revenue Generated',
    value: '$12,480.50',
    icon: CurrencyDollarIcon,
    description: 'From orders placed via the voice agent.',
  },
  {
    title: 'Missed Calls Recovered',
    value: '89%',
    icon: PhoneArrowUpRightIcon,
    description: 'Percentage of missed calls returned and engaged.',
  }
];

const recentCallData = [
    { id: 1, number: '+1 (555) 123-4567', result: 'Order placed ($79.99)', type: 'Inbound' },
    { id: 2, number: '+1 (555) 987-6543', result: 'Delivery confirmed for 4pm', type: 'Outbound' },
    { id: 3, number: '+1 (555) 234-5678', result: 'Out of stock, offered replacement', type: 'Outbound' },
    { id: 4, number: '+1 (555) 876-5432', result: 'No answer', type: 'Inbound (Missed)' },
];

const AnalyticsDashboard = () => {
  return (
    <div className="bg-white border border-neutral-200 shadow-clean p-6 h-full">
      <div className="flex items-center">
        <ChartBarIcon className="h-8 w-8 text-primary-600" />
        <h2 className="text-2xl font-semibold text-neutral-800 ml-3">Dashboard</h2>
      </div>
      <p className="mt-2 text-sm text-neutral-600">
        Key performance metrics for this store's agent.
      </p>

      <div className="mt-6 space-y-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="flex items-start">
            <div className="bg-primary-100 p-3">
              <kpi.icon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-semibold text-neutral-800">{kpi.value}</p>
              <p className="text-sm text-neutral-600">{kpi.title}</p>
              <p className="text-xs text-neutral-500 mt-1">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 border-t border-neutral-200 pt-6">
          <div className="flex items-center">
            <DocumentCheckIcon className="h-6 w-6 text-neutral-700"/>
            <h3 className="text-lg font-medium text-neutral-800 ml-3">Recent Activity</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {recentCallData.map(call => (
                <li key={call.id} className="text-sm text-neutral-600 border-b border-neutral-100 pb-2">
                    <p className="font-medium text-neutral-800">{call.number}</p>
                    <p>
                        <span className={`font-medium ${call.type === 'Inbound' || call.type === 'Inbound (Missed)' ? 'text-blue-600' : 'text-green-600'}`}>
                            {call.type}:
                        </span> {call.result}
                    </p>
                </li>
            ))}
          </ul>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

