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
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        
        // Sprawdzamy, czy historia się faktycznie zmieniła, aby uniknąć nieskończonej pętli
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
      }
    }
  }, []);

  // Zapisz historię wpłat do localStorage przy każdej zmianie
  useEffect(() => {
    // Zapobiegamy zapisowi przy pierwszym renderowaniu, kiedy historia może być pusta
    if (history && history.length > 0) {
      localStorage.setItem('investmentHistory', JSON.stringify(history));
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
    
    // Dni od złożenia depozytu
    const daysSinceDeposit = Math.max(1, Math.floor((currentDate - depositDate) / (1000 * 60 * 60 * 24)));
    
    // Parametry do obliczeń
    const depositAmount = parseFloat(deposit.amount);
    const effectiveDailySignals = dailySignals || 3; // Domyślnie 3 sygnały dziennie
    const ratePerSignal = 0.006; // 0,6% na sygnał
    
    // Całkowity dzienny procent zysku
    const totalDailyRate = ratePerSignal * effectiveDailySignals;
    
    // Oblicz dzienny zysk z całego kapitału
    const dailyProfit = balance * totalDailyRate;
    
    // Liczba dni potrzebna do wygenerowania kwoty równej wpłacie
    let daysToTurnover;
    
    if (dailyProfit <= 0) {
      // Jeśli nie ma zysku, użyj standardowego wzoru
      // Jeśli nie ma zysku, użyj standardowego wzoru
      daysToTurnover = Math.ceil(1 / totalDailyRate);
    } else {
      // Wzór na czas potrzebny do podwojenia kapitału przy wzroście złożonym:
      // t = log(2) / log(1 + r), gdzie r to dzienna stopa zwrotu
      daysToTurnover = Math.ceil(Math.log(2) / Math.log(1 + totalDailyRate));
    }
    
    // Oblicz udział tej wpłaty w całkowitym kapitale (z zabezpieczeniem przed dzieleniem przez zero)
    const depositShare = balance > 0 ? depositAmount / balance : 1;
    
    // Oblicz dzienny zysk dla tej konkretnej wpłaty
    const dailyProfitForDeposit = dailyProfit * depositShare;
    
    // Oblicz całkowity zysk z tej wpłaty na dzisiaj (wzrost złożony)
    // Wzór na wzrost złożony: FV = P * (1 + r)^t - P
    // Gdzie: FV - przyszła wartość, P - kapitał początkowy, r - stopa zwrotu, t - liczba okresów
    const totalProfit = depositAmount * (Math.pow(1 + totalDailyRate, daysSinceDeposit) - 1);
    
    // Zysk z obrotu to całkowity zysk bez ograniczenia do kwoty wpłaty
    const turnoverProfit = totalProfit;
    
    // Pozostałe dni do pełnego obrotu
    const daysLeft = Math.max(0, daysToTurnover - daysSinceDeposit);
    
    // Przewidywany przyszły zysk (wzrost złożony)
    // Używamy tego samego wzoru na wzrost złożony, ale dla pozostałych dni
    const projectedFutureProfit = depositAmount * (Math.pow(1 + totalDailyRate, daysLeft) - 1);
    
    // Data zakończenia obrotu
    const completionDate = new Date(depositDate);
    completionDate.setDate(completionDate.getDate() + daysToTurnover);
    
    // Procent postępu obrotu
    const turnoverProgress = Math.min(100, (daysSinceDeposit / daysToTurnover) * 100);
    
    console.log(`Wpłata: ${depositAmount} USDT, Dzienny zysk całkowity: ${dailyProfit.toFixed(2)} USDT, Dzienny zysk wpłaty: ${dailyProfitForDeposit.toFixed(2)} USDT, Dni do obrotu: ${daysToTurnover}, Postęp: ${turnoverProgress.toFixed(1)}%, Pozostało dni: ${daysLeft}, Przyszły zysk: ${projectedFutureProfit.toFixed(2)} USDT`);
    
    return {
      daysSinceDeposit,
      totalTurnover: parseFloat(turnoverProfit.toFixed(2)),
      daysToTurnover,
      daysLeft,
      completionDate,
      isCompleted: turnoverProfit >= depositAmount, // Obrót jest zakończony, gdy zysk osiągnął wartość wpłaty
      dailyProfit: parseFloat(dailyProfit.toFixed(2)),
      dailyProfitForDeposit: parseFloat(dailyProfitForDeposit.toFixed(2)),
      projectedTotalProfit: parseFloat(depositAmount.toFixed(2)),
      projectedFutureProfit: parseFloat(projectedFutureProfit.toFixed(2)),
      turnoverProfit: parseFloat(turnoverProfit.toFixed(2)),
      turnoverProgressPercent: parseFloat(turnoverProgress.toFixed(1))
    };
  };

  // Aktualizuj status obrotu dla wszystkich wpłat
  useEffect(() => {
    // Ta funkcja będzie wywoływana tylko przy inicjalizacji oraz w interwałach
    const updateHistory = () => {
      // Ograniczamy wywołania console.log
      const debug = false;
      
      if (debug && history.length > 0) {
        history.forEach(deposit => {
          calculateTurnoverStatus(deposit);
        });
      }
    };

    // Wykonaj aktualizację tylko raz przy inicjalizacji
    updateHistory();
    
    // Ustaw interwał aktualizacji, ale nie wywołuj funkcji, które modyfikują stan
    const interval = setInterval(updateHistory, 43200000); // 12 godzin
    
    // Czyszczenie interwału przy odmontowaniu komponentu
    return () => clearInterval(interval);
  }, []); // Pusta tablica zależności - uruchamiane tylko przy montowaniu komponentu

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
                  <td className="px-4 py-3 whitespace-nowrap" data-label={translations[selectedLanguage].amount}>
                    <div className="text-sm font-medium text-gray-900 w-full text-right">
                      <div className="font-semibold">{deposit.amount} USDT</div>
                      <div className="text-xs text-blue-500 mt-1 w-full">
                        <span>{translations[selectedLanguage].turnoverProgress}: {Math.min(100, ((turnoverStatus.turnoverProfit || 0) / deposit.amount * 100)).toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 w-full">
                        <span>Dzienny zysk: {(turnoverStatus.dailyProfitForDeposit || 0).toFixed(2)} USDT</span>
                      </div>
                      <div className="text-xs text-orange-500 mt-1 w-full">
                        <span>Pozostało dni: {turnoverStatus.daysLeft} | Przyszły zysk: {(turnoverStatus.projectedFutureProfit || 0).toFixed(2)} USDT</span>
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
                      {turnoverStatus.daysLeft || 0} {translations[selectedLanguage].days}
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