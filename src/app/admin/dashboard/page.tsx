export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">$24,780.80</dd>
            <div className="mt-2 text-sm text-green-600">+12% from last month</div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">1,248</dd>
            <div className="mt-2 text-sm text-green-600">+8% from last month</div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">892</dd>
            <div className="mt-2 text-sm text-green-600">+5% from last month</div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="bg-white overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {[
              { id: 1, user: 'John Doe', action: 'added a new product', time: '2 minutes ago' },
              { id: 2, user: 'Jane Smith', action: 'updated inventory', time: '1 hour ago' },
              { id: 3, user: 'Mike Johnson', action: 'processed 5 orders', time: '3 hours ago' },
              { id: 4, user: 'Sarah Williams', action: 'updated pricing', time: '5 hours ago' },
              { id: 5, user: 'Admin', action: 'performed system backup', time: '1 day ago' },
            ].map((activity) => (
              <li key={activity.id} className="px-6 py-4">
                <div className="flex items-center">
                  <div className="min-w-0 flex-1 flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">
                      {activity.time}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
