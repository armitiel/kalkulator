import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const Deposits = ({ deposits, onAddDeposit, onRemoveDeposit, currentBalance, dailySignals }) => {
  const [newDeposit, setNewDeposit] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    comment: ''
  });

  // Oblicz dzienny obrót na podstawie salda i sygnałów dziennych
  const calculateDailyTurnover = () => {
    // Oblicz dzienny zysk na podstawie sygnałów i aktualnego salda
    const dailyReturn = 0.006; // 0.6% dziennego zwrotu
    const dailyProfit = currentBalance * dailyReturn * dailySignals;
    return dailyProfit;
  };

  // Oblicz pozostałe dni dla każdej wpłaty
  const calculateRemainingDays = (deposit) => {
    const dailyProfit = calculateDailyTurnover();
    const requiredTurnover = deposit.amount * 3; // 3x wartość wpłaty
    const remainingDays = Math.ceil(requiredTurnover / dailyProfit);
    return remainingDays;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newDeposit.amount && newDeposit.date) {
      onAddDeposit({
        ...newDeposit,
        amount: parseFloat(newDeposit.amount),
        status: 'active',
        turnoverRequired: parseFloat(newDeposit.amount) * 3,
        turnoverCompleted: 0
      });
      setNewDeposit({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        comment: ''
      });
    }
  };

  const handleRemove = (depositId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę wpłatę?')) {
      onRemoveDeposit(depositId);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Wpłaty</h2>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kwota</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newDeposit.amount}
              onChange={(e) => setNewDeposit({ ...newDeposit, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              value={newDeposit.date}
              onChange={(e) => setNewDeposit({ ...newDeposit, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Dodaj wpłatę
        </button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kwota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pozostałe dni</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data ukończenia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deposits.map((deposit) => {
              const remainingDays = calculateRemainingDays(deposit);
              const completionDate = new Date();
              completionDate.setDate(completionDate.getDate() + remainingDays);

              return (
                <tr key={deposit.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{deposit.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{deposit.amount.toFixed(2)} USDT</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deposit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deposit.status === 'completed' ? 'Ukończony' : 'Aktywny'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{remainingDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{completionDate.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRemove(deposit.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Usuń wpłatę"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Deposits; 