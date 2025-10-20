import React, { useState } from 'react';
import { useSecureForm, useCSRFProtection } from '~/hooks/useSecurity';

interface SecureFormProps {
  action: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  onSubmit?: (data: Record<string, any>) => Promise<void>;
  children: React.ReactNode;
  maxSubmissions?: number;
  className?: string;
}

export function SecureForm({ 
  action, 
  method = 'POST', 
  onSubmit, 
  children, 
  maxSubmissions = 3,
  className = '',
}: SecureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitCount, setSubmitCount] = useState(0);
  
  const { validateAndSanitize, checkRateLimit } = useSecureForm();
  const { generateToken } = useCSRFProtection();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Vérifier le rate limiting
    if (!checkRateLimit(action, maxSubmissions)) {
      setErrors({ form: 'Trop de tentatives. Veuillez patienter.' });
      return;
    }

    // Limiter les soumissions consécutives
    if (submitCount >= maxSubmissions) {
      setErrors({ form: 'Limite de soumissions atteinte. Rechargez la page.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Validation et nettoyage
    const { sanitized, errors: validationErrors, isValid } = validateAndSanitize(data);

    if (!isValid) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(sanitized);
      } else {
        // Soumission classique
        const response = await fetch(action, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': generateToken(),
          },
          body: JSON.stringify(sanitized),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Réinitialiser le formulaire en cas de succès
      event.currentTarget.reset();
      setSubmitCount(prev => prev + 1);
      
    } catch (error) {
      console.error('Erreur de soumission:', error);
      setErrors({ 
        form: error instanceof Error ? error.message : 'Erreur de soumission' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`secure-form ${className}`}
      noValidate
    >
      {/* Token CSRF automatique */}
      <input type="hidden" name="csrf_token" value={generateToken()} />
      
      {/* Messages d'erreur globaux */}
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {errors.form}
        </div>
      )}

      {/* Contenu du formulaire */}
      <div className="space-y-4">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const fieldName = child.props.name;
            return (
              <div key={fieldName}>
                {child}
                {errors[fieldName] && (
                  <p className="text-red-600 text-sm mt-1">{errors[fieldName]}</p>
                )}
              </div>
            );
          }
          return child;
        })}
      </div>

      {/* Bouton de soumission */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting || submitCount >= maxSubmissions}
          className={`
            w-full px-6 py-3 rounded-lg font-medium transition-colors
            ${isSubmitting || submitCount >= maxSubmissions
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          `}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
        </button>
        
        {submitCount >= maxSubmissions && (
          <p className="text-amber-600 text-sm mt-2">
            Limite atteinte. Rechargez la page pour renvoyer.
          </p>
        )}
      </div>
    </form>
  );
}

// Composant d'input sécurisé
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function SecureInput({ 
  label, 
  error, 
  required = false, 
  className = '', 
  ...props 
}: SecureInputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${className}
        `}
        aria-describedby={error ? `${props.id}-error` : undefined}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-red-600 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// Composant de textarea sécurisé
interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function SecureTextarea({ 
  label, 
  error, 
  required = false, 
  className = '', 
  ...props 
}: SecureTextareaProps) {
  return (
    <div className="mb-4">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        {...props}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:ring-blue-500 focus:border-blue-500 resize-vertical
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${className}
        `}
        aria-describedby={error ? `${props.id}-error` : undefined}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-red-600 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}