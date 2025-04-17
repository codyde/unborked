import React, { useState, useEffect } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { setFeatureFlag } from '../utils/featureFlags';

export default function FlagsDashboardPage() {
  const { flags, refreshFlagsFromSource, updateLocalFlag } = useFeatureFlags();
  const [flagsToEdit, setFlagsToEdit] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [updatingFlag, setUpdatingFlag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch flags when component mounts
  useEffect(() => {
    const fetchCurrentDefaults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch from GET /api/flags to get current defaults
        const response = await fetch('http://localhost:3000/api/flags');
        if (!response.ok) {
          throw new Error(`Failed to fetch defaults: ${response.statusText}`);
        }
        const data = await response.json();
        setFlagsToEdit(data);
      } catch (err) {
        console.error("Error fetching flag defaults:", err);
        setError(err instanceof Error ? err.message : "Unknown error fetching defaults");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCurrentDefaults();
  }, []);

  // Function to handle toggling a flag
  const handleToggle = async (flagName: string) => {
    // Get the new value - opposite of current value in flagsToEdit
    const newValue = !(flagsToEdit as any)[flagName];
    
    // Clear previous errors
    setError(null);
    
    // Track which flag is being updated
    setUpdatingFlag(flagName);
    
    // 1. Make immediate UI updates for the table display only
    setFlagsToEdit(prev => ({
      ...prev,
      [flagName]: newValue
    }));
    
    // 2. Perform the database update
    try {
      // Make the API request to update server default
      const response = await fetch(`http://localhost:3000/api/flags/defaults/${flagName}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: newValue })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      
      console.log(`✅ Flag ${flagName} saved to database`);
      
      // After successful update, reload the window to refresh everything
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error toggling flag:', error);
      
      // Revert UI updates for the table display
      setFlagsToEdit(prev => ({
        ...prev,
        [flagName]: !newValue
      }));
      
      setError(`Failed to update ${flagName}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Clear updating flag state
      setUpdatingFlag(null);
    }
  };

  // Function to refresh flags from server
  const refreshFlags = async () => {
    setIsLoading(true);
    await refreshFlagsFromSource();
    
    try {
      // Fetch from GET /api/flags to get current defaults
      const response = await fetch('http://localhost:3000/api/flags');
      if (!response.ok) {
        throw new Error(`Failed to fetch defaults: ${response.statusText}`);
      }
      const data = await response.json();
      setFlagsToEdit(data);
    } catch (err) {
      console.error("Error refreshing flags:", err);
      setError(err instanceof Error ? err.message : "Unknown error refreshing flags");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter flags based on search term
  const filteredFlags = Object.entries(flagsToEdit || {}).filter(([name]) => {
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Feature Flag Dashboard</h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage global feature flags. Changes update the database directly and reload the page to ensure a fresh state. All changes apply to all users.
              </p>
            </div>
            <div>
              <button
                onClick={refreshFlags}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Flags'}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search flags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 ${!searchTerm && 'hidden'}`}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Flag Table */}
          <div className="bg-white shadow overflow-hidden rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flag Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toggle
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading flags...
                    </td>
                  </tr>
                ) : filteredFlags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No flags found
                    </td>
                  </tr>
                ) : (
                  filteredFlags.map(([name, value]) => {
                    return (
                      <tr key={name} className={updatingFlag === name ? "bg-yellow-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {value ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center">
                            <button
                              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}
                              onClick={() => handleToggle(name)}
                              disabled={updatingFlag === name}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`}
                              ></span>
                            </button>
                            {updatingFlag === name && (
                              <span className="ml-2 text-xs text-orange-500 animate-pulse">Saving...</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flag Description Section */}
        <div className="mt-8 bg-white shadow overflow-hidden rounded-md p-6 mb-10">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Flag Descriptions</h3>
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <dt className="font-medium text-gray-900">UNBORKED_V2</dt>
              <dd className="mt-1 text-sm text-gray-500">Enables the new version of the Unborked application interface and functionality.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <dt className="font-medium text-gray-900">EXPERIMENTAL_CHECKOUT</dt>
              <dd className="mt-1 text-sm text-gray-500">Enables the experimental checkout flow with enhanced UX and analytics.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <dt className="font-medium text-gray-900">DARK_MODE</dt>
              <dd className="mt-1 text-sm text-gray-500">Activates dark mode across the entire application interface.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <dt className="font-medium text-gray-900">ADVANCED_FILTERING</dt>
              <dd className="mt-1 text-sm text-gray-500">Enables advanced product filtering and sorting options in the catalog.</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 