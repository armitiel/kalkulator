import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Clock } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

const InvestmentHistory = ({ 
  history, 
  setHistory, 
  currentBalance, 
  setCurrentBalance,
  dailySignals,
  translations,
  selectedLanguage,
  selectedCurrency,
  exchangeRates
}) => {
  const [newDeposit, setNewDeposit] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [projectionMonths, setProjectionMonths] = useState(3);
  const [inputValue, setInputValue] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositDate, setDepositDate] = useState('');
  const [projectionData, setProjectionData] = useState([]);

  // Oblicz dzienny obrót na podstawie salda i sygnałów dziennych
  const calculateDailyTurnover = () => {
    const dailyReturn = 0.006; // 0.6% dziennego zwrotu
    const profit = currentBalance * dailyReturn * dailySignals;
    return profit;
  };

  // Oblicz status obrotu dla wpłaty
  const calculateTurnoverStatus = (deposit) => {
    const depositDate = new Date(deposit.date);
    const currentDate = new Date();
    const daysSinceDeposit = Math.floor((currentDate - depositDate) / (1000 * 60 * 60 * 24));
    
    const dailyReturnRate = 0.006 * dailySignals; // 1.8% przy 3 sygnałach
    
    // Oblicz dzienny zysk od aktualnego stanu konta
    const dailyProfit = currentBalance * dailyReturnRate;
    
    // Oblicz sumę zysków do tej pory (tylko z dziennych zysków)
    const totalTurnover = dailyProfit * daysSinceDeposit;
    
    // Oblicz postęp jako stosunek sumy zysków do kwoty wpłaty
    const turnoverProgress = Math.min(1, totalTurnover / deposit.amount);
    
    // Oblicz ile dni potrzeba na osiągnięcie obrotu równego wpłacie
    const daysToComplete = Math.ceil(deposit.amount / dailyProfit);
    
    // Oblicz pozostałe dni
    const daysLeft = Math.max(0, daysToComplete - daysSinceDeposit);
    
    // Oblicz datę zakończenia
    const completionDate = new Date(depositDate);
    completionDate.setDate(completionDate.getDate() + daysToComplete);
    
    console.log('Status obrotu:', {
      depositAmount: deposit.amount,
      currentBalance,
      dailyReturnRate: (dailyReturnRate * 100).toFixed(1) + '%',
      dailyProfit,
      daysToComplete,
      daysLeft,
      totalTurnover,
      turnoverProgress: (turnoverProgress * 100).toFixed(2) + '%',
      daysSinceDeposit
    });
    
    return {
      completed: turnoverProgress >= 1,
      progress: turnoverProgress,
      daysLeft: daysLeft,
      daysToComplete: daysToComplete,
      currentAmount: deposit.amount + totalTurnover,
      totalTurnover: totalTurnover,
      dailyReturnRate: dailyReturnRate * 100,
      completionDate: completionDate,
      dailyProfits: []
    };
  };

  // Aktualizuj status obrotu dla wszystkich wpłat
  useEffect(() => {
    const updateHistory = () => {
      const updatedHistory = history.map(deposit => {
        const status = calculateTurnoverStatus(deposit);
        return {
          ...deposit,
          turnoverProgress: status.progress,
          daysLeft: status.daysLeft,
          turnoverCompleted: status.completed,
          status: status.completed ? 'completed' : 'active',
          currentAmount: status.currentAmount,
          completionDate: status.completionDate
        };
      });

      // Porównaj, czy historia faktycznie się zmieniła
      const hasChanged = JSON.stringify(updatedHistory) !== JSON.stringify(history);
      if (hasChanged) {
        setHistory(updatedHistory);
      }
    };

    updateHistory();
    const interval = setInterval(updateHistory, 3600000);
    return () => clearInterval(interval);
  }, [history.length, dailySignals]);

  const handleAddDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(newDeposit.amount);
    
    if (!amount || isNaN(amount) || amount <= 0) {
      setError(translations[selectedLanguage].invalidAmount);
      return;
    }
    
    // Oblicz całkowity kapitał w dniu wpłaty
    const previousDeposits = history
      .filter(d => new Date(d.date) < new Date(newDeposit.date))
      .reduce((sum, d) => sum + d.amount, 0);
    
    const totalCapital = previousDeposits + amount;
    const dailyReturnRate = 0.006 * dailySignals;
    const dailyProfit = totalCapital * dailyReturnRate;
    const daysToComplete = Math.ceil(amount / dailyProfit);
    
    const deposit = {
      id: Date.now(),
      date: newDeposit.date,
      amount: amount,
      status: 'active',
      turnoverRequired: true,
      turnoverStartDate: new Date(newDeposit.date).toISOString(),
      dailyProfit: dailyProfit,
      totalCapital: totalCapital
    };

    const turnoverStatus = calculateTurnoverStatus(deposit);
    
    deposit.turnoverProgress = turnoverStatus.progress;
    deposit.daysLeft = turnoverStatus.daysLeft;
    deposit.turnoverCompleted = turnoverStatus.completed;
    deposit.turnoverEndDate = turnoverStatus.completionDate.toISOString();
    deposit.totalTurnover = turnoverStatus.totalTurnover;
    deposit.currentAmount = turnoverStatus.currentAmount;
    
    const newHistory = [...history, deposit];
    setHistory(newHistory);
    setCurrentBalance(currentBalance + amount);
    setNewDeposit({ amount: '', date: new Date().toISOString().split('T')[0] });
    setError('');
  };

  const handleDeleteEntry = (id) => {
    const depositToDelete = history.find(deposit => deposit.id === id);
    if (!depositToDelete) return;

    if (window.confirm(translations[selectedLanguage].confirmDelete)) {
      const updatedHistory = history.filter(entry => entry.id !== id);
      setHistory(updatedHistory);
      // Zachowujemy aktualne saldo
    }
  };

  const handleProjection = () => {
    // Implementacja funkcji obliczania projekcji
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{translations[selectedLanguage].depositPlanning}</h2>
      </div>

      <form onSubmit={handleAddDeposit} className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translations[selectedLanguage].depositAmount} ({selectedCurrency})
            </label>
            <div className="relative">
              <input
                type="number"
                value={newDeposit.amount}
                onChange={(e) => setNewDeposit({ ...newDeposit, amount: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm pr-16 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="absolute right-3 top-3 text-gray-500">
                {selectedCurrency}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {newDeposit.amount ? `${(parseFloat(newDeposit.amount) / exchangeRates[selectedCurrency]).toFixed(2)} USDT` : '0.00 USDT'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translations[selectedLanguage].depositDate}
            </label>
            <input
              type="date"
              value={newDeposit.date}
              onChange={(e) => setNewDeposit({ ...newDeposit, date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {translations[selectedLanguage].addDeposit}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="mr-2" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto pb-4 mobile-table-wrapper">
        <table className="min-w-full divide-y divide-gray-200 table-auto mobile-responsive-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations[selectedLanguage].date}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations[selectedLanguage].amount}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations[selectedLanguage].turnoverStatus}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations[selectedLanguage].turnoverProgress}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations[selectedLanguage].daysLeft}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations[selectedLanguage].completionDate}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations[selectedLanguage].actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((deposit) => {
              const turnoverStatus = calculateTurnoverStatus(deposit);
              return (
                <tr key={deposit.id}>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].date}>
                    <div className="text-sm text-gray-500 w-full text-right">
                      {deposit.date}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].amount}>
                    <div className="text-sm font-medium text-gray-900 w-full text-right">
                      <div className="font-semibold">{deposit.amount} USDT</div>
                      <div className="text-xs text-gray-500 mt-1 w-full">
                        {translations[selectedLanguage].currently}: {turnoverStatus.currentAmount.toFixed(2)} USDT
                      </div>
                      <div className="text-xs text-gray-500 mt-1 w-full">
                        {translations[selectedLanguage].totalProfits}: {turnoverStatus.totalTurnover.toFixed(2)} USDT
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].turnoverStatus}>
                    <div className="w-full text-right">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        turnoverStatus.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {turnoverStatus.completed ? translations[selectedLanguage].completed : translations[selectedLanguage].inProgress}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].turnoverProgress}>
                    <div className="w-full text-right">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${turnoverStatus.progress * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 block text-right">
                        {Math.round(turnoverStatus.progress * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].daysLeft}>
                    <div className="text-sm text-gray-500 w-full text-right">
                      {turnoverStatus.daysLeft} {translations[selectedLanguage].days}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].completionDate}>
                    <div className="text-sm text-gray-500 w-full text-right">
                      {new Date(turnoverStatus.completionDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].actions}>
                    <div className="w-full text-right">
                      <button
                        onClick={() => handleDeleteEntry(deposit.id)}
                        className="text-red-600 hover:text-red-900 p-1 bg-red-50 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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

export default InvestmentHistory; 