  import React from 'react';
  import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

  interface JobStatusProps {
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    processedCount?: number;
    totalCount?: number;
  }

  const JobStatus: React.FC<JobStatusProps> = ({ 
    status, 
    message,
    processedCount,
    totalCount
  }) => {
    return (
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center mb-2">
          {status === 'loading' && (
            <Loader2 className="h-5 w-5 text-indigo-400 mr-2 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span className="font-medium">
            {status === 'loading' && (
              <>
                Analysis in progress
                {processedCount !== undefined && totalCount !== undefined && (
                  <span className="text-gray-300 ml-2">
                    ({processedCount} of {totalCount} headlines)
                  </span>
                )}
              </>
            )}
            {status === 'success' && 'Analysis completed'}
            {status === 'error' && 'Error'}
          </span>
        </div>
        
        {status === 'loading' && (
          <div className="space-y-2">
            <div className="w-full bg-gray-600 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              ></div>
            </div>
          </div>
        )}
        
        <p className="text-gray-300 mt-2">{message}</p>
      </div>
    );
  };

  export default JobStatus;