import type { Route } from "./+types/contact";
import { useState } from "react";
import { generateMetaTags } from "~/lib/utils";
import { useI18n } from "~/i18n";
import { QuickNav } from "~/components/QuickNav";
import { SecureForm, SecureInput, SecureTextarea } from "~/components/SecureForm";

export function meta({}: Route.MetaArgs) {
  return generateMetaTags({
    title: "Contact - Modern Blog Leader",
    description: "Get in touch with our team to learn more about our modern blogging platform.",
  });
}

export function headers(_: Route.HeadersArgs) {
  return {
    "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
  };
}

export default function Contact() {
  const { t } = useI18n();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Ici vous enverriez les données à votre API Strapi
      console.log('Données sécurisées reçues:', data);
      
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus('success');
    } catch (error) {
      console.error('Erreur:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Page indicator badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              Contact
            </div>
            
            <QuickNav />
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
              {t("contact.title").split(' ')[0]} <span className="text-gradient">{t("contact.title").split(' ')[1]}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              {t("contact.subtitle", "We'd love to hear from you. Send us a message and we'll respond as soon as possible.")}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Messages de statut */}
          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {t("contact.success", "Votre message a été envoyé avec succès !")}
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {t("contact.error", "Une erreur est survenue. Veuillez réessayer.")}
            </div>
          )}

          <SecureForm 
            action="/api/contact" 
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <SecureInput
              id="name"
              name="name"
              type="text"
              label={t("contact.name", "Nom")}
              required
              maxLength={100}
              placeholder={t("contact.namePlaceholder", "Votre nom complet")}
            />

            <SecureInput
              id="email"
              name="email"
              type="email"
              label={t("contact.email", "Email")}
              required
              maxLength={254}
              placeholder={t("contact.emailPlaceholder", "votre.email@exemple.com")}
            />

            <SecureInput
              id="subject"
              name="subject"
              type="text"
              label={t("contact.subject", "Sujet")}
              required
              maxLength={200}
              placeholder={t("contact.subjectPlaceholder", "Objet de votre message")}
            />

            <SecureTextarea
              id="message"
              name="message"
              label={t("contact.message", "Message")}
              required
              rows={6}
              maxLength={2000}
              placeholder={t("contact.messagePlaceholder", "Votre message...")}
            />
          </SecureForm>
        </div>
      </section>
    </div>
  );
}