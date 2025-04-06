import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const Deposits = ({ deposits, onAddDeposit, onRemoveDeposit, currentBalance, dailySignals, selectedCurrency, exchangeRates }) => {
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
        amount: parseFloat(newDeposit.amount) / exchangeRates[selectedCurrency], // Konwersja na USDT
        status: 'active',
        turnoverRequired: parseFloat(newDeposit.amount) / exchangeRates[selectedCurrency] * 3,
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kwota ({selectedCurrency})</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={newDeposit.amount}
                onChange={(e) => setNewDeposit({ ...newDeposit, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-16"
                required
              />
              <span className="absolute right-3 top-2 text-gray-500">
                {selectedCurrency}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {newDeposit.amount ? `${(parseFloat(newDeposit.amount) / exchangeRates[selectedCurrency]).toFixed(2)} USDT` : '0.00 USDT'}
            </p>
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
        <table className="min-w-full divide-y divide-gray-200 mobile-responsive-table">
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
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Data">{deposit.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Kwota">{deposit.amount.toFixed(2)} USDT</td>
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Status">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deposit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deposit.status === 'completed' ? 'Ukończony' : 'Aktywny'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Pozostałe dni">{remainingDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Data ukończenia">{completionDate.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Akcje">
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