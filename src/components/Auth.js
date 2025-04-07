import React, { useState, useEffect } from 'react';
import { login, register, requestPasswordReset, resetPassword } from '../api';

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
  <img src="/uk flag.svg" alt="UK flag" className="w-8 h-8 object-cover" />
);

const Auth = ({ onLogin, defaultLanguage = 'pl' }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isSetNewPassword, setIsSetNewPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [language, setLanguage] = useState(defaultLanguage); // Używamy domyślnego języka z props
  const [isIOS, setIsIOS] = useState(false); // Flaga do wykrywania urządzeń iOS

  // Teksty w różnych językach
  const translations = {
    pl: {
      appTitle: 'Investment Tracker',
      login: 'Logowanie',
      register: 'Rejestracja',
      resetPassword: 'Resetowanie hasła',
      setNewPassword: 'Ustaw nowe hasło',
      email: 'Email',
      emailAddress: 'Adres email',
      password: 'Hasło',
      newPassword: 'Nowe hasło',
      confirmPassword: 'Potwierdź nowe hasło',
      loginButton: 'Zaloguj się',
      registerButton: 'Zarejestruj się',
      sendResetLinkButton: 'Wyślij link resetujący',
      savePasswordButton: 'Zapisz nowe hasło',
      processing: 'Przetwarzanie...',
      noAccount: 'Nie masz konta? Zarejestruj się',
      haveAccount: 'Masz już konto? Zaloguj się',
      forgotPassword: 'Zapomniałeś hasła?',
      backToLogin: 'Powrót do logowania',
      goToLogin: 'Przejdź do logowania',
      provideEmail: 'Podaj adres email przypisany do Twojego konta.',
      validEmailRequired: 'Wymagany prawidłowy adres email',
      passwordRequirements: 'Hasło musi zawierać co najmniej 8 znaków, w tym dużą literę, małą literę, cyfrę i znak specjalny.',
      passwordMinLength: 'Hasło musi mieć co najmniej 8 znaków',
      passwordComplexity: 'Hasło musi zawierać dużą literę, małą literę, cyfrę i znak specjalny',
      passwordsNotMatch: 'Hasła nie są identyczne',
      switchToEnglish: 'Switch to English',
    },
    en: {
      appTitle: 'Investment Tracker',
      login: 'Login',
      register: 'Register',
      resetPassword: 'Reset Password',
      setNewPassword: 'Set New Password',
      email: 'Email',
      emailAddress: 'Email Address',
      password: 'Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      loginButton: 'Login',
      registerButton: 'Register',
      sendResetLinkButton: 'Send Reset Link',
      savePasswordButton: 'Save New Password',
      processing: 'Processing...',
      noAccount: "Don't have an account? Register",
      haveAccount: 'Already have an account? Login',
      forgotPassword: 'Forgot password?',
      backToLogin: 'Back to Login',
      goToLogin: 'Go to Login',
      provideEmail: 'Enter the email address associated with your account.',
      validEmailRequired: 'Valid email address required',
      passwordRequirements: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character.',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordComplexity: 'Password must include uppercase, lowercase, number and special character',
      passwordsNotMatch: 'Passwords do not match',
      switchToPolish: 'Przełącz na polski',
    }
  };

  // Wykrywanie urządzeń iOS przy montowaniu komponentu
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
    
    if (isIOSDevice) {
      console.log('Wykryto urządzenie iOS - używanie alternatywnej metody logowania');
    }
  }, []);

  // Sprawdza token w URL (dla linku resetowania hasła)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setIsSetNewPassword(true);
      setIsLogin(false);
      setIsResetPassword(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Prosta walidacja dla wszystkich formularzy
    if (isLogin) {
      if (username.trim() === '' || password === '') {
        setError('Email i hasło są wymagane');
        return;
      }
    }
    
    // Lokalna walidacja przed wysłaniem
    if (!isLogin && !isResetPassword && !isSetNewPassword) {
      // Walidacja formatu email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(username)) {
        setError(translations[language].validEmailRequired);
        return;
      }
      
      // Walidacja hasła
      if (password.length < 8) {
        setError(translations[language].passwordMinLength);
        return;
      }
      
      // Sprawdzenie, czy hasło zawiera wymagane znaki
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      if (!(hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar)) {
        setError(translations[language].passwordComplexity);
        return;
      }
    }
    
    setLoading(true);

    try {
      let response;
      
      if (isLogin) {
        // Specjalna logika dla urządzeń iOS
        if (isIOS) {
          try {
            // Najpierw próbujemy standardowej metody
            response = await login(username, password);
          } catch (iosError) {
            console.error('Błąd logowania na iOS, próba alternatywnej metody:', iosError);
            
            // Alternatywna metoda dla iOS - używamy dedykowanego endpointu
            const apiUrl = process.env.NODE_ENV === 'production'
              ? `${window.location.origin}/api/login-ios`
              : 'http://localhost:5000/api/login-ios';
            
            // Próba 1: Użycie FormData zamiast JSON
            try {
              const formData = new FormData();
              formData.append('username', username.trim());
              formData.append('password', password);
              
              const formResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                },
                credentials: 'include',
                body: formData
              });
              
              if (!formResponse.ok) {
                const errorText = await formResponse.text();
                console.error('Błąd FormData:', errorText);
                throw new Error(`Błąd HTTP: ${formResponse.status} - ${errorText}`);
              }
              
              response = await formResponse.json();
            } catch (formError) {
              console.error('Próba FormData nie powiodła się:', formError);
              
              // Próba 2: Użycie zwykłego fetch z JSON
              try {
                const fetchResponse = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    username: username.trim(),
                    password
                  }),
                });
                
                if (!fetchResponse.ok) {
                  const errorText = await fetchResponse.text();
                  console.error('Błąd JSON:', errorText);
                  throw new Error(`Błąd HTTP: ${fetchResponse.status} - ${errorText}`);
                }
                
                response = await fetchResponse.json();
              } catch (fetchError) {
                console.error('Próba JSON nie powiodła się:', fetchError);
                throw new Error('Wystąpił błąd podczas logowania. Spróbuj ponownie później.');
              }
            }
          }
        } else {
          // Standardowa metoda dla innych urządzeń
          response = await login(username, password);
        }
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('username', response.username);
        onLogin(response);
      } else if (isResetPassword) {
        response = await requestPasswordReset(resetEmail);
        setResetMessage(response.message);
        // W trybie deweloperskim możemy pokazać token i URL do testowania
        if (response.resetToken) {
          setResetToken(response.resetToken);
          setIsSetNewPassword(true);
          setIsResetPassword(false);
        }
      } else if (isSetNewPassword) {
        // Walidacja nowego hasła
        if (newPassword.length < 8) {
          setError(translations[language].passwordMinLength);
          setLoading(false);
          return;
        }
        
        // Sprawdzenie, czy hasło zawiera wymagane znaki
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasDigit = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
        
        if (!(hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar)) {
          setError(translations[language].passwordComplexity);
          setLoading(false);
          return;
        }
        
        // Sprawdzenie, czy hasła są zgodne
        if (newPassword !== confirmPassword) {
          setError(translations[language].passwordsNotMatch);
          setLoading(false);
          return;
        }
        
        response = await resetPassword(resetToken, newPassword);
        setResetSuccess(true);
        setResetMessage(response.message);
      } else {
        response = await register(username, password);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('username', response.username);
        onLogin(response);
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      
      // Lepsze komunikaty błędów, szczególnie dla iOS
      if (err.message.includes('SyntaxError') || err.message.includes('Unexpected token')) {
        setError('Problem z połączeniem. Spróbuj ponownie.');
      } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError('Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderResetPasswordForm = () => (
    <>
      <h5 className="text-center mb-4 text-white text-xl">{translations[language].resetPassword}</h5>
      {resetMessage && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
          {resetMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-white mb-2">{translations[language].emailAddress}</label>
          <input
            type="email"
            className="w-full p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            placeholder="adres@email.com"
          />
          <small className="text-blue-200">
            {translations[language].provideEmail}
          </small>
        </div>
        <div className="mb-4">
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? translations[language].processing : translations[language].sendResetLinkButton}
          </button>
        </div>
      </form>
      <div className="text-center">
        <button
          className="text-blue-200 hover:text-white"
          onClick={() => {
            setIsResetPassword(false);
            setIsLogin(true);
            setError('');
            setResetMessage('');
          }}
        >
          {translations[language].backToLogin}
        </button>
      </div>
    </>
  );

  const renderSetNewPasswordForm = () => (
    <>
      <h5 className="text-center mb-4 text-white text-xl">{translations[language].setNewPassword}</h5>
      {resetSuccess ? (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          {resetMessage}
          <div className="mt-3">
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => {
                setIsSetNewPassword(false);
                setIsLogin(true);
                setError('');
                setResetMessage('');
                setResetSuccess(false);
              }}
            >
              {translations[language].goToLogin}
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-white mb-2">{translations[language].newPassword}</label>
              <input
                type="password"
                className="w-full p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="8"
                title={translations[language].passwordRequirements}
              />
              <small className="text-blue-200">
                {translations[language].passwordRequirements}
              </small>
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">{translations[language].confirmPassword}</label>
              <input
                type="password"
                className="w-full p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? translations[language].processing : translations[language].savePasswordButton}
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );

  const renderLoginOrRegisterForm = () => (
    <>
      {!isLogin && (
        <h5 className="text-center mb-4 text-white text-xl">
          {translations[language].register}
        </h5>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-white mb-2">{isLogin ? translations[language].email : translations[language].emailAddress}</label>
          <input
            type="email"
            className="w-full p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="adres@email.com"
          />
          {!isLogin && <small className="text-blue-200">{translations[language].validEmailRequired}</small>}
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">{translations[language].password}</label>
          <input
            type="password"
            className="w-full p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? "1" : "8"}
            title={translations[language].passwordRequirements}
          />
          {!isLogin && (
            <small className="text-blue-200">
              {translations[language].passwordRequirements}
            </small>
          )}
        </div>

        <div className="mb-4">
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? translations[language].processing : (isLogin ? translations[language].loginButton : translations[language].registerButton)}
          </button>
        </div>
      </form>

      <div className="text-center">
        <button
          className="text-blue-200 hover:text-white"
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
        >
          {isLogin ? translations[language].noAccount : translations[language].haveAccount}
        </button>
        
        {isLogin && (
          <div className="mt-2">
            <button
              className="text-blue-200 hover:text-white"
              onClick={() => {
                setIsResetPassword(true);
                setIsLogin(false);
                setError('');
              }}
            >
              {translations[language].forgotPassword}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="bg-blue-600 shadow-lg rounded-lg overflow-hidden">
      <div className="text-center py-4 border-b border-blue-500 relative">
        <div className="absolute top-4 right-4">
          <button 
            className="p-2 rounded-full hover:bg-blue-500 transition-colors relative"
            onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
            title={language === 'pl' ? translations.pl.switchToEnglish : translations.en.switchToPolish}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-md border border-gray-300">
              {language === 'pl' ? <PolishFlag /> : <UKFlag />}
            </div>
          </button>
        </div>
        <img src="/logo.svg" alt="Logo" className="w-24 h-24 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-white">{translations[language].appTitle}</h1>
      </div>
      <div className="p-6">
        {isResetPassword ? renderResetPasswordForm() :
         isSetNewPassword ? renderSetNewPasswordForm() :
         renderLoginOrRegisterForm()}
      </div>
    </div>
  );
};

export default Auth; 