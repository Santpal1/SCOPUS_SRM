import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './PasswordReset.module.css';

interface PasswordResetProps {
  onClose?: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onClose }) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/password/reset-request', {
        email
      });

      if (response.data.success) {
        setMessage('Password reset link sent to your email');
        setStep('reset');
        // Show token if in development
        if (response.data.resetToken) {
          setToken(response.data.resetToken);
          setMessage(message + ` [Dev Token: ${response.data.resetToken}]`);
        }
      } else {
        setError(response.data.message || 'Failed to request reset');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/password/reset', {
        token,
        newPassword
      });

      if (response.data.success) {
        setSuccess(true);
        setMessage('Password reset successfully! You can now login.');
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Reset Password</h2>

        {success ? (
          <div className={styles.successMessage}>
            <CheckCircle size={48} color="#4caf50" />
            <p>{message}</p>
          </div>
        ) : (
          <>
            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className={styles.infoMessage}>
                <span>{message}</span>
              </div>
            )}

            {step === 'request' ? (
              <form onSubmit={handleRequestReset}>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={20} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className={styles.formGroup}>
                  <label>Reset Token</label>
                  <input
                    type="text"
                    placeholder="Enter token from email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={20} />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Confirm Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={20} />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setToken('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className={styles.cancelButton}
                >
                  Back
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;
