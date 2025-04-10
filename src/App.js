import React, { useState, useEffect } from 'react';
import { Settings, TrendingUp, DollarSign, Calendar, BarChart2, Pencil, Lightbulb, LogOut, Clock, AlertTriangle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InvestmentHistory from './components/InvestmentHistory';
import WithdrawalPlanner from './components/WithdrawalPlanner';
import Auth from './components/Auth';
import { getPortfolio, getTransactions, updatePortfolio } from './api';
import './App.css?v=20240618';

// Komponenty SVG dla flag
const PolishFlag = () => (
  <svg viewBox="0 0 16 16" className="w-full h-full">
    <g fillRule="evenodd">
      <path fill="#fff" d="M16 16H0V0h16z"/>
      <path fill="#dc143c" d="M16 16H0V8h16z"/>
    </g>
  </svg>
);

const UKFlag = () => (
  <svg viewBox="0 0 16 16" className="w-full h-full">
    <defs>
      <clipPath id="uk-clip">
        <path d="M0 0h16v16H0z"/>
      </clipPath>
    </defs>
    <g clipPath="url(#uk-clip)">
      {/* Niebieskie tło */}
      <path fill="#012169" d="M0 0h16v16H0z"/>
      {/* Biały krzyż św. Andrzeja */}
      <path d="M0 0l16 16M16 0L0 16" stroke="#fff" strokeWidth="3"/>
      {/* Czerwony krzyż św. Andrzeja */}
      <path d="M0 0l16 16M16 0L0 16" stroke="#C8102E" strokeWidth="2"/>
      {/* Biały krzyż św. Jerzego */}
      <path d="M8 0v16M0 8h16" stroke="#fff" strokeWidth="5"/>
      {/* Czerwony krzyż św. Jerzego */}
      <path d="M8 0v16M0 8h16" stroke="#C8102E" strokeWidth="3"/>
    </g>
  </svg>
);

const App = () => {
  // Inicjalizacja wszystkich stanów z localStorage
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    return savedTab || 'dashboard';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Zawsze ustawiamy na true, aby pominąć ekran logowania
    localStorage.setItem('isAuthenticated', 'true');
    return true;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Inicjalizacja stanu z localStorage
  const [investmentHistory, setInvestmentHistory] = useState(() => {
    const savedHistory = localStorage.getItem('investmentHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Inicjalizacja salda na podstawie zapisanego stanu
  const [currentBalance, setCurrentBalance] = useState(() => {
    const savedBalance = localStorage.getItem('currentBalance');
    return savedBalance ? parseFloat(savedBalance) : 0;
  });

  const [dailySignals, setDailySignals] = useState(() => {
    const savedSignals = localStorage.getItem('dailySignals');
    return savedSignals ? parseInt(savedSignals) : 3;
  });

  const [dailyProfit, setDailyProfit] = useState(0);

  // Efekt do zapisywania stanu przy każdej zmianie
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    localStorage.setItem('isAuthenticated', isAuthenticated);
    localStorage.setItem('currentBalance', currentBalance.toString());
    localStorage.setItem('dailySignals', dailySignals.toString());
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [activeTab, isAuthenticated, currentBalance, dailySignals, user]);

  // Dodatkowo zapisujemy historię inwestycji przy każdej zmianie
  useEffect(() => {
    localStorage.setItem('investmentHistory', JSON.stringify(investmentHistory));
  }, [investmentHistory]);

  // Funkcja do bezpiecznej aktualizacji salda
  const updateBalance = (newBalance) => {
    if (typeof newBalance === 'number' && !isNaN(newBalance) && newBalance >= 0) {
      setCurrentBalance(newBalance);
      localStorage.setItem('currentBalance', newBalance.toString());
      if (user && user.token) {
        handlePortfolioUpdate('currentBalance', newBalance);
      }
    }
  };

  // Funkcja do bezpiecznej aktualizacji sygnałów
  const updateDailySignals = (newSignals) => {
    if (typeof newSignals === 'number' && !isNaN(newSignals) && newSignals >= 0) {
      setDailySignals(newSignals);
      localStorage.setItem('dailySignals', newSignals.toString());
      if (user && user.token) {
        handlePortfolioUpdate('dailySignals', newSignals);
      }
    }
  };

  // Efekt do obliczania dziennego zysku
  useEffect(() => {
    const dailyReturn = 0.006; // 0.6% dziennego zwrotu
    const profit = currentBalance * dailyReturn * dailySignals;
    setDailyProfit(profit);
  }, [currentBalance, dailySignals]);

  // Stan dla danych historycznych
  const capitalData = [
    { date: '01.03.2024', amount: 5000 },
    { date: '15.03.2024', amount: 5500 },
    { date: '31.03.2024', amount: 6200 },
    { date: '15.04.2024', amount: 7000 },
    { date: '30.04.2024', amount: 7392.74 },
  ];

  const [deposits, setDeposits] = useState([]);

  const [selectedCurrency, setSelectedCurrency] = useState('PLN');
  const [selectedLanguage, setSelectedLanguage] = useState('pl');
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Ustaw domyślną walutę w zależności od języka
  useEffect(() => {
    setSelectedCurrency(selectedLanguage === 'pl' ? 'PLN' : 'EUR');
  }, [selectedLanguage]);

  // Stan dla planera wypłat - inicjalizacja z localStorage
  const [withdrawalPlan, setWithdrawalPlan] = useState(() => {
    const savedPlan = localStorage.getItem('withdrawalPlan');
    return savedPlan ? JSON.parse(savedPlan) : {
      monthlyWithdrawal: 0,
      startMonth: 0,
      projectionMonths: 12,
      projectionData: [],
      inputValue: '',
      error: '',
      withdrawalFee: { rate: 0.05, amount: 0 },
      possibleStartMonth: 0
    };
  });

  // Zapisujemy plan wypłat przy każdej zmianie
  useEffect(() => {
    localStorage.setItem('withdrawalPlan', JSON.stringify(withdrawalPlan));
  }, [withdrawalPlan]);

  // Tłumaczenia
  const translations = {
    pl: {
      appName: 'Investment Tracker',
      balance: 'Stan konta',
      dailyProfit: 'Dzienny zysk',
      monthlyProfit: 'Miesięczny zysk',
      totalDeposits: 'Łączne wpłaty',
      totalWithdrawals: 'Łączne wypłaty',
      signals: 'Liczba sygnałów dziennie',
      signalInfo: 'Jeden sygnał = 0.6% dziennego zysku',
      currentBalance: 'Aktualny stan konta',
      investmentStats: 'Statystyki inwestycji',
      profitForecast: 'Prognoza zysków',
      withdrawalPlanning: 'Planowanie wypłat',
      depositPlanning: 'Planowanie wpłat',
      dashboard: 'Dashboard',
      settings: 'Ustawienia',
      logout: 'Wyloguj',
      edit: 'Edytuj',
      cancel: 'Anuluj',
      ok: 'OK',
      selectPeriod: 'Wybierz okres',
      totalProfit: 'Całkowity zysk',
      dailyAverage: 'Średni dzienny zysk',
      months: {
        1: 'miesiąc',
        2: 'miesiące',
        3: 'miesiące',
        4: 'miesiące',
        5: 'miesięcy'
      },
      editBalance: 'Edytuj stan konta',
      monthlyWithdrawal: 'Miesięczna wypłata',
      valueInUSDT: 'Wartość w USDT',
      withdrawalPossibleFrom: 'Wypłata będzie możliwa od',
      withdrawalFee: 'Opłata za wypłatę',
      higherFeeDueToIncompleteTurnover: 'Wyższa opłata ze względu na niepełny obrót środków',
      standardFeeFullTurnover: 'Standardowa opłata - pełny obrót środków',
      startWithdrawalsFromMonth: 'Rozpocznij wypłaty od miesiąca',
      immediately: 'Natychmiast',
      chooseLaterMonth: 'Wybierz późniejszy miesiąc - kapitał musi wzrosnąć',
      month: 'Miesiąc',
      capital: 'Kapitał',
      growth: 'Wzrost',
      withdrawal: 'Wypłata',
      withdrawals: 'Wypłaty',
      fee: 'Opłata',
      depositAmount: 'Kwota wpłaty',
      depositDate: 'Data wpłaty',
      turnoverRequired: 'Wymagany obrót',
      turnoverInfo: 'Kapitał musi zostać obrócony w całości przed możliwością wypłaty',
      days: 'dni',
      turnover: 'Obrót',
      status: 'Status',
      completed: 'Zakończony',
      inProgress: 'W trakcie',
      daysLeft: 'Pozostało dni',
      date: 'Data',
      amount: 'Kwota',
      turnoverStatus: 'Status obrotu',
      turnoverProgress: 'Postęp obrotu',
      completionDate: 'Data zakończenia',
      actions: 'Akcje',
      currently: 'Aktualnie',
      totalProfits: 'Suma zysków',
      confirmDelete: 'Czy na pewno chcesz usunąć tę wpłatę?',
      confirmReset: 'Czy na pewno chcesz zresetować aplikację? Wszystkie dane zostaną usunięte.',
      resetApp: 'Resetuj aplikację',
      addDeposit: 'Dodaj wpłatę',
      withdrawalWarning: 'Uwaga: Wypłata przekracza miesięczny zysk',
      activeTurnovers: 'Aktywne obroty w toku',
      additionalDailyProfit: 'Dodatkowy zysk transakcji dziennych',
      projectedTotalProfit: 'Przewidywany zysk całkowity',
      turnoverProfit: 'Zysk z obrotu',
      expectedDepositProfit: 'Przewidywany zysk z wpłaty',
      finalBalance: 'Stan końcowy',
      balanceWithoutDeposit: 'Stan bez wpłaty',
      activeDeposits: 'Aktywne wpłaty',
      remainingDays: 'Pozostało dni',
      progress: 'Postęp',
      expectedProfit: 'Przewidywany zysk',
      noActiveDeposits: 'Brak aktywnych wpłat',
      exportHistory: 'Eksportuj historię',
      importHistory: 'Importuj historię',
      confirmImport: 'Czy na pewno chcesz zaimportować nową historię? Obecna historia zostanie zastąpiona.',
      invalidImportFormat: 'Nieprawidłowy format pliku. Plik musi zawierać tablicę wpłat.',
      importError: 'Wystąpił błąd podczas importowania historii.',
      hours: 'godzin',
      loadError: 'Wystąpił błąd podczas wczytywania wpłat',
      addError: 'Wystąpił błąd podczas dodawania wpłaty',
      deleteError: 'Wystąpił błąd podczas usuwania wpłaty',
      savePlanError: 'Wystąpił błąd podczas zapisywania planu',
      loadPlanError: 'Wystąpił błąd podczas wczytywania planu',
      planSaved: 'Plan został zapisany',
      planLoaded: 'Plan został wczytany',
      savePlan: 'Zapisz plan',
      loadPlan: 'Wczytaj plan',
      reset: 'Resetuj plan',
      withdrawalNotPossible: 'Ta kwota wypłaty nie będzie możliwa do osiągnięcia w ciągu najbliższych 5 lat',
      capitalDepletion: 'Suma wypłat przekroczy początkowy kapitał w',
      capitalDecline: 'Kapitał zacznie maleć od',
      tooEarly: 'za wcześnie',
      profitStatistics: 'Statystyki zysków',
    },
    en: {
      appName: 'Investment Tracker',
      balance: 'Balance',
      dailyProfit: 'Daily Profit',
      monthlyProfit: 'Monthly Profit',
      totalDeposits: 'Total Deposits',
      totalWithdrawals: 'Total Withdrawals',
      signals: 'Daily Signals',
      signalInfo: 'One signal = 0.6% daily profit',
      currentBalance: 'Current Balance',
      investmentStats: 'Investment Statistics',
      profitForecast: 'Profit Forecast',
      withdrawalPlanning: 'Withdrawal Planning',
      depositPlanning: 'Deposit Planning',
      dashboard: 'Dashboard',
      settings: 'Settings',
      logout: 'Logout',
      edit: 'Edit',
      cancel: 'Cancel',
      ok: 'OK',
      selectPeriod: 'Select Period',
      totalProfit: 'Total Profit',
      dailyAverage: 'Daily Average',
      months: {
        1: 'month',
        2: 'months',
        3: 'months',
        4: 'months',
        5: 'months'
      },
      editBalance: 'Edit Balance',
      monthlyWithdrawal: 'Monthly Withdrawal',
      valueInUSDT: 'Value in USDT',
      withdrawalPossibleFrom: 'Withdrawal will be possible from',
      withdrawalFee: 'Withdrawal Fee',
      higherFeeDueToIncompleteTurnover: 'Higher fee due to incomplete turnover',
      standardFeeFullTurnover: 'Standard fee - full turnover',
      startWithdrawalsFromMonth: 'Start withdrawals from month',
      immediately: 'Immediately',
      chooseLaterMonth: 'Choose a later month - capital needs to grow',
      month: 'Month',
      capital: 'Capital',
      growth: 'Growth',
      withdrawal: 'Withdrawal',
      withdrawals: 'Withdrawals',
      fee: 'Fee',
      depositAmount: 'Deposit Amount',
      depositDate: 'Deposit Date',
      turnoverRequired: 'Required Turnover',
      turnoverInfo: 'Capital must be fully turned over before withdrawal is possible',
      days: 'days',
      turnover: 'Turnover',
      status: 'Status',
      completed: 'Completed',
      inProgress: 'In Progress',
      daysLeft: 'Days Left',
      date: 'Date',
      amount: 'Amount',
      turnoverStatus: 'Turnover Status',
      turnoverProgress: 'Turnover Progress',
      completionDate: 'Completion Date',
      actions: 'Actions',
      currently: 'Currently',
      totalProfits: 'Total Profits',
      confirmDelete: 'Are you sure you want to delete this deposit?',
      confirmReset: 'Are you sure you want to reset the application? All data will be deleted.',
      resetApp: 'Reset Application',
      addDeposit: 'Add Deposit',
      withdrawalWarning: 'Warning: Withdrawal exceeds monthly profit',
      activeTurnovers: 'Active turnovers in progress',
      additionalDailyProfit: 'Additional daily transaction profit',
      projectedTotalProfit: 'Projected total profit',
      turnoverProfit: 'Turnover profit',
      expectedDepositProfit: 'Expected deposit profit',
      finalBalance: 'Final balance',
      balanceWithoutDeposit: 'Balance without deposit',
      activeDeposits: 'Active Deposits',
      remainingDays: 'Days Remaining',
      progress: 'Progress',
      expectedProfit: 'Expected Profit',
      noActiveDeposits: 'No active deposits',
      exportHistory: 'Export History',
      importHistory: 'Import History',
      confirmImport: 'Are you sure you want to import new history? Current history will be replaced.',
      invalidImportFormat: 'Invalid file format. File must contain an array of deposits.',
      importError: 'An error occurred while importing history.',
      hours: 'hours',
      loadError: 'An error occurred while loading deposits',
      addError: 'An error occurred while adding deposit',
      deleteError: 'An error occurred while deleting deposit',
      savePlanError: 'An error occurred while saving plan',
      loadPlanError: 'An error occurred while loading plan',
      planSaved: 'Plan has been saved',
      planLoaded: 'Plan has been loaded',
      savePlan: 'Save plan',
      loadPlan: 'Load plan',
      reset: 'Reset plan',
      withdrawalNotPossible: 'This withdrawal amount will not be achievable within the next 5 years',
      capitalDepletion: 'Total withdrawals will exceed initial capital in',
      capitalDecline: 'Capital will start decreasing from',
      tooEarly: 'too early',
      profitStatistics: 'Profit Statistics',
    }
  };

  const [exchangeRates, setExchangeRates] = useState({
    PLN: 4.0,
    EUR: 0.92
  });

  const [isEditingSignals, setIsEditingSignals] = useState(false);
  const [editSignalsValue, setEditSignalsValue] = useState('3');

  // Oblicz dzienny przyrost
  useEffect(() => {
    const dailyReturn = 0.006; // 0.6% dziennego zwrotu
    const profit = currentBalance * dailyReturn * dailySignals;
    setDailyProfit(profit);
  }, [currentBalance, dailySignals]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
      fetchUserData(userData.token);
    } else {
      setLoading(false);
    }
    
    // Pobierz kursy walut
    fetchExchangeRates();
  }, []);

  const fetchUserData = async (token) => {
    try {
      const [portfolio, transactions] = await Promise.all([
        getPortfolio(token),
        getTransactions(token)
      ]);
      
      if (portfolio) {
        setCurrentBalance(Number(portfolio.current_balance) || 0);
        setDailySignals(Number(portfolio.daily_signals) || 3);
      }
      
      if (transactions) {
        setInvestmentHistory(transactions);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Błąd podczas pobierania danych:', error);
      setError('Wystąpił błąd podczas pobierania danych');
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USDT');
      const data = await response.json();
      setExchangeRates({
        PLN: data.rates.PLN || 4.0,
        EUR: data.rates.EUR || 0.92
      });
    } catch (error) {
      console.error('Błąd podczas pobierania kursów walut:', error);
      // Zachowaj domyślne kursy w przypadku błędu
    }
  };

  const handleLogin = (response) => {
    const { token, userId, username } = response;
    const userData = { token, userId, username };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    fetchUserData(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentBalance(0);
    setDailySignals(3);
    setInvestmentHistory([]);
  };

  const handlePortfolioUpdate = async (field, value) => {
    try {
      if (field === 'currentBalance') {
        const numValue = Number(value) || 0;
        setCurrentBalance(numValue);
        if (user && user.token) {
          await updatePortfolio(user.token, {
            current_balance: numValue,
            daily_signals: dailySignals
          });
        }
      } else if (field === 'dailySignals') {
        const numValue = Number(value) || 3;
        setDailySignals(numValue);
        if (user && user.token) {
          await updatePortfolio(user.token, {
            current_balance: currentBalance,
            daily_signals: numValue
          });
        }
      }
    } catch (error) {
      console.error('Błąd podczas aktualizacji portfela:', error);
      setError('Wystąpił błąd podczas aktualizacji danych');
    }
  };

  // Modyfikacja handleBalanceEdit
  const handleBalanceEdit = (e) => {
    e.preventDefault();
    const newBalance = parseFloat(editValue);
    if (!isNaN(newBalance) && newBalance >= 0) {
      updateBalance(newBalance);
      setIsEditingBalance(false);
    }
  };

  const formatBalance = (balance, currency) => {
    const rate = exchangeRates[currency];
    const converted = balance * rate;
    return {
      main: balance.toFixed(2) + ' USDT',
      converted: `(${converted.toFixed(2)} ${currency})`
    };
  };

  const handleSignalsEdit = (e) => {
    e.preventDefault();
    const newSignals = parseInt(editSignalsValue);
    if (!isNaN(newSignals) && newSignals >= 0) {
      updateDailySignals(newSignals);
      setIsEditingSignals(false);
    }
  };

  const handleSignalsChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      updateDailySignals(value);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Ładowanie...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-700 p-4">
        <div className="w-full max-w-md">
          <Auth onLogin={handleLogin} defaultLanguage={selectedLanguage} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && (
        <>
          {/* Nagłówek */}
          <header className="bg-blue-600 text-white shadow-md mobile-header">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col p-4 header-content">
                {/* Górny pasek z logo i przyciskami */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-4">
                    <img src="/logo.svg" alt="Logo" className="w-12 h-12" />
                    <h1 className="text-xl font-bold">{translations[selectedLanguage].appName}</h1>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      className="bg-blue-700 p-2 rounded-full hover:bg-blue-800 transition-colors relative group"
                      onClick={() => setSelectedLanguage(selectedLanguage === 'pl' ? 'en' : 'pl')}
                      title={selectedLanguage === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden shadow-md border border-gray-300">
                        {selectedLanguage === 'pl' ? <PolishFlag /> : <UKFlag />}
                      </div>
                    </button>
                    <button 
                      className="bg-blue-700 p-2 rounded-full hover:bg-red-600 transition-colors flex items-center" 
                      onClick={handleLogout}
                      aria-label="Wyloguj"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Stan konta w osobnym kontenerze */}
                <div className="w-full text-white bg-blue-800 px-4 py-2 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm mr-2">{translations[selectedLanguage].balance}:</span>
                    {isEditingBalance ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateBalance(parseFloat(editValue));
                              setIsEditingBalance(false);
                            }
                          }}
                          onBlur={() => {
                            updateBalance(parseFloat(editValue));
                            setIsEditingBalance(false);
                          }}
                          className="w-32 p-1 text-gray-800 border rounded"
                          step="0.01"
                          min="0"
                          autoFocus
                        />
                        <span className="font-bold">USDT</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div 
                          className="flex items-center cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setEditValue(currentBalance.toString());
                            setIsEditingBalance(true);
                          }}
                        >
                          <span className="text-lg font-semibold">{currentBalance.toFixed(2)} USDT</span>
                          <span className="text-sm text-blue-200 ml-2">({(currentBalance * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency})</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditValue(currentBalance.toString());
                            setIsEditingBalance(true);
                          }}
                          className="p-1 hover:bg-blue-700 rounded-full transition-colors ml-2"
                          title={translations[selectedLanguage].editBalance}
                        >
                          <Pencil className="text-white" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Menu nawigacyjne dla desktopów */}
          <nav className="bg-white shadow-md hidden md:block">
            <div className="flex p-4 space-x-2">
              <button
                className={`flex items-center justify-center space-x-1 p-3 ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-600 rounded-md' : 'text-gray-600'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <TrendingUp size={18} />
                <span>{translations[selectedLanguage].dashboard}</span>
              </button>
              <button
                className={`flex items-center justify-center space-x-1 p-3 ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-600 rounded-md' : 'text-gray-600'}`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart2 size={18} />
                <span>{translations[selectedLanguage].withdrawalPlanning}</span>
              </button>
              <button
                className={`flex items-center justify-center space-x-2 p-3 rounded ${
                  activeTab === 'deposits' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('deposits')}
              >
                <Clock size={18} />
                <span>{translations[selectedLanguage].depositPlanning}</span>
              </button>
            </div>
          </nav>

          {/* Główna zawartość */}
          <main className="flex-1 p-4 overflow-auto with-mobile-nav">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aktualny stan konta */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h2 className="text-lg font-semibold mb-4">{translations[selectedLanguage].currentBalance}</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="w-full">
                          <p className="text-sm text-gray-600">{translations[selectedLanguage].balance}</p>
                          {isEditingBalance ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-32 p-1 text-xl font-bold border rounded"
                                step="0.01"
                                min="0"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  const newBalance = parseFloat(editValue);
                                  if (!isNaN(newBalance) && newBalance >= 0) {
                                    handlePortfolioUpdate('currentBalance', newBalance);
                                    setIsEditingBalance(false);
                                    setEditValue('');
                                  }
                                }}
                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingBalance(false);
                                  setEditValue('');
                                }}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center space-x-2 cursor-pointer group hover:bg-indigo-100 p-2 rounded-lg transition-colors"
                              onClick={() => {
                                setEditValue(currentBalance.toString());
                                setIsEditingBalance(true);
                              }}
                            >
                              <div>
                                <p className="text-2xl font-bold group-hover:text-blue-600 transition-colors">
                                  {currentBalance.toFixed(2)} USDT
                                </p>
                                <p className="text-sm text-gray-500">
                                  {(currentBalance * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}
                                </p>
                              </div>
                              <Pencil className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                            </div>
                          )}
                        </div>
                        <DollarSign className="text-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <Dashboard
                  currentBalance={currentBalance}
                  updateBalance={setCurrentBalance}
                  dailySignals={dailySignals}
                  updateDailySignals={setDailySignals}
                  selectedCurrency={selectedCurrency}
                  exchangeRates={exchangeRates}
                  translations={translations}
                  selectedLanguage={selectedLanguage}
                  history={investmentHistory}
                />
              </div>
            )}


            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 gap-4">
                <WithdrawalPlanner
                  currentBalance={currentBalance}
                  dailySignals={dailySignals}
                  selectedCurrency={selectedCurrency}
                  exchangeRates={exchangeRates}
                  deposits={deposits}
                  withdrawalPlan={withdrawalPlan}
                  setWithdrawalPlan={setWithdrawalPlan}
                  translations={translations}
                  selectedLanguage={selectedLanguage}
                />
              </div>
            )}

            {activeTab === 'deposits' && (
              <div>
                <InvestmentHistory
                  history={investmentHistory}
                  setHistory={setInvestmentHistory}
                  currentBalance={currentBalance}
                  setCurrentBalance={updateBalance}
                  dailySignals={dailySignals}
                  translations={translations}
                  selectedLanguage={selectedLanguage}
                  selectedCurrency={selectedCurrency}
                  exchangeRates={exchangeRates}
                  dailyRateOfReturn={(dailySignals * 0.6)}
                  balance={currentBalance}
                  totalDeposits={deposits.reduce((sum, deposit) => sum + deposit.amount, 0)}
                  setTotalDeposits={(newDeposits) => {
                    setDeposits(newDeposits);
                  }}
                  dailyCapital={0}
                  setDailyCapital={(newCapital) => {
                    // This is a placeholder implementation. You might want to update the state accordingly
                  }}
                />
                <div className="mt-4 bg-amber-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="text-amber-500 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {selectedLanguage === 'pl' ? 'Informacja o opłatach za wypłaty' : 'Withdrawal fees information'}
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>
                          {selectedLanguage === 'pl' 
                            ? 'Wypłata przed pełnym obrotem: opłata 20% od kwoty transakcji' 
                            : 'Early withdrawal (before full turnover): 20% fee of transaction amount'}
                        </li>
                        <li>
                          {selectedLanguage === 'pl'
                            ? 'Wypłata po pełnym obrocie: opłata 5% od kwoty transakcji'
                            : 'Withdrawal after full turnover: 5% fee of transaction amount'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Mobilne menu nawigacyjne */}
          <nav className="mobile-nav md:hidden">
            <button
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              <TrendingUp size={20} />
              <span>{translations[selectedLanguage].dashboard}</span>
            </button>
            <button 
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart2 size={20} />
              <span>{translations[selectedLanguage].withdrawalPlanning}</span>
            </button>
            <button
              className={activeTab === 'deposits' ? 'active' : ''}
              onClick={() => setActiveTab('deposits')}
            >
              <Clock size={20} />
              <span>{translations[selectedLanguage].depositPlanning}</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
};

export default App; 