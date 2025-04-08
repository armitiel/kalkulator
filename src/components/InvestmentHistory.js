import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Clock } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

export const InvestmentHistory = ({ 
  history, 
  setHistory, 
  currentBalance, 
  setCurrentBalance,
  dailySignals,
  translations,
  selectedLanguage,
  selectedCurrency,
  exchangeRates,
  dailyRateOfReturn,
  balance,
  totalDeposits,
  setTotalDeposits,
  dailyCapital,
  setDailyCapital
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

  // Wczytaj historię wpłat z localStorage przy inicjalizacji
  useEffect(() => {
    const savedHistory = localStorage.getItem('investmentHistory');
    const backupHistory = localStorage.getItem('investmentHistoryBackup');
    
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        
        // Jeśli backup istnieje, porównaj z aktualną historią
        if (backupHistory) {
          const parsedBackup = JSON.parse(backupHistory);
          if (JSON.stringify(parsedHistory) !== JSON.stringify(parsedBackup)) {
            // Jeśli historie się różnią, użyj tej z backupu
            setHistory(parsedBackup);
            localStorage.setItem('investmentHistory', JSON.stringify(parsedBackup));
            return;
          }
        }
        
        // Sprawdzamy, czy historia się faktycznie zmieniła
        const currentHistoryStr = JSON.stringify(history);
        const savedHistoryStr = JSON.stringify(parsedHistory);
        
        if (currentHistoryStr !== savedHistoryStr) {
          setHistory(parsedHistory);
          
          // Oblicz aktualne saldo na podstawie zapisanej historii
          const totalBalance = parsedHistory.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
          setCurrentBalance(totalBalance);
        }
      } catch (error) {
        console.error('Błąd podczas parsowania historii z localStorage:', error);
        // W przypadku błędu, spróbuj użyć backupu
        if (backupHistory) {
          try {
            const parsedBackup = JSON.parse(backupHistory);
            setHistory(parsedBackup);
            localStorage.setItem('investmentHistory', JSON.stringify(parsedBackup));
          } catch (backupError) {
            console.error('Błąd podczas parsowania backupu:', backupError);
          }
        }
      }
    }
  }, []);

  // Zapisz historię wpłat do localStorage przy każdej zmianie
  useEffect(() => {
    if (history && history.length > 0) {
      const historyStr = JSON.stringify(history);
      localStorage.setItem('investmentHistory', historyStr);
      // Twórz kopię zapasową
      localStorage.setItem('investmentHistoryBackup', historyStr);
    }
  }, [history]);

  // Oblicz dzienny obrót na podstawie salda i sygnałów dziennych
  const calculateDailyTurnover = () => {
    const dailyReturn = 0.006; // 0.6% dziennego zwrotu
    const profit = currentBalance * dailyReturn * dailySignals;
    return profit;
  };

  // Oblicz status obrotu dla wpłaty
  const calculateTurnoverStatus = (deposit) => {
    if (!deposit || !deposit.date || !deposit.amount) return null;
    
    const depositDate = new Date(deposit.date);
    const currentDate = new Date();
    const depositAmount = parseFloat(deposit.amount);
    const ratePerSignal = 0.006;
    const totalDailyRate = ratePerSignal * dailySignals;
    
    // Oblicz dokładny czas od wpłaty w godzinach
    const hoursSinceDeposit = Math.max(1, (currentDate - depositDate) / (1000 * 60 * 60));
    const daysSinceDeposit = hoursSinceDeposit / 24;
    
    // Oblicz dni potrzebne do obrotu z uwzględnieniem wzrostu złożonego
    const daysToTurnover = Math.ceil(
      Math.log(1 + (depositAmount/currentBalance)) / 
      Math.log(1 + totalDailyRate)
    );

    // Oblicz dokładny czas do końca obrotu
    const hoursToTurnover = daysToTurnover * 24;
    const remainingHours = Math.max(0, hoursToTurnover - hoursSinceDeposit);
    const remainingDays = Math.floor(remainingHours / 24);
    const remainingHoursInDay = Math.floor(remainingHours % 24);

    // 1. Stan kapitału bez wpłaty po okresie obrotu
    const capitalWithoutDeposit = (currentBalance - depositAmount) * Math.pow(1 + totalDailyRate, daysToTurnover);
    
    // 2. Stan kapitału z wpłatą po okresie obrotu
    const capitalWithDeposit = currentBalance * Math.pow(1 + totalDailyRate, daysToTurnover);
    
    // 3. Rzeczywisty zysk z wpłaty
    const actualDepositProfit = (capitalWithDeposit - capitalWithoutDeposit) - depositAmount;

    // Oblicz postęp obrotu z dokładnością do godzin
    const turnoverProgress = Math.min(100, (hoursSinceDeposit / hoursToTurnover) * 100);
    const completionDate = new Date(depositDate);
    completionDate.setDate(depositDate.getDate() + daysToTurnover);

    return {
      daysSinceDeposit: Math.floor(daysSinceDeposit),
      daysToTurnover,
      remainingDays,
      remainingHoursInDay,
      completionDate,
      depositAmount,
      capitalWithoutDeposit: parseFloat(capitalWithoutDeposit.toFixed(2)),
      capitalWithDeposit: parseFloat(capitalWithDeposit.toFixed(2)),
      actualDepositProfit: parseFloat(actualDepositProfit.toFixed(2)),
      turnoverProgressPercent: parseFloat(turnoverProgress.toFixed(1))
    };
  };

  // Aktualizuj status obrotu dla wszystkich wpłat
  useEffect(() => {
    const updateHistory = () => {
      if (history.length > 0) {
        history.forEach(deposit => {
          calculateTurnoverStatus(deposit);
        });
      }
    };

    updateHistory();
    const interval = setInterval(updateHistory, 43200000); // 12 godzin
    return () => clearInterval(interval);
  }, [history, dailySignals, currentBalance]); // Dodajemy zależności

  const handleAddDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(newDeposit.amount);
    
    if (!amount || isNaN(amount) || amount <= 0) {
      setError(translations[selectedLanguage].invalidAmount);
      return;
    }
    
    const deposit = {
      id: Date.now(),
      date: newDeposit.date,
      amount: amount // Kwota już w USDT
    };

    // Dodaj depozyt do historii
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
      setCurrentBalance(currentBalance - depositToDelete.amount);
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
              {translations[selectedLanguage].depositAmount} (USDT)
            </label>
            <div className="relative">
              <input
                type="number"
                value={newDeposit.amount}
                onChange={(e) => {
                  // Zabezpieczenie przed ujemnymi liczbami
                  const value = e.target.value;
                  const parsedValue = parseFloat(value);
                  if (value === '' || !isNaN(parsedValue)) {
                    setNewDeposit({ ...newDeposit, amount: value });
                  }
                }}
                onBlur={(e) => {
                  // Dodatkowe zabezpieczenie przy utracie fokusu
                  const parsedValue = parseFloat(e.target.value);
                  if (!isNaN(parsedValue) && parsedValue < 0) {
                    setNewDeposit({ ...newDeposit, amount: Math.abs(parsedValue).toString() });
                  }
                }}
                min="0"
                step="any"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm pr-16 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
                style={{ appearance: 'none' }}
              />
              <span className="absolute right-3 top-3 text-gray-500">
                USDT
              </span>
            </div>
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
              const turnoverStatus = calculateTurnoverStatus(deposit) || {
                daysSinceDeposit: 0,
                totalTurnover: 0,
                daysToTurnover: 0,
                daysLeft: 0,
                completionDate: new Date(),
                isCompleted: false,
                additionalDailyProfitFromDeposit: 0,
                projectedTotalProfit: 0,
                turnoverProfit: 0,
                turnoverProgressPercent: 0
              };
              
              return (
                <tr key={deposit.id}>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].date}>
                    <div className="text-sm text-gray-500 w-full text-right">
                      {deposit.date}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-normal" data-label={translations[selectedLanguage].amount}>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 w-full text-right">
                          <div className="text-base font-bold mb-2">{deposit.amount} USDT</div>
                          <div className="text-sm font-medium text-green-600 mb-2">
                            <span>{translations[selectedLanguage].expectedDepositProfit}:</span>
                            <div className="font-bold">{turnoverStatus.actualDepositProfit} USDT</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 w-full text-right">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            <span>{translations[selectedLanguage].finalBalance}:</span>
                            <div className="font-bold">{turnoverStatus.capitalWithDeposit} USDT</div>
                          </div>
                          <div className="text-sm font-medium text-gray-600">
                            <span>{translations[selectedLanguage].balanceWithoutDeposit}:</span>
                            <div className="font-bold">{turnoverStatus.capitalWithoutDeposit} USDT</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].turnoverStatus}>
                    <div className="w-full text-right">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        turnoverStatus.turnoverProfit >= deposit.amount ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {turnoverStatus.turnoverProfit >= deposit.amount 
                          ? translations[selectedLanguage].completed 
                          : `${translations[selectedLanguage].inProgress} (${turnoverStatus.turnoverProgressPercent || 0}%)`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].turnoverProgress}>
                    <div className="w-full text-right">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${turnoverStatus.turnoverProgressPercent || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 block text-right">
                        {turnoverStatus.turnoverProgressPercent || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].daysLeft}>
                    <div className="text-sm text-gray-500 w-full text-right">
                      {turnoverStatus.remainingDays} {translations[selectedLanguage].days} {turnoverStatus.remainingHoursInDay} {translations[selectedLanguage].hours}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].completionDate}>
                    <div className="text-sm text-gray-500 w-full text-right">
                      {turnoverStatus.completionDate ? new Date(turnoverStatus.completionDate).toLocaleDateString() : '-'}
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